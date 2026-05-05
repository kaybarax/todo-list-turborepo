import axios from 'axios';
import { TodoService } from '../todoService';
import { TodoStatus, TodoPriority } from '../types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TodoService', () => {
  let todoService: TodoService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    todoService = new TodoService('http://localhost:3001/api/v1');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockTodo = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Todo',
    description: 'Description',
    status: TodoStatus.TODO,
    priority: TodoPriority.MEDIUM,
    tags: [],
  };

  describe('getTodos', () => {
    it('should fetch todos successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [mockTodo] });
      const result = await todoService.getTodos();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/todos', { params: {} });
      expect(result).toEqual([mockTodo]);
    });

    it('should pass query parameters', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: [] });
      await todoService.getTodos({ status: TodoStatus.DONE, limit: 5 });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/todos', {
        params: expect.objectContaining({ status: TodoStatus.DONE, limit: 5 }),
      });
    });
  });

  describe('getTodoById', () => {
    it('should fetch a single todo by id', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockTodo });
      const result = await todoService.getTodoById('1');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/todos/1');
      expect(result).toEqual(mockTodo);
    });
  });

  describe('createTodo', () => {
    it('should create a todo successfully', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockTodo });
      const input = { title: 'Test Todo' };
      const result = await todoService.createTodo(input);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/todos', expect.objectContaining(input));
      expect(result).toEqual(mockTodo);
    });
  });

  describe('updateTodo', () => {
    it('should update a todo successfully', async () => {
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: mockTodo });
      const input = { title: 'Updated Title' };
      const result = await todoService.updateTodo('1', input);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/todos/1', expect.objectContaining(input));
      expect(result).toEqual(mockTodo);
    });
  });

  describe('deleteTodo', () => {
    it('should delete a todo successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({});
      const result = await todoService.deleteTodo('1');
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/todos/1');
      expect(result).toBe(true);
    });
  });
});
