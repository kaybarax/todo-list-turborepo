import { vi } from 'vitest';

import { BlockchainError, BlockchainErrorType, BlockchainNetwork } from '../errors';
import { TransactionMonitor, TransactionStatus, type TransactionReceipt } from '../monitoring';

// Mock timers for testing
vi.useFakeTimers();

describe('TransactionMonitor', () => {
  let monitor: TransactionMonitor;
  let mockGetStatusFn: ReturnType<typeof vi.fn<(hash: string) => Promise<TransactionReceipt | null>>>;

  beforeEach(() => {
    monitor = new TransactionMonitor();
    mockGetStatusFn = vi.fn();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a monitor with default options', () => {
      const monitor = new TransactionMonitor();
      expect(monitor).toBeInstanceOf(TransactionMonitor);
    });

    it('should create a monitor with custom options', () => {
      const options = {
        maxAttempts: 10,
        pollingInterval: 2000,
        timeout: 60000,
        onStatusChange: vi.fn(),
      };
      const monitor = new TransactionMonitor(options);
      expect(monitor).toBeInstanceOf(TransactionMonitor);
    });
  });

  describe('monitorTransaction', () => {
    const mockReceipt: TransactionReceipt = {
      transactionHash: '0x123',
      blockNumber: 12345,
      status: TransactionStatus.CONFIRMED,
      from: '0xabc',
      to: '0xdef',
      network: BlockchainNetwork.POLYGON,
    };

    it('should successfully monitor a transaction that confirms', async () => {
      mockGetStatusFn
        .mockResolvedValueOnce(null) // First call - pending
        .mockResolvedValueOnce(mockReceipt); // Second call - confirmed

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      // Fast-forward through first polling interval
      vi.advanceTimersByTime(5000);
      await Promise.resolve(); // Allow promises to resolve

      // Fast-forward through second polling interval
      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      const result = await promise;
      expect(result).toEqual(mockReceipt);
      expect(mockGetStatusFn).toHaveBeenCalledTimes(2);
    });

    it('should reject when transaction fails', async () => {
      const failedReceipt: TransactionReceipt = {
        ...mockReceipt,
        status: TransactionStatus.FAILED,
      };

      mockGetStatusFn.mockResolvedValueOnce(failedReceipt);

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow(BlockchainError);
      await expect(promise).rejects.toThrow('Transaction failed on the blockchain');
    });

    it('should timeout after specified duration', async () => {
      mockGetStatusFn.mockResolvedValue(null); // Always pending

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn, {
        timeout: 10000,
      });

      // Fast-forward past timeout
      vi.advanceTimersByTime(10001);

      await expect(promise).rejects.toThrow(BlockchainError);
      await expect(promise).rejects.toThrow('Transaction monitoring timed out after 10000ms');
    });

    it('should exceed max attempts and reject', async () => {
      mockGetStatusFn.mockResolvedValue(null); // Always pending

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn, {
        maxAttempts: 2,
        pollingInterval: 1000,
      });

      // Fast-forward through attempts
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      }

      await expect(promise).rejects.toThrow(BlockchainError);
      await expect(promise).rejects.toThrow('Transaction monitoring exceeded maximum attempts (2)');
    });

    it('should call onStatusChange callback', async () => {
      const onStatusChange = vi.fn();
      const pendingReceipt: TransactionReceipt = {
        ...mockReceipt,
        status: TransactionStatus.PENDING,
      };

      mockGetStatusFn
        .mockResolvedValueOnce(pendingReceipt)
        .mockResolvedValueOnce({ ...mockReceipt, status: TransactionStatus.CONFIRMED });

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn, {
        onStatusChange,
      });

      // First status update
      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      // Second status update
      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      await promise;

      expect(onStatusChange).toHaveBeenCalledTimes(2);
      expect(onStatusChange).toHaveBeenNthCalledWith(1, TransactionStatus.PENDING, pendingReceipt);
      expect(onStatusChange).toHaveBeenNthCalledWith(
        2,
        TransactionStatus.CONFIRMED,
        expect.objectContaining({
          status: TransactionStatus.CONFIRMED,
        }),
      );
    });

    it('should handle errors from getStatusFn', async () => {
      const error = new Error('RPC error');
      mockGetStatusFn.mockRejectedValueOnce(error);

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow(BlockchainError);
      await expect(promise).rejects.toThrow('Error monitoring transaction');
    });

    it('should use transaction-specific options', async () => {
      const onStatusChange = vi.fn();
      mockGetStatusFn.mockResolvedValue(mockReceipt);

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn, {
        pollingInterval: 1000,
        onStatusChange,
      });

      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      await promise;

      expect(onStatusChange).toHaveBeenCalledWith(TransactionStatus.CONFIRMED, mockReceipt);
    });

    it('should handle multiple concurrent transactions', async () => {
      const receipt1: TransactionReceipt = { ...mockReceipt, transactionHash: '0x111' };
      const receipt2: TransactionReceipt = { ...mockReceipt, transactionHash: '0x222' };

      const mockGetStatus1 = vi.fn().mockResolvedValue(receipt1);
      const mockGetStatus2 = vi.fn().mockResolvedValue(receipt2);

      const promise1 = monitor.monitorTransaction('0x111', BlockchainNetwork.POLYGON, mockGetStatus1);
      const promise2 = monitor.monitorTransaction('0x222', BlockchainNetwork.POLYGON, mockGetStatus2);

      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(receipt1);
      expect(result2).toEqual(receipt2);
    });
  });

  describe('getStatus', () => {
    it('should return UNKNOWN for non-existent transaction', () => {
      const status = monitor.getStatus('0x999');
      expect(status).toBe(TransactionStatus.UNKNOWN);
    });

    it('should return correct status for monitored transaction', async () => {
      const pendingReceipt: TransactionReceipt = {
        ...{
          transactionHash: '0x123',
          blockNumber: 12345,
          status: TransactionStatus.PENDING,
          from: '0xabc',
          to: '0xdef',
          network: BlockchainNetwork.POLYGON,
        },
      };

      mockGetStatusFn.mockResolvedValue(pendingReceipt);

      void monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      // Check initial status
      expect(monitor.getStatus('0x123')).toBe(TransactionStatus.PENDING);

      // Advance timer and check updated status
      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      expect(monitor.getStatus('0x123')).toBe(TransactionStatus.PENDING);

      // Stop monitoring to prevent hanging promise
      monitor.stopMonitoring('0x123');
    });
  });

  describe('getReceipt', () => {
    it('should return undefined for non-existent transaction', () => {
      const receipt = monitor.getReceipt('0x999');
      expect(receipt).toBeUndefined();
    });

    it('should return receipt for monitored transaction', async () => {
      const mockReceipt: TransactionReceipt = {
        transactionHash: '0x123',
        blockNumber: 12345,
        status: TransactionStatus.PENDING,
        from: '0xabc',
        to: '0xdef',
        network: BlockchainNetwork.POLYGON,
      };

      mockGetStatusFn.mockResolvedValue(mockReceipt);

      void monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      const receipt = monitor.getReceipt('0x123');
      expect(receipt).toEqual(mockReceipt);

      // Stop monitoring to prevent hanging promise
      monitor.stopMonitoring('0x123');
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring a transaction', async () => {
      mockGetStatusFn.mockResolvedValue(null);

      void monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      // Start monitoring
      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      // Stop monitoring
      monitor.stopMonitoring('0x123');

      // Check that transaction is no longer tracked
      expect(monitor.getStatus('0x123')).toBe(TransactionStatus.UNKNOWN);
      expect(monitor.getReceipt('0x123')).toBeUndefined();
    });

    it('should clear timeout when stopping monitoring', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      mockGetStatusFn.mockResolvedValue(null);

      void monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      // Start monitoring
      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      // Stop monitoring
      monitor.stopMonitoring('0x123');

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should handle stopping non-existent transaction gracefully', () => {
      expect(() => monitor.stopMonitoring('0x999')).not.toThrow();
    });
  });

  describe('error scenarios', () => {
    it('should handle BlockchainError from getStatusFn', async () => {
      const blockchainError = new BlockchainError(BlockchainErrorType.NETWORK_ERROR, 'Network connection failed', {
        network: BlockchainNetwork.POLYGON,
      });

      mockGetStatusFn.mockRejectedValue(blockchainError);

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow(BlockchainError);
      await expect(promise).rejects.toThrow('Error monitoring transaction');
    });

    it('should handle timeout race condition correctly', async () => {
      mockGetStatusFn.mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(null), 15000); // Longer than timeout
          }),
      );

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn, {
        timeout: 10000,
      });

      // Fast-forward past timeout
      vi.advanceTimersByTime(10001);

      await expect(promise).rejects.toThrow('Transaction monitoring timed out after 10000ms');
    });
  });

  describe('edge cases', () => {
    it('should handle transaction that becomes confirmed immediately', async () => {
      mockGetStatusFn.mockResolvedValue({
        transactionHash: '0x123',
        status: TransactionStatus.CONFIRMED,
        from: '0xabc',
        network: BlockchainNetwork.POLYGON,
      });

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      const result = await promise;
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(mockGetStatusFn).toHaveBeenCalledTimes(1);
    });

    it('should handle empty/null responses from getStatusFn', async () => {
      mockGetStatusFn.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce({
        transactionHash: '0x123',
        status: TransactionStatus.CONFIRMED,
        from: '0xabc',
        network: BlockchainNetwork.POLYGON,
      });

      const promise = monitor.monitorTransaction('0x123', BlockchainNetwork.POLYGON, mockGetStatusFn);

      // Advance through multiple polling cycles
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(5000);
        await Promise.resolve();
      }

      const result = await promise;
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
      expect(mockGetStatusFn).toHaveBeenCalledTimes(3);
    });

    it('should handle different blockchain networks', async () => {
      const networks = [
        BlockchainNetwork.POLYGON,
        BlockchainNetwork.SOLANA,
        BlockchainNetwork.BASE,
        BlockchainNetwork.MOONBEAM,
      ];

      for (const network of networks) {
        const receipt: TransactionReceipt = {
          transactionHash: `0x${network}`,
          status: TransactionStatus.CONFIRMED,
          from: '0xabc',
          network,
        };

        const mockFn = vi.fn().mockResolvedValue(receipt);
        const promise = monitor.monitorTransaction(`0x${network}`, network, mockFn);

        vi.advanceTimersByTime(5000);
        await Promise.resolve();

        const result = await promise;
        expect(result.network).toBe(network);
      }
    });
  });
});
