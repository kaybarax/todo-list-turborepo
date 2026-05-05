import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodoStore } from '../src/store/todoStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock @todo/services to avoid real network/blockchain calls
jest.mock('@todo/services', () => {
  return {
    ApiClientFactory: class {
      constructor() {}
      getTodoClient() {
        return {
          getTodos: async () => ({ success: true, data: [] }),
        };
      }
      getAuthClient() {
        return {};
      }
    },
    TodoApiClient: class {
      async getTodos() {
        return { success: true, data: [] };
      }
    },
    BlockchainServiceFactory: class {
      getService() {
        return {
          updateTodo: async () => ({ status: 'success' }),
          getTransactionStatus: async () => 'success',
        };
      }
    },
  } as any;
});

describe('Background sync queue', () => {
  it('enqueues and processes a sync job', async () => {
    const { result } = renderHook(() => useTodoStore());

    act(() => {
      result.current.addTodo({ title: 'Queued item' });
    });

    const id = result.current.todos[0].id;

    // Enqueue a sync (network value is mocked, cast any)
    await act(async () => {
      await result.current.enqueueSync(id, 'polygon' as any);
    });

    // First persist should store a non-empty queue; then after processing, it should store an empty array
    const setItemMock = AsyncStorage.setItem as unknown as jest.Mock;

    // Wait briefly for processing to complete
    await new Promise(res => setTimeout(res, 50));

    const queueWrites = setItemMock.mock.calls.filter((c: any[]) => c[0] === '@todo/mobile/sync-queue');
    expect(queueWrites.length).toBeGreaterThanOrEqual(1);
    // Ensure the last write emptied the queue
    const last = queueWrites[queueWrites.length - 1];
    expect(last[1]).toBe(JSON.stringify([]));

    // Todo remains intact
    expect(result.current.todos.length).toBe(1);
  });
});
