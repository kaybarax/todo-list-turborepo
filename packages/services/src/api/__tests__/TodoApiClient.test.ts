// @ts-nocheck
import { ApiError } from '../ApiError';
import { TodoApiClient } from '../TodoApiClient';
import {
  type ApiTodo as Todo,
  type CreateApiTodoInput as CreateTodoInput,
  type UpdateApiTodoInput as UpdateTodoInput,
} from '../types';

import axios from 'axios';

// Mock axios
jest.mock('axios');

(axios.create as jest.Mock).mockReturnValue({
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  defaults: { headers: { common: {} } },
});

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
      expect((client as any).post).toHaveBeenCalledWith('/todos', expect.objectContaining(createInput));
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

      jest.spyOn(client as any, 'patch').mockResolvedValue({
        success: true,
        data: mockUpdatedTodo,
      });

      const result = await client.updateTodo('1', updateInput);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUpdatedTodo);
      expect((client as any).patch).toHaveBeenCalledWith('/todos/1', expect.objectContaining(updateInput));
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

  describe('bulkUpdateTodos', () => {
    it('should bulk update todos successfully', async () => {
      const updates = [{ id: '1', data: { title: 'Bulk' } }];
      const mockTodos = [
        {
          id: '1',
          title: 'Bulk',
          completed: false,
          priority: 'medium',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          userId: 'user1',
          tags: [],
        },
      ];

      jest.spyOn(client as any, 'patch').mockResolvedValue({
        success: true,
        data: mockTodos,
      });

      const result = await client.bulkUpdateTodos(updates);
      expect(result.success).toBe(true);
      expect(result.data[0].title).toBe('Bulk');
    });

    it('should throw ApiError for invalid bulk data in response', async () => {
      const updates = [{ id: '1', data: { title: 'Bulk' } }];
      jest.spyOn(client as any, 'patch').mockResolvedValue({
        success: true,
        data: [{ invalid: 'data' }],
      });

      await expect(client.bulkUpdateTodos(updates)).rejects.toThrow(ApiError);
    });
  });

  describe('error mapping', () => {
    it('should pass through ApiError', async () => {
      const apiError = ApiError.networkError('fail');
      jest.spyOn(client as any, 'get').mockRejectedValue(apiError);
      await expect(client.getTodos()).rejects.toBe(apiError);
    });

    it('should wrap other errors in ApiError', async () => {
      jest.spyOn(client as any, 'get').mockRejectedValue(new Error('raw fail'));
      await expect(client.getTodos()).rejects.toThrow(ApiError);
    });
  });

  describe('search failures', () => {
    it('should return raw response if search fails', async () => {
      jest.spyOn(client as any, 'get').mockResolvedValue({
        success: false,
        error: 'Search failed',
      });

      const result = await client.searchTodos('test');
      expect(result.success).toBe(false);
    });
  });

  describe('toggleTodo failure', () => {
    it('should return raw response if toggle fails', async () => {
      jest.spyOn(client as any, 'patch').mockResolvedValue({
        success: false,
        error: 'Toggle failed',
      });

      const result = await client.toggleTodo('1');
      expect(result.success).toBe(false);
    });

    it('should throw validation error if create response is invalid', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true, data: { invalid: 1 } });
      await expect(client.createTodo({})).rejects.toThrow(ApiError);
    });

    it('should throw validation error if update response is invalid', async () => {
      jest.spyOn(client as any, 'patch').mockResolvedValue({ success: true, data: { invalid: 1 } });
      await expect(client.updateTodo('1', {})).rejects.toThrow(ApiError);
    });

    it('should throw validation error if getTodos response is invalid', async () => {
      jest.spyOn(client as any, 'get').mockResolvedValue({ success: true, data: [{ invalid: 1 }] });
      await expect(client.getTodos()).rejects.toThrow(ApiError);
    });

    it('should throw validation error if bulk update input is invalid', async () => {
      await expect(client.bulkUpdateTodos([{ id: '1', data: { priority: 'invalid' as any } }])).rejects.toThrow(
        ApiError,
      );
    });

    it('should handle success true with data null in createTodo', async () => {
      jest.spyOn(client as any, 'post').mockResolvedValue({ success: true, data: null });
      const result = await client.createTodo({ title: 't' });
      expect(result.data).toBeNull();
    });

    it('should handle success true with data null in updateTodo', async () => {
      jest.spyOn(client as any, 'patch').mockResolvedValue({ success: true, data: null });
      const result = await client.updateTodo('1', { title: 't' });
      expect(result.data).toBeNull();
    });

    it('should handle success true with data null in toggleTodo', async () => {
      jest.spyOn(client as any, 'patch').mockResolvedValue({ success: true, data: null });
      const result = await client.toggleTodo('1');
      expect(result.data).toBeNull();
    });
  });

  describe('catch blocks coverage', () => {
    it('should handle non-ApiError in getTodos', async () => {
      jest.spyOn(client as any, 'get').mockRejectedValue('fail');
      await expect(client.getTodos()).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in getTodoById', async () => {
      jest.spyOn(client as any, 'get').mockRejectedValue('fail');
      await expect(client.getTodoById('1')).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in createTodo', async () => {
      jest.spyOn(client as any, 'post').mockRejectedValue('fail');
      await expect(client.createTodo({ title: 't' })).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in updateTodo', async () => {
      jest.spyOn(client as any, 'patch').mockRejectedValue('fail');
      await expect(client.updateTodo('1', { title: 't' })).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in deleteTodo', async () => {
      jest.spyOn(client as any, 'delete').mockRejectedValue('fail');
      await expect(client.deleteTodo('1')).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in toggleTodo', async () => {
      jest.spyOn(client as any, 'patch').mockRejectedValue('fail');
      await expect(client.toggleTodo('1')).rejects.toThrow(ApiError);
    });
    it('should handle non-ApiError in bulkUpdateTodos', async () => {
      jest.spyOn(client as any, 'patch').mockRejectedValue('fail');
      await expect(client.bulkUpdateTodos([])).rejects.toThrow(ApiError);
    });
  });
});
