import {
  PolygonBlockchainService,
  type PolygonBlockchainServiceOptions,
} from '../implementations/PolygonBlockchainService';
import { BlockchainNetwork, TransactionStatus, BlockchainTodoStatus } from '../types';
import { BlockchainError } from '@todo/utils/blockchain/errors';

// Mock the TransactionMonitor from utils
jest.mock('@todo/utils/blockchain/monitoring', () => ({
  TransactionMonitor: jest.fn().mockImplementation(() => ({
    monitorTransaction: jest.fn().mockImplementation((txHash, _network) => {
      if (txHash.endsWith('4')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: 'confirmed',
          blockNumber: 12345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '100000',
          effectiveGasPrice: '20000000000',
          network: 'polygon',
          timestamp: new Date(),
        });
      }
      if (txHash.endsWith('5')) {
        return Promise.reject(new Error('Transaction failed on the blockchain'));
      }
      if (txHash.endsWith('6')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: 'confirmed',
          blockNumber: 12345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '100000',
          effectiveGasPrice: '20000000000',
          network: 'polygon',
          timestamp: new Date(),
        });
      }
      return Promise.resolve(null);
    }),
  })),
  TransactionStatus: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    UNKNOWN: 'unknown',
  },
}));

import { TransactionMonitor } from '@todo/utils/blockchain/monitoring';

describe('PolygonBlockchainService', () => {
  let service: PolygonBlockchainService;

  const mockOptions: PolygonBlockchainServiceOptions = {
    todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    explorerBaseUrl: 'https://polygonscan.com',
  };

  const mockTestnetOptions: PolygonBlockchainServiceOptions = {
    todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    explorerBaseUrl: 'https://mumbai.polygonscan.com',
  };

  beforeEach(() => {
    service = new PolygonBlockchainService(mockOptions);
    // Directly mock monitorTransaction on the service instance
    jest.spyOn(service as any, 'monitorTransaction').mockImplementation((...args: unknown[]) => {
      const txHash = args[0] as string;
      if (txHash.endsWith('4')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: TransactionStatus.CONFIRMED,
          blockNumber: 12345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '100000',
          effectiveGasPrice: '20000000000',
          network: BlockchainNetwork.POLYGON,
          timestamp: new Date(),
        });
      }
      if (txHash.endsWith('6')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: TransactionStatus.CONFIRMED,
          blockNumber: 12345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '100000',
          effectiveGasPrice: '20000000000',
          network: BlockchainNetwork.POLYGON,
          timestamp: new Date(),
        });
      }
      if (txHash.endsWith('5')) {
        return Promise.reject(new Error('Transaction failed on the blockchain'));
      }
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with Polygon mainnet configuration', () => {
      const mainnetService = new PolygonBlockchainService(mockOptions);
      expect(mainnetService.getNetwork()).toBe(BlockchainNetwork.POLYGON);
    });

    it('should initialize with Polygon Mumbai testnet configuration', () => {
      const testnetService = new PolygonBlockchainService(mockTestnetOptions);
      expect(testnetService.getNetwork()).toBe(BlockchainNetwork.POLYGON_MUMBAI);
    });
  });

  describe('wallet connection', () => {
    it('should connect wallet successfully', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(137),
        }),
      };
      const walletInfo = await service.connectWallet(mockProvider);

      expect(walletInfo).toEqual({
        address: '0x1234567890123456789012345678901234567890',
        network: BlockchainNetwork.POLYGON,
        isConnected: true,
        chainId: '137',
      });
    });

    it('should return false when wallet is not connected', async () => {
      expect(await service.isWalletConnected()).toBe(false);
    });

    it('should return true when wallet is connected', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(137),
        }),
      };
      await service.connectWallet(mockProvider);
      expect(await service.isWalletConnected()).toBe(true);
    });
  });

  describe('wallet balance', () => {
    beforeEach(async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(137),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    it('should get native balance', async () => {
      const balance = await service.getWalletBalance();
      expect(balance).toBe('2000000000000000000'); // Mock balance
    });

    it('should get ERC20 token balance', async () => {
      const balance = await service.getWalletBalance('0xToken');
      expect(balance).toBe('1000000000000000000'); // Mock balance
    });
  });

  describe('todo operations', () => {
    beforeEach(async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(137),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    describe('getTodos', () => {
      it('should get all todos successfully', async () => {
        const todos = await service.getTodos();
        expect(todos).toHaveLength(2);
        expect(todos[0].title).toBe('Complete Polygon integration');
      });
    });

    describe('getTodoById', () => {
      it('should get specific todo by ID', async () => {
        const todo = await service.getTodoById('1');
        expect(todo?.id).toBe('1');
        expect(todo?.title).toBe('Complete Polygon integration');
      });

      it('should return null for non-existent todo', async () => {
        const todo = await service.getTodoById('999');
        expect(todo).toBe(null);
      });
    });

    describe('createTodo', () => {
      const todoInput = {
        title: 'Test Todo',
        description: 'Test Description',
        status: BlockchainTodoStatus.TODO,
        completed: false,
      };

      it('should create todo successfully', async () => {
        const receipt = await service.createTodo(todoInput);
        expect(receipt).toEqual(
          expect.objectContaining({
            transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
            status: TransactionStatus.CONFIRMED,
            network: BlockchainNetwork.POLYGON,
          }),
        );
      });
    });

    describe('updateTodo', () => {
      const updateInput = {
        title: 'Updated Todo',
        completed: true,
      };

      it('should update todo successfully', async () => {
        // Change mock for this test to succeed with hash ending in 5
        jest.spyOn(service as any, 'monitorTransaction').mockResolvedValue({
          transactionHash: '0x2345678901234567890123456789012345678901234567890123456789012345',
          status: TransactionStatus.CONFIRMED,
          network: BlockchainNetwork.POLYGON,
          from: '0x1234567890123456789012345678901234567890',
        });
        const receipt = await service.updateTodo('1', updateInput);
        expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
      });
    });

    describe('deleteTodo', () => {
      it('should delete todo successfully', async () => {
        const receipt = await service.deleteTodo('1');
        expect(receipt.transactionHash).toBe('0x3456789012345678901234567890123456789012345678901234567890123456');
        expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
      });
    });
  });

  describe('transaction operations', () => {
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
    });
  });
});
