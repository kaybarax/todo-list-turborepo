// @ts-nocheck
import {
  BaseNetworkBlockchainService,
  BaseNetworkBlockchainServiceOptions,
} from '../implementations/BaseNetworkBlockchainService';
import { BlockchainNetwork, TransactionStatus, BlockchainTodoStatus } from '../types';
import { BlockchainError } from '@todo/utils/blockchain/errors';

// Mock the TransactionMonitor
jest.mock('../utils/TransactionMonitor', () => ({
  TransactionMonitor: jest.fn().mockImplementation(() => ({
    monitorTransaction: jest.fn().mockResolvedValue({
      transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      status: TransactionStatus.CONFIRMED,
      blockNumber: 8453678,
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      gasUsed: '50000',
      effectiveGasPrice: '500000000',
      network: BlockchainNetwork.BASE,
      timestamp: new Date(),
    }),
  })),
}));

describe('BaseNetworkBlockchainService', () => {
  let service: BaseNetworkBlockchainService;
  let mockProvider: any;

  const mockOptions: BaseNetworkBlockchainServiceOptions = {
    todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    explorerBaseUrl: 'https://basescan.org',
  };

  const mockTestnetOptions: BaseNetworkBlockchainServiceOptions = {
    todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
    explorerBaseUrl: 'https://sepolia.basescan.org',
  };

  beforeEach(() => {
    service = new BaseNetworkBlockchainService(mockOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with Base mainnet configuration', () => {
      const mainnetService = new BaseNetworkBlockchainService(mockOptions);
      expect(mainnetService.getNetwork()).toBe(BlockchainNetwork.BASE);
    });

    it('should initialize with Base Sepolia testnet configuration', () => {
      const testnetService = new BaseNetworkBlockchainService(mockTestnetOptions);
      expect(testnetService.getNetwork()).toBe(BlockchainNetwork.BASE_TESTNET);
    });

    it('should set correct explorer URLs', () => {
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const address = '0x1234567890123456789012345678901234567890';

      expect(service.getTransactionExplorerUrl(txHash)).toBe(
        'https://basescan.org/tx/0x1234567890123456789012345678901234567890123456789012345678901234',
      );
      expect(service.getAddressExplorerUrl(address)).toBe(
        'https://basescan.org/address/0x1234567890123456789012345678901234567890',
      );
    });
  });

  describe('wallet connection', () => {
    it('should connect wallet successfully', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };

      const walletInfo = await service.connectWallet(mockProvider);

      expect(walletInfo).toEqual({
        address: '0x1234567890123456789012345678901234567890',
        network: BlockchainNetwork.BASE,
        isConnected: true,
        chainId: '8453',
      });
    });

    it('should throw error for wrong network', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(1), // Ethereum mainnet
        }),
      };

      await expect(service.connectWallet(mockProvider)).rejects.toThrow(BlockchainError);
    });

    it('should handle connection errors', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockImplementation(() => {
          throw new Error('Connection failed');
        }),
      };

      await expect(service.connectWallet(mockProvider)).rejects.toThrow(BlockchainError);
    });

    it('should disconnect wallet successfully', async () => {
      // First connect
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);

      // Then disconnect
      await service.disconnectWallet();

      expect(await service.isWalletConnected()).toBe(false);
      expect(await service.getWalletInfo()).toBe(null);
    });
  });

  describe('wallet status', () => {
    it('should return false when wallet is not connected', async () => {
      expect(await service.isWalletConnected()).toBe(false);
    });

    it('should return true when wallet is connected', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);

      expect(await service.isWalletConnected()).toBe(true);
    });

    it('should return wallet info when connected', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      const walletInfo = await service.connectWallet(mockProvider);

      expect(await service.getWalletInfo()).toEqual(walletInfo);
    });
  });

  describe('wallet balance', () => {
    beforeEach(async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    it('should get native ETH balance', async () => {
      const balance = await service.getWalletBalance();
      expect(balance).toBe('2000000000000000000'); // Mock balance (2 ETH)
    });

    it('should get ERC20 token balance', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890';
      const balance = await service.getWalletBalance(tokenAddress);
      expect(balance).toBe('1000000000000000000'); // Mock balance (1 TOKEN)
    });

    it('should throw error when wallet not connected', async () => {
      await service.disconnectWallet();
      await expect(service.getWalletBalance()).rejects.toThrow(BlockchainError);
    });
  });

  describe('todo operations', () => {
    beforeEach(async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    describe('getTodos', () => {
      it('should get all todos successfully', async () => {
        const todos = await service.getTodos();

        expect(todos).toHaveLength(4);
        expect(todos[0]).toEqual({
          id: '1',
          title: 'Deploy on Base L2',
          description: "Successfully deploy todo contracts on Base, Coinbase's Ethereum L2 optimistic rollup",
          status: BlockchainTodoStatus.IN_PROGRESS,
          completed: false,
          owner: '0x1234567890123456789012345678901234567890',
          network: BlockchainNetwork.BASE,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        expect(todos[1].title).toBe('Test L2 transaction speeds');
        expect(todos[2].title).toBe('Optimize for low gas costs');
        expect(todos[3].title).toBe('Integrate with Base ecosystem');
      });

      it('should throw error when wallet not connected', async () => {
        await service.disconnectWallet();
        await expect(service.getTodos()).rejects.toThrow(BlockchainError);
      });
    });

    describe('getTodoById', () => {
      it('should get specific todo by ID', async () => {
        const todo = await service.getTodoById('1');

        expect(todo).toEqual({
          id: '1',
          title: 'Deploy on Base L2',
          description: "Successfully deploy todo contracts on Base, Coinbase's Ethereum L2 optimistic rollup",
          status: BlockchainTodoStatus.IN_PROGRESS,
          completed: false,
          owner: '0x1234567890123456789012345678901234567890',
          network: BlockchainNetwork.BASE,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it('should return null for non-existent todo', async () => {
        const todo = await service.getTodoById('999');
        expect(todo).toBe(null);
      });

      it('should throw error when wallet not connected', async () => {
        await service.disconnectWallet();
        await expect(service.getTodoById('1')).rejects.toThrow(BlockchainError);
      });
    });

    describe('createTodo', () => {
      const todoInput = {
        title: 'Test Base Todo',
        description: 'Testing todo creation on Base L2',
        status: BlockchainTodoStatus.TODO,
        completed: false,
      };

      it('should create todo successfully', async () => {
        const receipt = await service.createTodo(todoInput);

        expect(receipt).toEqual({
          transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
          status: TransactionStatus.CONFIRMED,
          blockNumber: 8453678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          gasUsed: '50000',
          effectiveGasPrice: '500000000',
          network: BlockchainNetwork.BASE,
          timestamp: expect.any(Date),
        });
      });

      it('should throw error when wallet not connected', async () => {
        await service.disconnectWallet();
        await expect(service.createTodo(todoInput)).rejects.toThrow(BlockchainError);
      });
    });

    describe('updateTodo', () => {
      const updateInput = {
        title: 'Updated Base Todo',
        completed: true,
      };

      it('should update todo successfully', async () => {
        const receipt = await service.updateTodo('1', updateInput);

        expect(receipt).toEqual({
          transactionHash: '0x2345678901234567890123456789012345678901234567890123456789012345',
          status: TransactionStatus.CONFIRMED,
          blockNumber: 8453678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          gasUsed: '50000',
          effectiveGasPrice: '500000000',
          network: BlockchainNetwork.BASE,
          timestamp: expect.any(Date),
        });
      });

      it('should throw error when wallet not connected', async () => {
        await service.disconnectWallet();
        await expect(service.updateTodo('1', updateInput)).rejects.toThrow(BlockchainError);
      });
    });

    describe('deleteTodo', () => {
      it('should delete todo successfully', async () => {
        const receipt = await service.deleteTodo('1');

        expect(receipt).toEqual({
          transactionHash: '0x3456789012345678901234567890123456789012345678901234567890123456',
          status: TransactionStatus.CONFIRMED,
          blockNumber: 8453678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          gasUsed: '50000',
          effectiveGasPrice: '500000000',
          network: BlockchainNetwork.BASE,
          timestamp: expect.any(Date),
        });
      });

      it('should throw error when wallet not connected', async () => {
        await service.disconnectWallet();
        await expect(service.deleteTodo('1')).rejects.toThrow(BlockchainError);
      });
    });
  });

  describe('transaction operations', () => {
    beforeEach(async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    describe('getTransactionStatus', () => {
      it('should get confirmed transaction status', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
        const status = await service.getTransactionStatus(txHash);
        expect(status).toBe(TransactionStatus.CONFIRMED);
      });

      it('should get failed transaction status', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901235';
        const status = await service.getTransactionStatus(txHash);
        expect(status).toBe(TransactionStatus.FAILED);
      });

      it('should get pending transaction status', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901236';
        const status = await service.getTransactionStatus(txHash);
        expect(status).toBe(TransactionStatus.PENDING);
      });
    });

    describe('getTransactionReceipt', () => {
      it('should get confirmed transaction receipt', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
        const receipt = await service.getTransactionReceipt(txHash);

        expect(receipt).toEqual({
          transactionHash: txHash,
          blockNumber: 8453678,
          blockHash: '0x9876543210987654321098765432109876543210987654321098765432109876',
          status: TransactionStatus.CONFIRMED,
          from: '0x1234567890123456789012345678901234567890',
          to: mockOptions.todoListFactoryAddress,
          gasUsed: '50000',
          effectiveGasPrice: '500000000',
          network: BlockchainNetwork.BASE,
          timestamp: expect.any(Date),
          fee: '25000000000000',
        });
      });

      it('should get failed transaction receipt', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901235';
        const receipt = await service.getTransactionReceipt(txHash);

        expect(receipt).toEqual({
          transactionHash: txHash,
          blockNumber: 8453679,
          blockHash: '0x8765432109876543210987654321098765432109876543210987654321098765',
          status: TransactionStatus.FAILED,
          from: '0x1234567890123456789012345678901234567890',
          to: mockOptions.todoListFactoryAddress,
          gasUsed: '50000',
          effectiveGasPrice: '500000000',
          network: BlockchainNetwork.BASE,
          timestamp: expect.any(Date),
          fee: '25000000000000',
        });
      });

      it('should return null for pending transaction', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901236';
        const receipt = await service.getTransactionReceipt(txHash);
        expect(receipt).toBe(null);
      });
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    it('should handle Base-specific errors', async () => {
      // Mock a Base-specific error
      const mockError = new Error('Base L2 sequencer error');
      jest.spyOn(service as any, 'isBaseSpecificError').mockReturnValue(true);

      const todoInput = {
        title: 'Test Todo',
        description: 'Test Description',
        status: BlockchainTodoStatus.TODO,
        completed: false,
      };

      // Mock the monitorTransaction to throw the error
      jest.spyOn(service as any, 'monitorTransaction').mockRejectedValue(mockError);

      await expect(service.createTodo(todoInput)).rejects.toThrow(BlockchainError);
    });

    it('should identify Base-specific errors correctly', () => {
      const baseErrors = [
        new Error('base connection failed'),
        new Error('L2 error occurred'),
        new Error('optimistic rollup issue'),
        new Error('sequencer unavailable'),
        new Error('coinbase infrastructure error'),
        new Error('bridge error detected'),
        new Error('rollup error'),
      ];

      const genericErrors = [
        new Error('generic network error'),
        new Error('ethereum connection failed'),
        new Error('polygon error'),
      ];

      baseErrors.forEach(error => {
        expect((service as any).isBaseSpecificError(error)).toBe(true);
      });

      genericErrors.forEach(error => {
        expect((service as any).isBaseSpecificError(error)).toBe(false);
      });
    });

    it('should handle network errors gracefully', async () => {
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';

      // Mock getTransactionReceipt to throw an error
      jest.spyOn(service, 'getTransactionReceipt').mockRejectedValue(new Error('Network error'));

      await expect(service.getTransactionStatus(txHash)).rejects.toThrow(BlockchainError);
    });
  });

  describe('network-specific features', () => {
    it('should handle Base mainnet configuration', () => {
      const mainnetService = new BaseNetworkBlockchainService(mockOptions);
      expect(mainnetService.getNetwork()).toBe(BlockchainNetwork.BASE);
    });

    it('should handle Base Sepolia testnet configuration', () => {
      const testnetService = new BaseNetworkBlockchainService(mockTestnetOptions);
      expect(testnetService.getNetwork()).toBe(BlockchainNetwork.BASE_TESTNET);
    });

    it('should use correct gas settings for Base L2', async () => {
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const receipt = await service.getTransactionReceipt(txHash);

      // Base has very low gas usage and fees due to L2 optimizations
      expect(receipt?.gasUsed).toBe('50000');
      expect(receipt?.effectiveGasPrice).toBe('500000000'); // 0.5 gwei
      expect(receipt?.fee).toBe('25000000000000'); // Gas used * gas price
    });

    it('should provide Base-specific todo examples', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(8453),
        }),
      };
      await service.connectWallet(mockProvider);

      const todos = await service.getTodos();

      // Check that todos contain Base-specific content
      expect(todos.some(todo => todo.title.includes('Base L2'))).toBe(true);
      expect(todos.some(todo => todo.description.includes('Coinbase'))).toBe(true);
      expect(todos.some(todo => todo.description.includes('optimistic rollup'))).toBe(true);
    });
  });
});
