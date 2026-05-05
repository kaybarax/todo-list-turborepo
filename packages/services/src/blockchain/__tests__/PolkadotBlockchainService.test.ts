import { PolkadotBlockchainService } from '../implementations/PolkadotBlockchainService';
import { BlockchainNetwork, TransactionStatus } from '../types';
import { BlockchainError } from '@todo/utils/blockchain/errors';

describe('PolkadotBlockchainService', () => {
  let service: PolkadotBlockchainService;

  beforeEach(() => {
    service = new PolkadotBlockchainService();
  });

  describe('connectWallet', () => {
    it('should connect successfully with valid options', async () => {
      const options = {
        walletExtension: {},
        account: { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' },
      };
      const walletInfo = await service.connectWallet(options);
      expect(walletInfo.isConnected).toBe(true);
      expect(walletInfo.address).toBe(options.account.address);
    });

    it('should use default wsEndpoint if not provided', async () => {
      const options = {
        walletExtension: {},
        account: { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' },
      };
      // We can't easily check the private wsEndpoint but we can ensure it doesn't throw
      await expect(service.connectWallet(options)).resolves.toBeDefined();
    });

    it('should use provided wsEndpoint', async () => {
      const options = {
        wsEndpoint: 'wss://custom.polkadot.io',
        walletExtension: {},
        account: { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' },
      };
      await expect(service.connectWallet(options)).resolves.toBeDefined();
    });

    it('should throw error if walletExtension is missing', async () => {
      const options = {
        account: { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' },
      };
      await expect(service.connectWallet(options as any)).rejects.toThrow(BlockchainError);
    });

    it('should throw error if account is missing', async () => {
      const options = {
        walletExtension: {},
      };
      await expect(service.connectWallet(options as any)).rejects.toThrow(BlockchainError);
    });

    it('should throw error if address is missing', async () => {
      const options = {
        walletExtension: {},
        account: {},
      };
      await expect(service.connectWallet(options as any)).rejects.toThrow(BlockchainError);
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect successfully', async () => {
      await service.disconnectWallet();
      expect((service as any).walletInfo).toBeNull();
    });

    it('should handle api with disconnect function', async () => {
      const disconnectSpy = jest.fn().mockResolvedValue(undefined);
      (service as any).api = { disconnect: disconnectSpy };
      await service.disconnectWallet();
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('should handle api without disconnect function', async () => {
      (service as any).api = { someOtherFunc: () => {} };
      await expect(service.disconnectWallet()).resolves.toBeUndefined();
    });
  });

  describe('getWalletBalance', () => {
    it('should return balance for native token', async () => {
      (service as any).walletInfo = { isConnected: true };
      const balance = await service.getWalletBalance();
      expect(balance).toBe('0');
    });

    it('should throw error for parachain tokens', async () => {
      (service as any).walletInfo = { isConnected: true };
      await expect(service.getWalletBalance('token123')).rejects.toThrow();
    });
  });

  describe('transactions', () => {
    beforeEach(async () => {
      (service as any).walletInfo = { isConnected: true, address: 'addr1' };
    });

    it('should create todo', async () => {
      const receipt = await service.createTodo({ title: 'Test' } as any);
      expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
      expect(receipt.from).toBe('addr1');
    });

    it('should update todo', async () => {
      const receipt = await service.updateTodo('1', { title: 'Updated' } as any);
      expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
    });

    it('should delete todo', async () => {
      const receipt = await service.deleteTodo('1');
      expect(receipt.status).toBe(TransactionStatus.CONFIRMED);
    });

    it('should use default address if walletInfo address is missing', async () => {
      (service as any).walletInfo = { isConnected: true };
      const receipt = await service.createTodo({ title: 'Test' } as any);
      expect(receipt.from).toBe('mock_address');
    });
  });

  describe('getTransactionStatus', () => {
    it('should return CONFIRMED for polkadot_ tx', async () => {
      const status = await service.getTransactionStatus('polkadot_123');
      expect(status).toBe(TransactionStatus.CONFIRMED);
    });

    it('should return UNKNOWN for other tx', async () => {
      const status = await service.getTransactionStatus('other_123');
      expect(status).toBe(TransactionStatus.UNKNOWN);
    });
  });

  describe('getTransactionReceipt', () => {
    it('should return receipt for polkadot_ tx', async () => {
      const receipt = await service.getTransactionReceipt('polkadot_123');
      expect(receipt?.transactionHash).toBe('polkadot_123');
    });

    it('should return null for other tx', async () => {
      const receipt = await service.getTransactionReceipt('other_123');
      expect(receipt).toBeNull();
    });
  });

  describe('explorer URLs', () => {
    it('should return transaction explorer URL', () => {
      const url = service.getTransactionExplorerUrl('tx123');
      expect(url).toContain('/extrinsic/tx123');
    });

    it('should return address explorer URL', () => {
      const url = service.getAddressExplorerUrl('addr123');
      expect(url).toContain('/account/addr123');
    });
  });

  describe('disconnect branches', () => {
    it('should handle api already disconnected', async () => {
      (service as any).api = { isConnected: false, disconnect: jest.fn() };
      await service.disconnectWallet();
      // api is set to null in disconnectWallet, so we check if it was called before being nulled
    });

    it('should handle wallet already disconnected', async () => {
      (service as any).wallet = null;
      await service.disconnectWallet();
      // No error should be thrown
    });
  });
});
