import {
  MoonbeamBlockchainService,
  MoonbeamBlockchainServiceOptions,
} from '../implementations/MoonbeamBlockchainService';
import { BlockchainNetwork, TransactionStatus, BlockchainTodoStatus } from '../types';
import { BlockchainError } from '@todo/utils/blockchain/errors';

// Mock the TransactionMonitor from utils
jest.mock('@todo/utils/blockchain/monitoring', () => ({
  TransactionMonitor: jest.fn().mockImplementation(() => ({
    monitorTransaction: jest.fn().mockImplementation((txHash, network) => {
      if (txHash.endsWith('4')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: 'confirmed',
          blockNumber: 2345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: 'moonbeam',
          timestamp: new Date(),
          fee: '80000000000000',
          blockHash: '0x9876543210987654321098765432109876543210987654321098765432109876',
        });
      }
      if (txHash.endsWith('5')) {
        return Promise.reject(new Error('Transaction failed on the blockchain'));
      }
      if (txHash.endsWith('6')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: 'confirmed',
          blockNumber: 2345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: 'moonbeam',
          timestamp: new Date(),
          fee: '80000000000000',
          blockHash: '0x3456789012345678901234567890123456789012345678901234567890123456',
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

describe('MoonbeamBlockchainService', () => {
  let service: MoonbeamBlockchainService;
  let mockProvider: any;

  const mockOptions: MoonbeamBlockchainServiceOptions = {
    todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
    rpcUrl: 'https://rpc.api.moonbeam.network',
    chainId: 1284,
    explorerBaseUrl: 'https://moonscan.io',
  };

  const mockTestnetOptions: MoonbeamBlockchainServiceOptions = {
    todoListFactoryAddress: '0x1234567890123456789012345678901234567890',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    chainId: 1287,
    explorerBaseUrl: 'https://moonbase.moonscan.io',
  };

  beforeEach(() => {
    service = new MoonbeamBlockchainService(mockOptions);
    // Directly mock monitorTransaction on the service instance
    jest.spyOn(service as any, 'monitorTransaction').mockImplementation((...args: unknown[]) => {
      const txHash = args[0] as string;
      if (txHash.endsWith('4')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: TransactionStatus.CONFIRMED,
          blockNumber: 2345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: BlockchainNetwork.MOONBEAM,
          timestamp: new Date(),
          fee: '80000000000000',
          blockHash: '0x9876543210987654321098765432109876543210987654321098765432109876',
        });
      }
      if (txHash.endsWith('6')) {
        return Promise.resolve({
          transactionHash: txHash,
          status: TransactionStatus.CONFIRMED,
          blockNumber: 2345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: BlockchainNetwork.MOONBEAM,
          timestamp: new Date(),
          fee: '80000000000000',
          blockHash: '0x3456789012345678901234567890123456789012345678901234567890123456',
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
    it('should initialize with Moonbeam mainnet configuration', () => {
      const mainnetService = new MoonbeamBlockchainService(mockOptions);
      expect(mainnetService.getNetwork()).toBe(BlockchainNetwork.MOONBEAM);
    });

    it('should initialize with Moonbeam testnet configuration', () => {
      const testnetService = new MoonbeamBlockchainService(mockTestnetOptions);
      expect(testnetService.getNetwork()).toBe(BlockchainNetwork.MOONBEAM_TESTNET);
    });

    it('should set correct explorer URLs', () => {
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const address = '0x1234567890123456789012345678901234567890';

      expect(service.getTransactionExplorerUrl(txHash)).toBe(
        'https://moonscan.io/tx/0x1234567890123456789012345678901234567890123456789012345678901234',
      );
      expect(service.getAddressExplorerUrl(address)).toBe(
        'https://moonscan.io/address/0x1234567890123456789012345678901234567890',
      );
    });
  });

  describe('wallet connection', () => {
    it('should connect wallet successfully', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(1284),
        }),
      };

      const walletInfo = await service.connectWallet(mockProvider);

      expect(walletInfo).toEqual({
        address: '0x1234567890123456789012345678901234567890',
        network: BlockchainNetwork.MOONBEAM,
        isConnected: true,
        chainId: '1284',
      });
    });

    it('should throw error for wrong network', async () => {
      const wrongNetworkProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(1), // Ethereum mainnet
        }),
      };

      try {
        await service.connectWallet(wrongNetworkProvider);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.name).toBe('BlockchainError');
        expect(error.message).toContain('Please switch to Moonbeam network');
      }
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
          getChainId: jest.fn().mockResolvedValue(1284),
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
          getChainId: jest.fn().mockResolvedValue(1284),
        }),
      };
      await service.connectWallet(mockProvider);

      expect(await service.isWalletConnected()).toBe(true);
    });

    it('should return wallet info when connected', async () => {
      const mockProvider = {
        getSigner: jest.fn().mockReturnValue({
          getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
          getChainId: jest.fn().mockResolvedValue(1284),
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
          getChainId: jest.fn().mockResolvedValue(1284),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    it('should get native token balance', async () => {
      const balance = await service.getWalletBalance();
      expect(balance).toBe('2000000000000000000'); // Mock balance
    });

    it('should get ERC20 token balance', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890';
      const balance = await service.getWalletBalance(tokenAddress);
      expect(balance).toBe('1000000000000000000'); // Mock balance
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
          getChainId: jest.fn().mockResolvedValue(1284),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    describe('getTodos', () => {
      it('should get all todos successfully', async () => {
        const todos = await service.getTodos();

        expect(todos).toHaveLength(3);
        expect(todos[0]).toEqual({
          id: '1',
          title: 'Deploy on Moonbeam parachain',
          description: "Successfully deploy todo contracts on Moonbeam's EVM-compatible parachain",
          status: BlockchainTodoStatus.IN_PROGRESS,
          completed: false,
          owner: '0x1234567890123456789012345678901234567890',
          network: BlockchainNetwork.MOONBEAM,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
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
          title: 'Deploy on Moonbeam parachain',
          description: "Successfully deploy todo contracts on Moonbeam's EVM-compatible parachain",
          status: BlockchainTodoStatus.IN_PROGRESS,
          completed: false,
          owner: '0x1234567890123456789012345678901234567890',
          network: BlockchainNetwork.MOONBEAM,
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
        title: 'Test Moonbeam Todo',
        description: 'Testing todo creation on Moonbeam',
        status: BlockchainTodoStatus.TODO,
        completed: false,
      };

      it('should create todo successfully', async () => {
        const receipt = await service.createTodo(todoInput);

        expect(receipt).toEqual({
          transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
          status: TransactionStatus.CONFIRMED,
          blockNumber: 2345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: BlockchainNetwork.MOONBEAM,
          timestamp: expect.any(Date),
          fee: '80000000000000',
          blockHash: '0x9876543210987654321098765432109876543210987654321098765432109876',
        });
      });

      it('should throw error when wallet not connected', async () => {
        await service.disconnectWallet();
        await expect(service.createTodo(todoInput)).rejects.toThrow(BlockchainError);
      });
    });

    describe('updateTodo', () => {
      const updateInput = {
        title: 'Updated Moonbeam Todo',
        completed: true,
      };

      it('should update todo successfully', async () => {
        // Change mock for this test to succeed with hash ending in 5
        jest.spyOn(service as any, 'monitorTransaction').mockResolvedValue({
          transactionHash: '0x2345678901234567890123456789012345678901234567890123456789012345',
          status: TransactionStatus.CONFIRMED,
          network: BlockchainNetwork.MOONBEAM,
          from: '0x1234567890123456789012345678901234567890',
        });
        const receipt = await service.updateTodo('1', updateInput);

        expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
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
          blockNumber: 2345678,
          from: '0x1234567890123456789012345678901234567890',
          to: '0x1234567890123456789012345678901234567890',
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: BlockchainNetwork.MOONBEAM,
          timestamp: expect.any(Date),
          fee: '80000000000000',
          blockHash: '0x3456789012345678901234567890123456789012345678901234567890123456',
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
          getChainId: jest.fn().mockResolvedValue(1284),
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
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901237';
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
          blockNumber: 2345678,
          blockHash: '0x9876543210987654321098765432109876543210987654321098765432109876',
          status: TransactionStatus.CONFIRMED,
          from: '0x1234567890123456789012345678901234567890',
          to: mockOptions.todoListFactoryAddress,
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: BlockchainNetwork.MOONBEAM,
          timestamp: expect.any(Date),
          fee: '80000000000000',
        });
      });

      it('should get failed transaction receipt', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901235';
        const receipt = await service.getTransactionReceipt(txHash);

        expect(receipt).toEqual({
          transactionHash: txHash,
          blockNumber: 2345679,
          blockHash: '0x8765432109876543210987654321098765432109876543210987654321098765',
          status: TransactionStatus.FAILED,
          from: '0x1234567890123456789012345678901234567890',
          to: mockOptions.todoListFactoryAddress,
          gasUsed: '80000',
          effectiveGasPrice: '1000000000',
          network: BlockchainNetwork.MOONBEAM,
          timestamp: expect.any(Date),
          fee: '80000000000000',
        });
      });

      it('should return null for pending transaction', async () => {
        const txHash = '0x1234567890123456789012345678901234567890123456789012345678901237';
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
          getChainId: jest.fn().mockResolvedValue(1284),
        }),
      };
      await service.connectWallet(mockProvider);
    });

    it('should handle Moonbeam-specific errors', async () => {
      // Mock a Moonbeam-specific error
      const mockError = new Error('Moonbeam substrate error');
      jest.spyOn(service as any, 'isMoonbeamSpecificError').mockReturnValue(true);

      const todoInput = {
        title: 'Test Todo',
        description: 'Test Description',
        status: BlockchainTodoStatus.TODO,
        completed: false,
      };

      // Mock the monitorTransaction to throw the error
      jest.spyOn(service as any, 'monitorTransaction').mockRejectedValue(mockError);

      try {
        await service.createTodo(todoInput);
        throw new Error('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Moonbeam');
      }
    });

    it('should identify Moonbeam-specific errors correctly', () => {
      const moonbeamErrors = [
        new Error('moonbeam connection failed'),
        new Error('substrate error occurred'),
        new Error('parachain issue detected'),
        new Error('polkadot integration error'),
        new Error('GLMR token error'),
        new Error('DEV token insufficient'),
      ];

      const genericErrors = [
        new Error('generic network error'),
        new Error('ethereum connection failed'),
        new Error('polygon error'),
      ];

      moonbeamErrors.forEach(error => {
        expect((service as any).isMoonbeamSpecificError(error)).toBe(true);
      });

      genericErrors.forEach(error => {
        expect((service as any).isMoonbeamSpecificError(error)).toBe(false);
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
    it('should handle Moonbeam mainnet configuration', () => {
      const mainnetService = new MoonbeamBlockchainService(mockOptions);
      expect(mainnetService.getNetwork()).toBe(BlockchainNetwork.MOONBEAM);
    });

    it('should handle Moonbase Alpha testnet configuration', () => {
      const testnetService = new MoonbeamBlockchainService(mockTestnetOptions);
      expect(testnetService.getNetwork()).toBe(BlockchainNetwork.MOONBEAM_TESTNET);
    });

    it('should use correct gas settings for Moonbeam', async () => {
      const txHash = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const receipt = await service.getTransactionReceipt(txHash);

      // Moonbeam typically has lower gas usage and fees
      expect(receipt?.gasUsed).toBe('80000');
      expect(receipt?.effectiveGasPrice).toBe('1000000000'); // 1 gwei
      expect(receipt?.fee).toBe('80000000000000'); // Gas used * gas price
    });
  });
});
