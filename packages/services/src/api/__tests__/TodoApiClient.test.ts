// @ts-nocheck
import { ApiError } from '../ApiError';
import { TodoApiClient } from '../TodoApiClient';
import {
  type ApiTodo as Todo,
  type CreateApiTodoInput as CreateTodoInput,
  type UpdateApiTodoInput as UpdateTodoInput,
} from '../types';

// Mock axios
jest.mock('axios');

describe('TodoApiClient', () => {
  let client: TodoApiClient;
  const mockConfig = {
    baseUrl: 'http://localhost:3001/api/v1',
    timeout: 5000,
  };

  beforeEach(() => {
    client = new TodoApiClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('getTodos', () => {
    it('should fetch todos successfully', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          priority: 'medium',
          dueDate: '2024-12-31',
          tags: ['test'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userId: 'user1',
        },
      ];

      // Mock the get method
      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: true,
        data: mockTodos,
      });

      const result = await client.getTodos();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTodos);
      expect((client as any).get).toHaveBeenCalledWith('/todos', { params: undefined });
    });

    it('should handle query parameters', async () => {
      const params = {
        page: 1,
        limit: 10,
        completed: true,
        priority: 'high' as const,
        search: 'test',
        tags: ['work'],
      };

      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: true,
        data: [],
      });

      await client.getTodos(params);

      expect((client as any).get).toHaveBeenCalledWith('/todos', { params });
    });

    it('should throw ApiError for invalid todo data', async () => {
      const invalidTodo = {
        id: '1',
        title: '', // Invalid: empty title
        completed: 'not-boolean', // Invalid: not boolean
      };

      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: true,
        data: [invalidTodo],
      });

      await expect(client.getTodos()).rejects.toThrow(ApiError);
    });
  });

  describe('getTodoById', () => {
    it('should fetch a todo by ID successfully', async () => {
      const mockTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        dueDate: '2024-12-31',
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        userId: 'user1',
      };

      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: true,
        data: mockTodo,
      });

      const result = await client.getTodoById('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTodo);
      expect((client as any).get).toHaveBeenCalledWith('/todos/1');
    });
  });

  describe('createTodo', () => {
    it('should create a todo successfully', async () => {
      const createInput: CreateTodoInput = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
        tags: ['new'],
      };

      const mockCreatedTodo: Todo = {
        id: '2',
        ...createInput,
        completed: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        userId: 'user1',
      };

      jest.spyOn(client as any, 'post').mockResolvedValue({
        success: true,
        data: mockCreatedTodo,
      });

      const result = await client.createTodo(createInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedTodo);
      expect((client as any).post).toHaveBeenCalledWith('/todos', createInput);
    });

    it('should throw ApiError for invalid input', async () => {
      const invalidInput = {
        title: '', // Invalid: empty title
        priority: 'invalid' as any, // Invalid: not a valid priority
      };

      await expect(client.createTodo(invalidInput)).rejects.toThrow(ApiError);
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      const updateInput: UpdateTodoInput = {
        title: 'Updated Todo',
        completed: true,
      };

      const mockUpdatedTodo: Todo = {
        id: '1',
        title: 'Updated Todo',
        description: 'Test Description',
        completed: true,
        priority: 'medium',
        dueDate: '2024-12-31',
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        userId: 'user1',
      };

      jest.spyOn(client as any, 'put').mockResolvedValue({
        success: true,
        data: mockUpdatedTodo,
      });

      const result = await client.updateTodo('1', updateInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedTodo);
      expect((client as any).put).toHaveBeenCalledWith('/todos/1', updateInput);
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      jest.spyOn(client as any, 'delete').mockResolvedValue({
        success: true,
      });

      const result = await client.deleteTodo('1');

      expect(result.success).toBe(true);
      expect((client as any).delete).toHaveBeenCalledWith('/todos/1');
    });
  });

  describe('toggleTodo', () => {
    it('should toggle a todo successfully', async () => {
      const mockToggledTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: true, // Toggled to true
        priority: 'medium',
        dueDate: '2024-12-31',
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        userId: 'user1',
      };

      jest.spyOn(client as any, 'patch').mockResolvedValue({
        success: true,
        data: mockToggledTodo,
      });

      const result = await client.toggleTodo('1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockToggledTodo);
      expect((client as any).patch).toHaveBeenCalledWith('/todos/1/toggle');
    });
  });

  describe('searchTodos', () => {
    it('should search todos successfully', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Search Result',
          description: 'Found todo',
          completed: false,
          priority: 'medium',
          dueDate: '2024-12-31',
          tags: ['search'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userId: 'user1',
        },
      ];

      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: true,
        data: mockTodos,
      });

      const result = await client.searchTodos('search query', {
        completed: false,
        priority: 'medium',
        tags: ['search'],
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTodos);
      expect((client as any).get).toHaveBeenCalledWith('/todos/search', {
        params: {
          q: 'search query',
          completed: false,
          priority: 'medium',
          tags: ['search'],
        },
      });
    });
  });
});
