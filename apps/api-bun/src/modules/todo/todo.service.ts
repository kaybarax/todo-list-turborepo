import { type FilterQuery } from 'mongoose';

import { Todo, type TodoDocument, type ITodo } from './todo.model';
import { cache } from '../../cache';
import { NotFoundError } from '../../plugins/errors';
import { logger } from '../../plugins/logging';
import { type TodoQuery, type CreateTodoBody, type UpdateTodoBody } from '../../schemas/todo';
import { Trace } from '../../telemetry/trace.decorator';

export interface PaginatedTodos {
  todos: TodoDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TodoService {
  private readonly CACHE_TTL = 300; // 5 minutes

  @Trace('TodoService.create')
  async create(createTodoBody: CreateTodoBody, userId: string): Promise<TodoDocument> {
    const todoData = {
      ...createTodoBody,
      userId,
      dueDate: createTodoBody.dueDate ? new Date(createTodoBody.dueDate) : undefined,
    };

    const todo = await Todo.create(todoData);

    // Invalidate user's cached data
    await this.invalidateUserCache(userId);

    return todo;
  }

  @Trace('TodoService.findAll')
  async findAll(query: TodoQuery, userId: string): Promise<PaginatedTodos> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { completed, priority, blockchainNetwork, search, tag, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Generate cache key based on query parameters
    const filterString = JSON.stringify({ completed, priority, blockchainNetwork, search, tag, sortBy, sortOrder });
    const cacheKey = cache.generateUserTodosKey(userId, page, filterString);

    // Try to get from cache first
    const cachedResult = await cache.get<PaginatedTodos>(cacheKey);
    if (cachedResult) {
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
      Todo.find(filter)
        .sort(sort as any)
        .skip((page - 1) * limit)
        .limit(limit),
      Todo.countDocuments(filter),
    ]);

    const result = {
      todos,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };

    // Cache the result
    await cache.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  @Trace('TodoService.findOne')
  async findOne(id: string, userId: string): Promise<TodoDocument> {
    // Try cache first
    const cacheKey = cache.generateTodoKey(id);
    const cachedTodo = await cache.get<TodoDocument>(cacheKey);

    if (cachedTodo && cachedTodo.userId === userId) {
      return cachedTodo;
    }

    const todo = await Todo.findOne({ _id: id, userId });

    if (!todo) {
      throw new NotFoundError(`Todo with ID ${id} not found or access denied`);
    }

    // Cache the todo
    await cache.set(cacheKey, todo, this.CACHE_TTL);

    return todo;
  }

  @Trace('TodoService.update')
  async update(id: string, updateTodoBody: UpdateTodoBody, userId: string): Promise<TodoDocument> {
    const existing = await this.findOne(id, userId);

    const { dueDate, ...rest } = updateTodoBody;
    const updateData: Partial<ITodo> = { ...rest } as any;
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    // Update the document
    Object.assign(existing, updateData);
    const persisted = await existing.save();

    // Update cache and invalidate user cache
    await Promise.all([
      cache.set(cache.generateTodoKey(id), persisted, this.CACHE_TTL),
      this.invalidateUserCache(userId),
    ]);

    return persisted;
  }

  @Trace('TodoService.remove')
  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId); // Verify ownership
    const deleted = await Todo.deleteOne({ _id: id, userId });

    if (deleted.deletedCount === 0) {
      throw new NotFoundError(`Todo with ID ${id} not found`);
    }

    // Remove from cache and invalidate user cache
    await Promise.all([cache.del(cache.generateTodoKey(id)), this.invalidateUserCache(userId)]);
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
    const cacheKey = cache.generateUserStatsKey(userId);
    const cachedStats = await cache.get<any>(cacheKey);

    if (cachedStats) {
      return cachedStats;
    }

    const [total, completed, overdue, priorityStats, blockchainStats] = await Promise.all([
      Todo.countDocuments({ userId }),
      Todo.countDocuments({ userId, completed: true }),
      Todo.countDocuments({
        userId,
        completed: false,
        dueDate: { $lt: new Date() },
      }),
      Todo.aggregate([{ $match: { userId } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Todo.aggregate([
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

    // Ensure all priority levels are present
    ['low', 'medium', 'high'].forEach(p => {
      byPriority[p] ??= 0;
    });

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
    await cache.set(cacheKey, stats, 60); // 1 minute

    return stats;
  }

  @Trace('TodoService.toggleComplete')
  async toggleComplete(id: string, userId: string): Promise<TodoDocument> {
    const todo = await this.findOne(id, userId);
    todo.completed = !todo.completed;
    const persisted = await todo.save();

    await Promise.all([
      cache.set(cache.generateTodoKey(id), persisted, this.CACHE_TTL),
      this.invalidateUserCache(userId),
    ]);

    return persisted;
  }

  @Trace('TodoService.invalidateUserCache')
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      // Invalidate all user-related cache entries
      await Promise.all([
        cache.delPattern(cache.generateUserPattern(userId)),
        cache.del(cache.generateUserStatsKey(userId)),
      ]);
    } catch (error) {
      logger.error(`Error invalidating cache for user ${userId}:`, error);
    }
  }
}

export const todoService = new TodoService();
