// @ts-nocheck
import { PolygonBlockchainService } from '../implementations/PolygonBlockchainService';
import { BlockchainError } from '@todo/utils/blockchain/errors';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers');

describe('PolygonBlockchainService', () => {
  let service: PolygonBlockchainService;
  let mockProvider: jest.Mocked<ethers.providers.JsonRpcProvider>;
  let mockSigner: jest.Mocked<ethers.Signer>;
  let mockContract: jest.Mocked<ethers.Contract>;

  const mockConfig = {
    rpcUrl: 'https://polygon-rpc.com',
    contractAddress: '0x1234567890abcdef',
    privateKey: '0xprivatekey',
  };

  beforeEach(() => {
    mockProvider = {
      getNetwork: jest.fn(),
      getBlockNumber: jest.fn(),
      getBalance: jest.fn(),
      waitForTransaction: jest.fn(),
    } as any;

    mockSigner = {
      getAddress: jest.fn(),
      getBalance: jest.fn(),
      connect: jest.fn(),
    } as any;

    mockContract = {
      createTodo: jest.fn(),
      updateTodo: jest.fn(),
      deleteTodo: jest.fn(),
      getTodo: jest.fn(),
      getAllTodos: jest.fn(),
      getTodoCount: jest.fn(),
      toggleTodo: jest.fn(),
      filters: {
        TodoCreated: jest.fn(),
        TodoUpdated: jest.fn(),
        TodoDeleted: jest.fn(),
      },
      on: jest.fn(),
      off: jest.fn(),
    } as any;

    (ethers.providers.JsonRpcProvider as jest.Mock).mockReturnValue(mockProvider);
    (ethers.Wallet as any as jest.Mock).mockReturnValue(mockSigner);
    (ethers.Contract as any as jest.Mock).mockReturnValue(mockContract);

    service = new PolygonBlockchainService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(mockConfig.rpcUrl);
      expect(ethers.Wallet).toHaveBeenCalledWith(mockConfig.privateKey, mockProvider);
      expect(ethers.Contract).toHaveBeenCalledWith(
        mockConfig.contractAddress,
        expect.any(Array), // ABI
        mockSigner,
      );
    });

    it('should throw error with invalid configuration', () => {
      expect(() => {
        new PolygonBlockchainService({
          rpcUrl: '',
          contractAddress: '0x123',
          privateKey: 'invalid',
        });
      }).toThrow(BlockchainError);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');

      const result = await service.connect();

      expect(result.success).toBe(true);
      expect(result.network).toBe('polygon');
      expect(result.address).toBe('0xsigneraddress');
    });

    it('should handle connection errors', async () => {
      mockProvider.getNetwork.mockRejectedValue(new Error('Network error'));

      const result = await service.connect();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should validate network chain ID', async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 1, name: 'mainnet' });

      const result = await service.connect();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid network');
    });
  });

  describe('createTodo', () => {
    const todoData = {
      title: 'Test Todo',
      description: 'Test Description',
      priority: 'medium' as const,
      dueDate: '2024-12-31',
    };

    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should create todo successfully', async () => {
      const mockTransaction = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xtxhash',
          gasUsed: ethers.BigNumber.from('21000'),
        }),
      };

      mockContract.createTodo.mockResolvedValue(mockTransaction);

      const result = await service.createTodo(todoData);

      expect(mockContract.createTodo).toHaveBeenCalledWith(
        todoData.title,
        todoData.description,
        1, // medium priority
        Math.floor(new Date(todoData.dueDate).getTime() / 1000),
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xtxhash');
    });

    it('should handle transaction failure', async () => {
      const mockTransaction = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({
          status: 0,
          transactionHash: '0xtxhash',
        }),
      };

      mockContract.createTodo.mockResolvedValue(mockTransaction);

      const result = await service.createTodo(todoData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Transaction failed');
    });

    it('should handle contract errors', async () => {
      mockContract.createTodo.mockRejectedValue(new Error('Contract error'));

      const result = await service.createTodo(todoData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Contract error');
    });

    it('should validate todo data', async () => {
      const invalidTodoData = {
        title: '',
        description: 'Test Description',
        priority: 'medium' as const,
        dueDate: '2024-12-31',
      };

      const result = await service.createTodo(invalidTodoData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Title is required');
    });

    it('should handle different priority levels', async () => {
      const mockTransaction = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({ status: 1, transactionHash: '0xtxhash' }),
      };

      mockContract.createTodo.mockResolvedValue(mockTransaction);

      // Test high priority
      await service.createTodo({ ...todoData, priority: 'high' });
      expect(mockContract.createTodo).toHaveBeenLastCalledWith(
        todoData.title,
        todoData.description,
        2, // high priority
        expect.any(Number),
      );

      // Test low priority
      await service.createTodo({ ...todoData, priority: 'low' });
      expect(mockContract.createTodo).toHaveBeenLastCalledWith(
        todoData.title,
        todoData.description,
        0, // low priority
        expect.any(Number),
      );
    });
  });

  describe('updateTodo', () => {
    const updateData = {
      title: 'Updated Todo',
      completed: true,
    };

    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should update todo successfully', async () => {
      const mockTransaction = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xtxhash',
        }),
      };

      mockContract.updateTodo.mockResolvedValue(mockTransaction);

      const result = await service.updateTodo('1', updateData);

      expect(mockContract.updateTodo).toHaveBeenCalledWith(
        1,
        updateData.title,
        '',
        1, // medium priority (default)
        0, // no due date
        updateData.completed,
      );
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xtxhash');
    });

    it('should handle partial updates', async () => {
      const mockTransaction = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({ status: 1, transactionHash: '0xtxhash' }),
      };

      mockContract.updateTodo.mockResolvedValue(mockTransaction);

      const result = await service.updateTodo('1', { completed: true });

      expect(mockContract.updateTodo).toHaveBeenCalledWith(
        1,
        '',
        '',
        1, // default priority
        0, // no due date
        true,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('deleteTodo', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should delete todo successfully', async () => {
      const mockTransaction = {
        hash: '0xtxhash',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xtxhash',
        }),
      };

      mockContract.deleteTodo.mockResolvedValue(mockTransaction);

      const result = await service.deleteTodo('1');

      expect(mockContract.deleteTodo).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xtxhash');
    });

    it('should handle non-existent todo', async () => {
      mockContract.deleteTodo.mockRejectedValue(new Error('Todo not found'));

      const result = await service.deleteTodo('999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Todo not found');
    });
  });

  describe('getTodo', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should get todo successfully', async () => {
      const mockTodoData = [
        'Test Todo',
        'Test Description',
        false,
        1, // medium priority
        Math.floor(new Date('2024-12-31').getTime() / 1000),
        '0xowner',
        Math.floor(new Date('2024-01-01').getTime() / 1000),
      ];

      mockContract.getTodo.mockResolvedValue(mockTodoData);

      const result = await service.getTodo('1');

      expect(mockContract.getTodo).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        priority: 'medium',
        dueDate: '2024-12-31T00:00:00.000Z',
        owner: '0xowner',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should handle non-existent todo', async () => {
      mockContract.getTodo.mockRejectedValue(new Error('Todo not found'));

      const result = await service.getTodo('999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Todo not found');
    });
  });

  describe('getAllTodos', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should get all todos successfully', async () => {
      const mockTodoCount = ethers.BigNumber.from('2');
      const mockTodoData1 = [
        'Todo 1',
        'Description 1',
        false,
        1,
        Math.floor(new Date('2024-12-31').getTime() / 1000),
        '0xowner',
        Math.floor(new Date('2024-01-01').getTime() / 1000),
      ];
      const mockTodoData2 = [
        'Todo 2',
        'Description 2',
        true,
        2,
        Math.floor(new Date('2024-11-30').getTime() / 1000),
        '0xowner',
        Math.floor(new Date('2024-01-02').getTime() / 1000),
      ];

      mockContract.getTodoCount.mockResolvedValue(mockTodoCount);
      mockContract.getTodo.mockResolvedValueOnce(mockTodoData1).mockResolvedValueOnce(mockTodoData2);

      const result = await service.getAllTodos();

      expect(mockContract.getTodoCount).toHaveBeenCalled();
      expect(mockContract.getTodo).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Todo 1');
      expect(result.data[1].title).toBe('Todo 2');
    });

    it('should handle empty todo list', async () => {
      const mockTodoCount = ethers.BigNumber.from('0');

      mockContract.getTodoCount.mockResolvedValue(mockTodoCount);

      const result = await service.getAllTodos();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should listen to TodoCreated events', () => {
      const callback = jest.fn();
      const mockFilter = { address: mockConfig.contractAddress };

      mockContract.filters.TodoCreated.mockReturnValue(mockFilter);

      service.onTodoCreated(callback);

      expect(mockContract.filters.TodoCreated).toHaveBeenCalled();
      expect(mockContract.on).toHaveBeenCalledWith(mockFilter, callback);
    });

    it('should listen to TodoUpdated events', () => {
      const callback = jest.fn();
      const mockFilter = { address: mockConfig.contractAddress };

      mockContract.filters.TodoUpdated.mockReturnValue(mockFilter);

      service.onTodoUpdated(callback);

      expect(mockContract.filters.TodoUpdated).toHaveBeenCalled();
      expect(mockContract.on).toHaveBeenCalledWith(mockFilter, callback);
    });

    it('should listen to TodoDeleted events', () => {
      const callback = jest.fn();
      const mockFilter = { address: mockConfig.contractAddress };

      mockContract.filters.TodoDeleted.mockReturnValue(mockFilter);

      service.onTodoDeleted(callback);

      expect(mockContract.filters.TodoDeleted).toHaveBeenCalled();
      expect(mockContract.on).toHaveBeenCalledWith(mockFilter, callback);
    });

    it('should remove event listeners', () => {
      const callback = jest.fn();

      service.removeAllListeners();

      expect(mockContract.off).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();
    });

    it('should check connection status', () => {
      expect(service.isConnected()).toBe(true);
    });

    it('should get network info', () => {
      const networkInfo = service.getNetworkInfo();

      expect(networkInfo.name).toBe('polygon');
      expect(networkInfo.chainId).toBe(137);
      expect(networkInfo.rpcUrl).toBe(mockConfig.rpcUrl);
    });

    it('should get account balance', async () => {
      const mockBalance = ethers.BigNumber.from('1000000000000000000'); // 1 ETH
      mockSigner.getBalance.mockResolvedValue(mockBalance);

      const balance = await service.getBalance();

      expect(balance).toBe('1.0');
    });

    it('should estimate gas for transactions', async () => {
      const mockGasEstimate = ethers.BigNumber.from('21000');
      mockContract.estimateGas = {
        createTodo: jest.fn().mockResolvedValue(mockGasEstimate),
      };

      const gasEstimate = await service.estimateGas('createTodo', [
        'Test Todo',
        'Test Description',
        1,
        Math.floor(Date.now() / 1000),
      ]);

      expect(gasEstimate).toBe('21000');
    });
  });

  describe('error handling', () => {
    it('should handle network disconnection', async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();

      // Simulate network disconnection
      mockContract.createTodo.mockRejectedValue(new Error('Network error'));

      const result = await service.createTodo({
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        dueDate: '2024-12-31',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle insufficient funds', async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();

      mockContract.createTodo.mockRejectedValue(new Error('insufficient funds'));

      const result = await service.createTodo({
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        dueDate: '2024-12-31',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('insufficient funds');
    });

    it('should handle contract revert errors', async () => {
      mockProvider.getNetwork.mockResolvedValue({ chainId: 137, name: 'matic' });
      mockSigner.getAddress.mockResolvedValue('0xsigneraddress');
      await service.connect();

      const revertError = new Error('execution reverted: Custom error message');
      mockContract.createTodo.mockRejectedValue(revertError);

      const result = await service.createTodo({
        title: 'Test Todo',
        description: 'Test Description',
        priority: 'medium',
        dueDate: '2024-12-31',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Custom error message');
    });
  });
});
