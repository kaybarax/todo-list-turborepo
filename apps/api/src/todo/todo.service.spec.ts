// Test file: allowing 'any' type for service mocking and test assertions
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { TodoRepository } from './repositories/todo.repository';
import { TodoService } from './todo.service';
import { CACHE_PORT, type CachePort } from '../cache/cache.port';
import { type CreateTodoDto } from './dto/create-todo.dto';
import { type QueryTodoDto } from './dto/query-todo.dto';
import { type UpdateTodoDto } from './dto/update-todo.dto';
import { type Todo } from './schemas/todo.schema';

describe('TodoService', () => {
  let service: TodoService;
  let todoRepository: jest.Mocked<TodoRepository>;
  let cacheService: jest.Mocked<CachePort>;

  const mockTodo: Todo = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    dueDate: new Date('2024-12-31'),
    tags: ['test'],
    userId: 'user123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    blockchainNetwork: 'polygon',
    transactionHash: '0x123',
  } as Todo;

  const mockUser = { id: 'user123' };

  beforeEach(async () => {
    const mockTodoRepository = {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findByIdAndUserId: jest.fn(),
      deleteById: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockCacheService: jest.Mocked<CachePort> = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
      generateUserTodosKey: jest.fn(),
      generateTodoKey: jest.fn(),
      generateUserStatsKey: jest.fn(),
      generateUserPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        {
          provide: TodoRepository,
          useValue: mockTodoRepository,
        },
        { provide: CACHE_PORT, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    todoRepository = module.get(TodoRepository);
    cacheService = module.get(CACHE_PORT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a todo successfully', async () => {
      const createTodoDto: CreateTodoDto = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
        dueDate: '2024-12-31',
        tags: ['new'],
      };

      const expectedTodo = { ...mockTodo, ...createTodoDto } as Todo;
      todoRepository.create.mockResolvedValue(expectedTodo);
      cacheService.delPattern.mockResolvedValue(undefined);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.generateUserPattern.mockReturnValue('user:user123:*');
      cacheService.generateUserStatsKey.mockReturnValue('user:user123:stats');

      const result = await service.create(createTodoDto, mockUser.id);

      expect(todoRepository.create).toHaveBeenCalledWith({
        ...createTodoDto,
        userId: mockUser.id,
        dueDate: new Date(createTodoDto.dueDate),
      });
      expect(result).toEqual(expectedTodo);
      expect(cacheService.delPattern).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalled();
    });

    it('should handle todo creation without due date', async () => {
      const createTodoDto: CreateTodoDto = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'medium',
      };

      const expectedTodo = { ...mockTodo, ...createTodoDto } as Todo;
      todoRepository.create.mockResolvedValue(expectedTodo);
      cacheService.delPattern.mockResolvedValue(undefined);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.generateUserPattern.mockReturnValue('user:user123:*');
      cacheService.generateUserStatsKey.mockReturnValue('user:user123:stats');

      const result = await service.create(createTodoDto, mockUser.id);

      expect(todoRepository.create).toHaveBeenCalledWith({
        ...createTodoDto,
        userId: mockUser.id,
        dueDate: undefined,
      });
      expect(result).toEqual(expectedTodo);
    });
  });

  describe('findAll', () => {
    it('should return cached todos if available', async () => {
      const queryDto: QueryTodoDto = { page: 1, limit: 10 };
      const cachedResult = {
        todos: [mockTodo],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      cacheService.generateUserTodosKey.mockReturnValue('cache-key');
      cacheService.get.mockResolvedValue(cachedResult);

      const result = await service.findAll(queryDto, mockUser.id);

      expect(cacheService.get).toHaveBeenCalledWith('cache-key');
      expect(result).toEqual(cachedResult);
      expect(todoRepository.findMany).not.toHaveBeenCalled();
    });

    it('should fetch todos from database when not cached', async () => {
      const queryDto: QueryTodoDto = {
        page: 1,
        limit: 10,
        completed: false,
        priority: 'high',
        search: 'test',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      cacheService.generateUserTodosKey.mockReturnValue('cache-key');
      cacheService.get.mockResolvedValue(null);
      todoRepository.findMany.mockResolvedValue([mockTodo]);
      todoRepository.count.mockResolvedValue(1);
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.findAll(queryDto, mockUser.id);

      expect(todoRepository.findMany).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          completed: false,
          priority: 'high',
          $or: [{ title: { $regex: 'test', $options: 'i' } }, { description: { $regex: 'test', $options: 'i' } }],
        },
        {
          sort: { createdAt: -1 },
          skip: 0,
          limit: 10,
        },
      );
      expect(todoRepository.count).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
      expect(result).toEqual({
        todos: [mockTodo],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle priority sorting correctly', async () => {
      const queryDto: QueryTodoDto = {
        page: 1,
        limit: 10,
        sortBy: 'priority',
        sortOrder: 'asc',
      };

      cacheService.generateUserTodosKey.mockReturnValue('cache-key');
      cacheService.get.mockResolvedValue(null);
      todoRepository.findMany.mockResolvedValue([mockTodo]);
      todoRepository.count.mockResolvedValue(1);
      cacheService.set.mockResolvedValue(undefined);

      await service.findAll(queryDto, mockUser.id);

      expect(todoRepository.findMany).toHaveBeenCalledWith(
        { userId: mockUser.id },
        {
          sort: { priority: 1 },
          skip: 0,
          limit: 10,
        },
      );
    });
  });

  describe('findOne', () => {
    it('should return cached todo if available', async () => {
      const todoId = 'todo123';
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.get.mockResolvedValue(mockTodo);

      const result = await service.findOne(todoId, mockUser.id);

      expect(cacheService.get).toHaveBeenCalledWith('todo-cache-key');
      expect(result).toEqual(mockTodo);
      expect(todoRepository.findByIdAndUserId).not.toHaveBeenCalled();
    });

    it('should fetch todo from database when not cached', async () => {
      const todoId = 'todo123';
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.get.mockResolvedValue(null);
      todoRepository.findByIdAndUserId.mockResolvedValue(mockTodo);
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.findOne(todoId, mockUser.id);

      expect(todoRepository.findByIdAndUserId).toHaveBeenCalledWith(todoId, mockUser.id);
      expect(cacheService.set).toHaveBeenCalledWith('todo-cache-key', mockTodo, 300);
      expect(result).toEqual(mockTodo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const todoId = 'nonexistent';
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.get.mockResolvedValue(null);
      todoRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.findOne(todoId, mockUser.id)).rejects.toThrow(
        new NotFoundException(`Todo with ID ${todoId} not found or access denied`),
      );
    });

    it('should not return cached todo for different user', async () => {
      const todoId = 'todo123';
      const differentUserTodo = { ...mockTodo, userId: 'different-user' };

      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.get.mockResolvedValue(differentUserTodo);
      todoRepository.findByIdAndUserId.mockResolvedValue(mockTodo);
      cacheService.set.mockResolvedValue(undefined);

      const result = await service.findOne(todoId, mockUser.id);

      expect(todoRepository.findByIdAndUserId).toHaveBeenCalledWith(todoId, mockUser.id);
      expect(result).toEqual(mockTodo);
    });
  });

  describe('update', () => {
    it('should update todo successfully', async () => {
      const todoId = 'todo123';
      const updateTodoDto: UpdateTodoDto = {
        title: 'Updated Todo',
        completed: true,
      };

      const mockTodoDocument = {
        ...mockTodo,
        save: jest.fn().mockResolvedValue({ ...mockTodo, ...updateTodoDto }),
      };

      // Mock findOne method

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTodoDocument as any);
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.set.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.generateUserPattern.mockReturnValue('user:user123:*');
      cacheService.generateUserStatsKey.mockReturnValue('user:user123:stats');

      const result = await service.update(todoId, updateTodoDto, mockUser.id);

      expect(service.findOne).toHaveBeenCalledWith(todoId, mockUser.id);
      expect(mockTodoDocument.save).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
      expect(cacheService.delPattern).toHaveBeenCalled();
      expect(result).toEqual({ ...mockTodo, ...updateTodoDto });
    });

    it('should handle due date update', async () => {
      const todoId = 'todo123';
      const updateTodoDto: UpdateTodoDto = {
        dueDate: '2024-12-31',
      };

      const mockTodoDocument = {
        ...mockTodo,
        save: jest.fn().mockResolvedValue({ ...mockTodo, dueDate: new Date(updateTodoDto.dueDate) }),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTodoDocument as any);
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.set.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.generateUserPattern.mockReturnValue('user:user123:*');
      cacheService.generateUserStatsKey.mockReturnValue('user:user123:stats');

      // Spy on Object.assign to assert it was called with converted dueDate
      jest.spyOn(Object, 'assign');

      await service.update(todoId, updateTodoDto, mockUser.id);

      expect(Object.assign).toHaveBeenCalledWith(mockTodoDocument, {
        dueDate: new Date(updateTodoDto.dueDate),
      });
    });
  });

  describe('remove', () => {
    it('should remove todo successfully', async () => {
      const todoId = 'todo123';

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTodo);
      todoRepository.deleteById.mockResolvedValue(true);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.generateUserPattern.mockReturnValue('user:user123:*');
      cacheService.generateUserStatsKey.mockReturnValue('user:user123:stats');

      await service.remove(todoId, mockUser.id);

      expect(service.findOne).toHaveBeenCalledWith(todoId, mockUser.id);
      expect(todoRepository.deleteById).toHaveBeenCalledWith(todoId);
      expect(cacheService.del).toHaveBeenCalledWith('todo-cache-key');
      expect(cacheService.delPattern).toHaveBeenCalled();
    });

    it('should throw NotFoundException when todo cannot be deleted', async () => {
      const todoId = 'todo123';

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTodo);
      todoRepository.deleteById.mockResolvedValue(false);

      await expect(service.remove(todoId, mockUser.id)).rejects.toThrow(
        new NotFoundException(`Todo with ID ${todoId} not found`),
      );
    });
  });

  describe('getStats', () => {
    it('should return cached stats if available', async () => {
      const mockStats = {
        total: 10,
        completed: 5,
        active: 5,
        overdue: 2,
        byPriority: { high: 3, medium: 4, low: 3 },
        byBlockchainNetwork: { polygon: 2, solana: 1 },
      };

      cacheService.generateUserStatsKey.mockReturnValue('stats-cache-key');
      cacheService.get.mockResolvedValue(mockStats);

      const result = await service.getStats(mockUser.id);

      expect(cacheService.get).toHaveBeenCalledWith('stats-cache-key');
      expect(result).toEqual(mockStats);
      expect(todoRepository.count).not.toHaveBeenCalled();
    });

    it('should calculate stats from database when not cached', async () => {
      cacheService.generateUserStatsKey.mockReturnValue('stats-cache-key');
      cacheService.get.mockResolvedValue(null);

      // Mock repository calls
      todoRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // completed
        .mockResolvedValueOnce(2); // overdue

      todoRepository.aggregate
        .mockResolvedValueOnce([
          { _id: 'high', count: 3 },
          { _id: 'medium', count: 4 },
          { _id: 'low', count: 3 },
        ]) // priority stats
        .mockResolvedValueOnce([
          { _id: 'polygon', count: 2 },
          { _id: 'solana', count: 1 },
        ]); // blockchain stats

      cacheService.set.mockResolvedValue(undefined);

      const result = await service.getStats(mockUser.id);

      expect(todoRepository.count).toHaveBeenCalledTimes(3);
      expect(todoRepository.aggregate).toHaveBeenCalledTimes(2);
      expect(cacheService.set).toHaveBeenCalledWith('stats-cache-key', result, 60);
      expect(result).toEqual({
        total: 10,
        completed: 5,
        active: 5,
        overdue: 2,
        byPriority: { high: 3, medium: 4, low: 3 },
        byBlockchainNetwork: { polygon: 2, solana: 1 },
      });
    });
  });

  describe('toggleComplete', () => {
    it('should toggle todo completion status', async () => {
      const todoId = 'todo123';
      const mockTodoDocument = {
        ...mockTodo,
        completed: false,
        save: jest.fn().mockResolvedValue({ ...mockTodo, completed: true }),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockTodoDocument as any);
      cacheService.generateTodoKey.mockReturnValue('todo-cache-key');
      cacheService.set.mockResolvedValue(undefined);
      cacheService.delPattern.mockResolvedValue(undefined);
      cacheService.del.mockResolvedValue(undefined);
      cacheService.generateUserPattern.mockReturnValue('user:user123:*');
      cacheService.generateUserStatsKey.mockReturnValue('user:user123:stats');

      const result = await service.toggleComplete(todoId, mockUser.id);

      expect(service.findOne).toHaveBeenCalledWith(todoId, mockUser.id);
      expect(mockTodoDocument.completed).toBe(true);
      expect(mockTodoDocument.save).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
      expect(cacheService.delPattern).toHaveBeenCalled();
      expect(result).toEqual({ ...mockTodo, completed: true });
    });
  });
});
