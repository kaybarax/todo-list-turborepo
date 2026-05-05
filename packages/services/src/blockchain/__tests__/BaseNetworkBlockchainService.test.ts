// @ts-nocheck
import { BaseNetworkBlockchainService } from '../implementations/BaseNetworkBlockchainService';
import { BlockchainNetwork, TransactionStatus, BlockchainTodoStatus } from '../types';
import { BlockchainError } from '@todo/utils/blockchain/errors';

describe('BaseNetworkBlockchainService', () => {
  const mockOptions = {
    todoListFactoryAddress: '0xFactory',
    rpcUrl: 'http://base',
    chainId: 8453,
    explorerBaseUrl: 'https://basescan.org',
  };

  let service: BaseNetworkBlockchainService;
  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue('0xAddress'),
    getChainId: jest.fn().mockResolvedValue(8453),
  };
  const mockProvider = {
    getSigner: jest.fn().mockReturnValue(mockSigner),
  };

  beforeEach(() => {
    service = new BaseNetworkBlockchainService(mockOptions);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set network to BASE_TESTNET if chainId is 84532', () => {
      const testnetService = new BaseNetworkBlockchainService({ ...mockOptions, chainId: 84532 });
      expect(testnetService.getNetwork()).toBe(BlockchainNetwork.BASE_TESTNET);
    });
  });

  describe('connectWallet', () => {
    it('should connect successfully', async () => {
      const wallet = await service.connectWallet(mockProvider);
      expect(wallet.address).toBe('0xAddress');
      expect(wallet.isConnected).toBe(true);
    });

    it('should throw networkSwitchRequired if chainId mismatch', async () => {
      mockSigner.getChainId.mockResolvedValueOnce(1);
      await expect(service.connectWallet(mockProvider)).rejects.toThrow();
    });

    it('should handle non-BlockchainError in catch', async () => {
      const badProvider = {
        getSigner: () => {
          throw new Error('fail');
        },
      };
      await expect(service.connectWallet(badProvider)).rejects.toThrow();
    });
  });

  describe('getWalletBalance', () => {
    it('should return native balance if no tokenAddress', async () => {
      await service.connectWallet(mockProvider);
      const balance = await service.getWalletBalance();
      expect(balance).toBe('2000000000000000000');
    });

    it('should return token balance if tokenAddress provided', async () => {
      await service.connectWallet(mockProvider);
      const balance = await service.getWalletBalance('0xToken');
      expect(balance).toBe('1000000000000000000');
    });
  });

  describe('getTodoById', () => {
    it('should return todo if ID is 1', async () => {
      await service.connectWallet(mockProvider);
      const todo = await service.getTodoById('1');
      expect(todo?.id).toBe('1');
    });

    it('should return null if ID is not 1', async () => {
      await service.connectWallet(mockProvider);
      const todo = await service.getTodoById('99');
      expect(todo).toBeNull();
    });
  });

  describe('error handling (isBaseSpecificError)', () => {
    it('should handle base-specific errors in createTodo', async () => {
      await service.connectWallet(mockProvider);
      jest.spyOn(service as any, 'monitorTransaction').mockImplementationOnce(() => {
        throw new Error('base sequencer error');
      });
      await expect(service.createTodo({})).rejects.toThrow();
    });

    it('should handle general errors in updateTodo', async () => {
      await service.connectWallet(mockProvider);
      jest.spyOn(service as any, 'monitorTransaction').mockImplementationOnce(() => {
        throw new Error('generic fail');
      });
      await expect(service.updateTodo('1', {})).rejects.toThrow();
    });

    it('should handle base errors in deleteTodo', async () => {
      await service.connectWallet(mockProvider);
      jest.spyOn(service as any, 'monitorTransaction').mockImplementationOnce(() => {
        throw new Error('l2 error');
      });
      await expect(service.deleteTodo('1')).rejects.toThrow();
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return confirmed receipt for hash ending in 4', async () => {
      const receipt = await service.getTransactionReceipt('0x...4');
      expect(receipt?.status).toBe(TransactionStatus.CONFIRMED);
    });
    it('should return failed receipt for hash ending in 5', async () => {
      const receipt = await service.getTransactionReceipt('0x...5');
      expect(receipt?.status).toBe(TransactionStatus.FAILED);
    });
    it('should return confirmed receipt for hash ending in 6', async () => {
      const receipt = await service.getTransactionReceipt('0x...6');
      expect(receipt?.status).toBe(TransactionStatus.CONFIRMED);
    });
    it('should return null for other hashes', async () => {
      const receipt = await service.getTransactionReceipt('0x...0');
      expect(receipt).toBeNull();
    });
  });
});
