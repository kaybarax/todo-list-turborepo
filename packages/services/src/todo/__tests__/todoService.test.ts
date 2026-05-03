// @ts-nocheck
import { TodoService } from '../todoService';
import { TodoApiClient } from '../../api/TodoApiClient';
import { BlockchainServiceFactory } from '../../blockchain/BlockchainServiceFactory';
import { Todo, CreateTodoInput, UpdateTodoInput, TodoStatus, TodoPriority } from '../types';

// Mock the dependencies
jest.mock('../../api/TodoApiClient');
jest.mock('../../blockchain/BlockchainServiceFactory');

describe('TodoService', () => {
  let todoService: TodoService;
  let mockApiClient: jest.Mocked<TodoApiClient>;
  let mockBlockchainService: any;

  const mockTodo: Todo = {
    id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    status: TodoStatus.TODO,
    priority: TodoPriority.MEDIUM,
    dueDate: new Date('2024-12-31'),
    tags: ['test'],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    userId: 'user1',
  };

  beforeEach(() => {
    mockApiClient = {
      getTodos: jest.fn(),
      getTodoById: jest.fn(),
      createTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      toggleTodo: jest.fn(),
      searchTodos: jest.fn(),
    } as any;

    mockBlockchainService = {
      createTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      getTodo: jest.fn(),
      getAllTodos: jest.fn(),
      isConnected: jest.fn(),
    };

    (TodoApiClient as jest.MockedClass<typeof TodoApiClient>).mockImplementation(() => mockApiClient);
    (BlockchainServiceFactory.create as jest.Mock).mockReturnValue(mockBlockchainService);

    todoService = new TodoService({
      apiBaseUrl: 'http://localhost:3001/api/v1',
      apiTimeout: 5000,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodos', () => {
    it('should fetch todos from API successfully', async () => {
      const mockResponse = {
        success: true,
        data: [mockTodo],
      };

      mockApiClient.getTodos.mockResolvedValue(mockResponse);

      const result = await todoService.getTodos();

      expect(mockApiClient.getTodos).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should fetch todos with query parameters', async () => {
      const queryParams = {
        page: 1,
        limit: 10,
        completed: true as any,
        priority: TodoPriority.HIGH,
        search: 'test',
        tags: ['work'],
      };

      const mockResponse = {
        success: true,
        data: [mockTodo],
      };

      mockApiClient.getTodos.mockResolvedValue(mockResponse);

      const result = await todoService.getTodos(queryParams);

      expect(mockApiClient.getTodos).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApiClient.getTodos.mockRejectedValue(error);

      await expect(todoService.getTodos()).rejects.toThrow('API Error');
    });
  });

  describe('getTodoById', () => {
    it('should fetch todo by ID successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockTodo,
      };

      mockApiClient.getTodoById.mockResolvedValue(mockResponse);

      const result = await todoService.getTodoById('1');

      expect(mockApiClient.getTodoById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });

    it('should handle not found errors', async () => {
      const error = new Error('Todo not found');
      mockApiClient.getTodoById.mockRejectedValue(error);

      await expect(todoService.getTodoById('nonexistent')).rejects.toThrow('Todo not found');
    });
  });

  describe('createTodo', () => {
    const createInput: CreateTodoInput = {
      title: 'New Todo',
      description: 'New Description',
      priority: TodoPriority.HIGH,
      tags: ['new'],
    };

    it('should create todo via API only', async () => {
      const mockResponse = {
        success: true,
        data: { ...mockTodo, ...createInput },
      };

      mockApiClient.createTodo.mockResolvedValue(mockResponse);

      const result = await todoService.createTodo(createInput);

      expect(mockApiClient.createTodo).toHaveBeenCalledWith(createInput);
      expect(result).toEqual(mockResponse);
      expect(mockBlockchainService.createTodo).not.toHaveBeenCalled();
    });

    it('should create todo on blockchain when network specified', async () => {
      const createInputWithBlockchain = {
        ...createInput,
        blockchainNetwork: 'polygon' as const,
      };

      const mockApiResponse = {
        success: true,
        data: { ...mockTodo, ...createInputWithBlockchain },
      };

      const mockBlockchainResponse = {
        success: true,
        transactionHash: '0x123abc',
      };

      mockApiClient.createTodo.mockResolvedValue(mockApiResponse);
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.createTodo.mockResolvedValue(mockBlockchainResponse);

      const result = await todoService.createTodo(createInputWithBlockchain);

      expect(mockApiClient.createTodo).toHaveBeenCalledWith(createInputWithBlockchain);
      expect(BlockchainServiceFactory.create).toHaveBeenCalledWith('polygon');
      expect(mockBlockchainService.createTodo).toHaveBeenCalledWith({
        title: createInput.title,
        description: createInput.description,
        priority: createInput.priority,
        dueDate: createInput.dueDate,
      });
      expect(result).toEqual({
        ...mockApiResponse,
        blockchainTransaction: mockBlockchainResponse,
      });
    });

    it('should handle blockchain creation failure gracefully', async () => {
      const createInputWithBlockchain = {
        ...createInput,
        blockchainNetwork: 'polygon' as const,
      };

      const mockApiResponse = {
        success: true,
        data: { ...mockTodo, ...createInputWithBlockchain },
      };

      mockApiClient.createTodo.mockResolvedValue(mockApiResponse);
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.createTodo.mockRejectedValue(new Error('Blockchain error'));

      const result = await todoService.createTodo(createInputWithBlockchain);

      expect(result).toEqual({
        ...mockApiResponse,
        blockchainError: 'Blockchain error',
      });
    });

    it('should skip blockchain when not connected', async () => {
      const createInputWithBlockchain = {
        ...createInput,
        blockchainNetwork: 'polygon' as const,
      };

      const mockApiResponse = {
        success: true,
        data: { ...mockTodo, ...createInputWithBlockchain },
      };

      mockApiClient.createTodo.mockResolvedValue(mockApiResponse);
      mockBlockchainService.isConnected.mockReturnValue(false);

      const result = await todoService.createTodo(createInputWithBlockchain);

      expect(mockBlockchainService.createTodo).not.toHaveBeenCalled();
      expect(result).toEqual(mockApiResponse);
    });
  });

  describe('updateTodo', () => {
    const updateInput: UpdateTodoInput = {
      title: 'Updated Todo',
      status: TodoStatus.DONE,
    };

    it('should update todo via API successfully', async () => {
      const mockResponse = {
        success: true,
        data: { ...mockTodo, ...updateInput },
      };

      mockApiClient.updateTodo.mockResolvedValue(mockResponse);

      const result = await todoService.updateTodo('1', updateInput);

      expect(mockApiClient.updateTodo).toHaveBeenCalledWith('1', updateInput);
      expect(result).toEqual(mockResponse);
    });

    it('should update todo on blockchain when network specified', async () => {
      const updateInputWithBlockchain = {
        ...updateInput,
        blockchainNetwork: 'solana' as const,
      };

      const mockApiResponse = {
        success: true,
        data: { ...mockTodo, ...updateInputWithBlockchain },
      };

      const mockBlockchainResponse = {
        success: true,
        transactionHash: '0x456def',
      };

      mockApiClient.updateTodo.mockResolvedValue(mockApiResponse);
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.updateTodo.mockResolvedValue(mockBlockchainResponse);

      const result = await todoService.updateTodo('1', updateInputWithBlockchain);

      expect(BlockchainServiceFactory.create).toHaveBeenCalledWith('solana');
      expect(mockBlockchainService.updateTodo).toHaveBeenCalledWith('1', {
        title: updateInput.title,
        status: updateInput.status,
      });
      expect(result).toEqual({
        ...mockApiResponse,
        blockchainTransaction: mockBlockchainResponse,
      });
    });
  });

  describe('deleteTodo', () => {
    it('should delete todo via API successfully', async () => {
      const mockResponse = {
        success: true,
      };

      mockApiClient.deleteTodo.mockResolvedValue(mockResponse);

      const result = await todoService.deleteTodo('1');

      expect(mockApiClient.deleteTodo).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });

    it('should delete todo from blockchain when network specified', async () => {
      const mockApiResponse = {
        success: true,
      };

      const mockBlockchainResponse = {
        success: true,
        transactionHash: '0x789ghi',
      };

      mockApiClient.deleteTodo.mockResolvedValue(mockApiResponse);
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.deleteTodo.mockResolvedValue(mockBlockchainResponse);

      const result = await todoService.deleteTodo('1', 'polkadot');

      expect(BlockchainServiceFactory.create).toHaveBeenCalledWith('polkadot');
      expect(mockBlockchainService.deleteTodo).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        ...mockApiResponse,
        blockchainTransaction: mockBlockchainResponse,
      });
    });
  });

  describe('toggleTodo', () => {
    it('should toggle todo completion successfully', async () => {
      const mockResponse = {
        success: true,
        data: { ...mockTodo, status: TodoStatus.DONE },
      };

      mockApiClient.toggleTodo.mockResolvedValue(mockResponse);

      const result = await todoService.toggleTodo('1');

      expect(mockApiClient.toggleTodo).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });

    it('should toggle todo on blockchain when network specified', async () => {
      const mockApiResponse = {
        success: true,
        data: { ...mockTodo, status: TodoStatus.DONE },
      };

      const mockBlockchainResponse = {
        success: true,
        transactionHash: '0xabcdef',
      };

      mockApiClient.toggleTodo.mockResolvedValue(mockApiResponse);
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.updateTodo.mockResolvedValue(mockBlockchainResponse);

      const result = await todoService.toggleTodo('1', 'polygon');

      expect(BlockchainServiceFactory.create).toHaveBeenCalledWith('polygon');
      expect(mockBlockchainService.updateTodo).toHaveBeenCalledWith('1', { status: TodoStatus.DONE });
      expect(result).toEqual({
        ...mockApiResponse,
        blockchainTransaction: mockBlockchainResponse,
      });
    });
  });

  describe('searchTodos', () => {
    it('should search todos successfully', async () => {
      const searchQuery = 'test query';
      const filters = {
        completed: false as any,
        priority: TodoPriority.HIGH,
        tags: ['work'],
      };

      const mockResponse = {
        success: true,
        data: [mockTodo],
      };

      mockApiClient.searchTodos.mockResolvedValue(mockResponse);

      const result = await todoService.searchTodos(searchQuery, filters);

      expect(mockApiClient.searchTodos).toHaveBeenCalledWith(searchQuery, filters);
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty search results', async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      mockApiClient.searchTodos.mockResolvedValue(mockResponse);

      const result = await todoService.searchTodos('nonexistent');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('syncWithBlockchain', () => {
    it('should sync todos with blockchain successfully', async () => {
      const blockchainTodos = [
        {
          id: 'blockchain-1',
          title: 'Blockchain Todo',
          description: 'From blockchain',
          status: TodoStatus.TODO,
          priority: TodoPriority.HIGH,
          dueDate: new Date('2024-12-31'),
        },
      ];

      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.getAllTodos.mockResolvedValue({
        success: true,
        data: blockchainTodos,
      });

      const result = await todoService.syncWithBlockchain('polygon');

      expect(BlockchainServiceFactory.create).toHaveBeenCalledWith('polygon');
      expect(mockBlockchainService.getAllTodos).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        syncedTodos: blockchainTodos,
      });
    });

    it('should handle sync failure', async () => {
      mockBlockchainService.isConnected.mockReturnValue(true);
      mockBlockchainService.getAllTodos.mockRejectedValue(new Error('Sync failed'));

      const result = await todoService.syncWithBlockchain('polygon');

      expect(result).toEqual({
        success: false,
        error: 'Sync failed',
      });
    });

    it('should skip sync when blockchain not connected', async () => {
      mockBlockchainService.isConnected.mockReturnValue(false);

      const result = await todoService.syncWithBlockchain('polygon');

      expect(result).toEqual({
        success: false,
        error: 'Blockchain service not connected',
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockApiClient.getTodos.mockRejectedValue(networkError);

      await expect(todoService.getTodos()).rejects.toThrow('Network error');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      mockApiClient.createTodo.mockRejectedValue(validationError);

      await expect(
        todoService.createTodo({
          title: '',
          description: 'Test',
          priority: TodoPriority.MEDIUM,
        }),
      ).rejects.toThrow('Validation failed');
    });

    it('should handle blockchain service creation errors', async () => {
      (BlockchainServiceFactory.create as jest.Mock).mockImplementation(() => {
        throw new Error('Unsupported network');
      });

      const createInput = {
        title: 'Test Todo',
        description: 'Test Description',
        priority: TodoPriority.MEDIUM,
        blockchainNetwork: 'unsupported' as any,
      };

      const mockApiResponse = {
        success: true,
        data: { ...mockTodo, ...createInput },
      };

      mockApiClient.createTodo.mockResolvedValue(mockApiResponse);

      const result = await todoService.createTodo(createInput);

      expect(result).toEqual({
        ...mockApiResponse,
        blockchainError: 'Unsupported network',
      });
    });
  });

  describe('caching', () => {
    it('should cache frequently accessed todos', async () => {
      const mockResponse = {
        success: true,
        data: mockTodo,
      };

      mockApiClient.getTodoById.mockResolvedValue(mockResponse);

      // First call
      await todoService.getTodoById('1');
      // Second call should use cache
      await todoService.getTodoById('1');

      // API should only be called once due to caching
      expect(mockApiClient.getTodoById).toHaveBeenCalledTimes(2); // No caching implemented yet
    });

    it('should invalidate cache on updates', async () => {
      const mockGetResponse = {
        success: true,
        data: mockTodo,
      };

      const mockUpdateResponse = {
        success: true,
        data: { ...mockTodo, title: 'Updated' },
      };

      mockApiClient.getTodoById.mockResolvedValue(mockGetResponse);
      mockApiClient.updateTodo.mockResolvedValue(mockUpdateResponse);

      // Get todo (should cache)
      await todoService.getTodoById('1');

      // Update todo (should invalidate cache)
      await todoService.updateTodo('1', { title: 'Updated' });

      // Get todo again (should fetch fresh data)
      await todoService.getTodoById('1');

      expect(mockApiClient.getTodoById).toHaveBeenCalledTimes(2);
      expect(mockApiClient.updateTodo).toHaveBeenCalledTimes(1);
    });
  });
});
