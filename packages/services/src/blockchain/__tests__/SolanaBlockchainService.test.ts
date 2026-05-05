import { SolanaBlockchainService } from '../implementations/SolanaBlockchainService';
import { BlockchainNetwork, TransactionStatus } from '../types';
import { BlockchainError } from '@todo/utils/blockchain/errors';

describe('SolanaBlockchainService', () => {
  let service: SolanaBlockchainService;

  beforeEach(() => {
    service = new SolanaBlockchainService();
  });

  describe('connectWallet', () => {
    it('should connect successfully with valid options', async () => {
      const mockWalletAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        publicKey: { toString: () => 'SolanaAddress123' },
      };
      const options = {
        walletAdapter: mockWalletAdapter,
      };
      const walletInfo = await service.connectWallet(options);
      expect(walletInfo.isConnected).toBe(true);
      expect(walletInfo.address).toBe('SolanaAddress123');
    });

    it('should use default rpcUrl if not provided', async () => {
      const mockWalletAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        publicKey: { toString: () => 'Addr' },
      };
      await expect(service.connectWallet({ walletAdapter: mockWalletAdapter })).resolves.toBeDefined();
    });

    it('should throw error if walletAdapter is missing', async () => {
      await expect(service.connectWallet()).rejects.toThrow(BlockchainError);
    });

    it('should throw error if publicKey is missing after connect', async () => {
      const mockWalletAdapter = {
        connect: jest.fn().mockResolvedValue(undefined),
        publicKey: null,
      };
      await expect(service.connectWallet({ walletAdapter: mockWalletAdapter })).rejects.toThrow(BlockchainError);
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect successfully', async () => {
      const disconnectSpy = jest.fn().mockResolvedValue(undefined);
      (service as any).wallet = { disconnect: disconnectSpy };
      await service.disconnectWallet();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle wallet without disconnect function', async () => {
      (service as any).wallet = {};
      await expect(service.disconnectWallet()).resolves.toBeUndefined();
    });
  });

  describe('getWalletBalance', () => {
    it('should return balance for native token', async () => {
      (service as any).walletInfo = { isConnected: true };
      const balance = await service.getWalletBalance();
      expect(balance).toBe('0');
    });

    it('should throw error for SPL tokens', async () => {
      (service as any).walletInfo = { isConnected: true };
      await expect(service.getWalletBalance('token123')).rejects.toThrow();
    });
  });

  describe('transactions', () => {
    beforeEach(() => {
      (service as any).walletInfo = { isConnected: true, address: 'addr1' };
    });

    it('should create todo', async () => {
      const receipt = await service.createTodo({ title: 'Test' } as any);
      expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
    });

    it('should use default address if walletInfo address is missing', async () => {
      (service as any).walletInfo = { isConnected: true };
      const receipt = await service.createTodo({ title: 'Test' } as any);
      expect(receipt.from).toBe('mock_address');
    });
  });

  describe('getTransactionStatus', () => {
    it('should return CONFIRMED for solana_ tx', async () => {
      const status = await service.getTransactionStatus('solana_123');
      expect(status).toBe(TransactionStatus.CONFIRMED);
    });

    it('should return UNKNOWN for other tx', async () => {
      const status = await service.getTransactionStatus('other_123');
      expect(status).toBe(TransactionStatus.UNKNOWN);
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return receipt for solana_ tx', async () => {
      const receipt = await service.getTransactionReceipt('solana_123');
      expect(receipt?.transactionHash).toBe('solana_123');
    });

    it('should return null for other tx', async () => {
      const receipt = await service.getTransactionReceipt('other_123');
      expect(receipt).toBeNull();
    });
  });
});
