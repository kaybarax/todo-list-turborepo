import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { FilterQuery } from 'mongoose';

import { TodoRepository } from './repositories/todo.repository';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CACHE_PORT, type CachePort } from '../cache/cache.port';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Trace } from '../telemetry/decorators/trace.decorator';

export interface PaginatedTodos {
  todos: Todo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly todoRepository: TodoRepository,

    @Inject(CACHE_PORT) private readonly cacheService: CachePort,
  ) {}

  async create(createTodoDto: CreateTodoDto, userId: string): Promise<Todo> {
    const todoData = {
      ...createTodoDto,
      userId,
      dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : undefined,
    };

    const todo = await this.todoRepository.create(todoData);

    // Invalidate user's cached data
    await this.invalidateUserCache(userId);

    return todo;
  }

  async findAll(queryDto: QueryTodoDto, userId: string): Promise<PaginatedTodos> {
    const { page, limit, completed, priority, blockchainNetwork, search, tag, sortBy, sortOrder } = queryDto;

    // Generate cache key based on query parameters
    const filterString = JSON.stringify({ completed, priority, blockchainNetwork, search, tag, sortBy, sortOrder });
    const cacheKey = this.cacheService.generateUserTodosKey(userId, page, filterString);

    // Try to get from cache first
    const cachedResult = await this.cacheService.get<PaginatedTodos>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for user ${userId} todos page ${page}`);
      return cachedResult;
    }

    // Build filter query
    const filter: FilterQuery<TodoDocument> = { userId };

    if (completed !== undefined) {
      filter.completed = completed;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (blockchainNetwork) {
      filter.blockchainNetwork = blockchainNetwork;
    }

    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    if (sortBy === 'priority') {
      // Custom priority sorting: high -> medium -> low
      sort.priority = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute queries
    const [todos, total] = await Promise.all([
      this.todoRepository.findMany(filter, {
        sort,
        skip: (page - 1) * limit,
        limit,
      }),
      this.todoRepository.count(filter),
    ]);

    const result = {
      todos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, this.CACHE_TTL);
    this.logger.debug(`Cache set for user ${userId} todos page ${page}`);

    return result;
  }

  async findOne(id: string, userId: string): Promise<Todo> {
    // Try cache first
    const cacheKey = this.cacheService.generateTodoKey(id);
    const cachedTodo = await this.cacheService.get<Todo>(cacheKey);

    if (cachedTodo && cachedTodo.userId === userId) {
      this.logger.debug(`Cache hit for todo ${id}`);
      return cachedTodo;
    }

    const todo = await this.todoRepository.findByIdAndUserId(id, userId);

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found or access denied`);
    }

    // Cache the todo
    await this.cacheService.set(cacheKey, todo, this.CACHE_TTL);

    return todo;
  }

  @Trace('TodoService.update')
  async update(id: string, updateTodoDto: UpdateTodoDto, userId: string): Promise<Todo> {
    // Fetch existing todo (tests mock this path and expect save to be called)
    const existing = await this.findOne(id, userId);

    const { dueDate, ...rest } = updateTodoDto;
    const updateData: Partial<Todo> = { ...rest };
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    // Mutate the in-memory document so tests can assert on Object.assign
    // Use a wrapper to allow spying in tests instead of relying on the native Object.assign
    this.applyUpdates(existing, updateData);

    // Prefer calling save() if the underlying object is a Mongoose document with that method.
    // Fallback to repository.updateById for plain objects.
    let persisted: Todo;
    if (typeof (existing as TodoDocument).save === 'function') {
      persisted = await (existing as TodoDocument).save();
    } else {
      const repoUpdated = await this.todoRepository.updateById(id, updateData);
      persisted = repoUpdated || existing; // safety fallback
    }

    // Update cache and invalidate user cache
    await Promise.all([
      this.cacheService.set(this.cacheService.generateTodoKey(id), persisted, this.CACHE_TTL),
      this.invalidateUserCache(userId),
    ]);

    return persisted;
  }

  @Trace('TodoService.remove')
  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // Verify ownership
    const deleted = await this.todoRepository.deleteById(id);

    if (!deleted) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Remove from cache and invalidate user cache
    await Promise.all([this.cacheService.del(this.cacheService.generateTodoKey(id)), this.invalidateUserCache(userId)]);
  }

  @Trace('TodoService.getStats')
  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    active: number;
    overdue: number;
    byPriority: Record<string, number>;
    byBlockchainNetwork: Record<string, number>;
  }> {
    // Try cache first
    const cacheKey = this.cacheService.generateUserStatsKey(userId);
    const cachedStats = await this.cacheService.get<{
      total: number;
      completed: number;
      active: number;
      overdue: number;
      byPriority: Record<string, number>;
      byBlockchainNetwork: Record<string, number>;
    }>(cacheKey);

    if (cachedStats) {
      this.logger.debug(`Cache hit for user ${userId} stats`);
      return cachedStats;
    }

    const [total, completed, overdue, priorityStats, blockchainStats] = await Promise.all([
      this.todoRepository.count({ userId }),
      this.todoRepository.count({ userId, completed: true }),
      this.todoRepository.count({
        userId,
        completed: false,
        dueDate: { $lt: new Date() },
      }),
      this.todoRepository.aggregate([{ $match: { userId } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      this.todoRepository.aggregate([
        { $match: { userId, blockchainNetwork: { $exists: true } } },
        { $group: { _id: '$blockchainNetwork', count: { $sum: 1 } } },
      ]),
    ]);

    const byPriority = priorityStats.reduce(
      (acc, stat: { _id: string; count: number }) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byBlockchainNetwork = blockchainStats.reduce(
      (acc, stat: { _id: string; count: number }) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const stats = {
      total,
      completed,
      active: total - completed,
      overdue,
      byPriority,
      byBlockchainNetwork,
    };

    // Cache the stats with shorter TTL since they change frequently
    await this.cacheService.set(cacheKey, stats, 60); // 1 minute

    return stats;
  }

  @Trace('TodoService.toggleComplete')
  async toggleComplete(id: string, userId: string): Promise<Todo> {
    const todo = await this.findOne(id, userId);
    todo.completed = !todo.completed;

    let persisted: Todo;
    if (typeof (todo as TodoDocument).save === 'function') {
      persisted = await (todo as TodoDocument).save();
    } else {
      const repoUpdated = await this.todoRepository.updateById(id, { completed: todo.completed });
      persisted = repoUpdated || todo;
    }

    await Promise.all([
      this.cacheService.set(this.cacheService.generateTodoKey(id), persisted, this.CACHE_TTL),
      this.invalidateUserCache(userId),
    ]);

    return persisted;
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      // Invalidate all user-related cache entries
      await Promise.all([
        this.cacheService.delPattern(this.cacheService.generateUserPattern(userId)),
        this.cacheService.del(this.cacheService.generateUserStatsKey(userId)),
      ]);

      this.logger.debug(`Cache invalidated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for user ${userId}:`, error);
    }
  }

  // Extracted for test spying (can spy on service['applyUpdates'])
  protected applyUpdates(target: object, source: object): void {
    Object.assign(target, source);
  }
}
