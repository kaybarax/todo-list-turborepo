import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockchainServiceFactory, BlockchainNetwork, type UpdateBlockchainTodoInput } from '@todo/services';
import { todoClient } from '../config/api';

export type Todo = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
};

type NewTodo = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date
  tags?: string[];
};

export const useTodoStore = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const undoStackRef = useRef<Todo[][]>([]);
  const STORAGE_KEY = '@todo/mobile/todos';
  const QUEUE_KEY = '@todo/mobile/sync-queue';
  const processingRef = useRef(false);

  const fetchTodos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await todoClient.getTodos();
      if (res.success && res.data) {
        const data = (res.data as any[]).map(item => ({
          id: String(item.id || item._id),
          title: item.title,
          description: item.description,
          completed: !!item.completed,
        })) as Todo[];
        setTodos(data);
      } else {
        setError(res.error ?? 'Failed to load todos');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load todos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Array<Omit<Todo, 'dueDate'> & { dueDate?: string }>;
          const restored: Todo[] = parsed.map(t => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          }));
          setTodos(restored);
        }
        // Load background queue
        const qraw = await AsyncStorage.getItem(QUEUE_KEY);
        if (qraw)
          queueRef.current = JSON.parse(qraw) as Array<{ id: string; network: BlockchainNetwork; attempts: number }>;
      } catch {
        // ignore corrupted cache
      } finally {
        hydratedRef.current = true;
        // Kick off background processing after hydration
        void processQueue();
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to AsyncStorage when todos change (after hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    const save = async () => {
      try {
        const serializable = todos.map(t => ({
          ...t,
          dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
        }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
      } catch {
        // best-effort persistence
      }
    };
    void save();
  }, [todos]);

  const syncToBlockchain = useCallback(
    async (id: string, network: BlockchainNetwork) => {
      // Map our local todo to blockchain update input (title + completed for now)
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      // Minimal factory config; uses mock implementations by default
      const factory = new BlockchainServiceFactory({
        polygon: {
          mainnet: {
            rpcUrl: 'http://localhost:8545',
            todoListFactoryAddress: '0x0000000000000000000000000000000000000000',
          },
        },
        base: {
          mainnet: {
            rpcUrl: 'http://localhost:8545',
            todoListFactoryAddress: '0x0000000000000000000000000000000000000000',
          },
        },
        moonbeam: {
          mainnet: {
            rpcUrl: 'http://localhost:8545',
            todoListFactoryAddress: '0x0000000000000000000000000000000000000000',
          },
        },
      } as any);

      const service = factory.getService(network);
      // Retry with simple backoff up to 3 attempts
      const maxAttempts = 3;
      let attempt = 0;
      let lastError: unknown = null;
      const updates: UpdateBlockchainTodoInput = {
        title: todo.title,
        completed: todo.completed,
      };
      while (attempt < maxAttempts) {
        try {
          // Pick operation: if todo exists on chain we'd update; for demo always update
          const receipt = await service.updateTodo(id, updates);
          // Optionally wait for confirmation
          if (receipt.status === 'pending' && receipt.hash) {
            const status = await service.getTransactionStatus(receipt.hash);
            if (status === 'failed') throw new Error('Transaction failed');
          }
          return; // success
        } catch (e) {
          lastError = e;
          attempt += 1;
          await new Promise(r => setTimeout(r, 300 * attempt));
        }
      }
      throw lastError ?? new Error('Blockchain sync failed');
    },
    [todos],
  );

  // Background sync queue (very light)
  const queueRef = useRef<Array<{ id: string; network: BlockchainNetwork; attempts: number }>>([]);

  const persistQueue = async () => {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queueRef.current));
    } catch {
      // best-effort
    }
  };

  const enqueueSync = useCallback(async (id: string, network: BlockchainNetwork) => {
    queueRef.current.push({ id, network, attempts: 0 });
    await persistQueue();
    void processQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const job = queueRef.current[0];
        try {
          await syncToBlockchain(job.id, job.network);
          queueRef.current.shift();
          await persistQueue();
        } catch (e) {
          job.attempts += 1;
          if (job.attempts >= 5) {
            // Drop after 5 attempts
            queueRef.current.shift();
            await persistQueue();
          } else {
            // Simple backoff
            await new Promise(r => setTimeout(r, 500 * job.attempts));
          }
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [syncToBlockchain]);

  // Undo stack helpers (in-memory, not persisted)
  const pushSnapshot = useCallback((snapshot: Todo[]) => {
    // Cap to last 5 states
    const stack = undoStackRef.current;
    if (stack.length >= 5) {
      stack.shift();
    }
    // shallow clone array to decouple from future mutations
    stack.push(snapshot.map(t => ({ ...t })));
  }, []);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    const last = stack.pop();
    if (last) {
      setTodos(last);
    }
  }, []);

  const addTodo = useCallback((input: NewTodo) => {
    const newTodo: Todo = {
      id: Math.random().toString(36).slice(2),
      title: input.title,
      description: input.description,
      completed: false,
      priority: input.priority,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      tags: input.tags,
    };
    setTodos(prev => [newTodo, ...prev]);
  }, []);

  const updateTodo = useCallback((id: string, input: NewTodo) => {
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              title: input.title,
              description: input.description,
              priority: input.priority,
              dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
              tags: input.tags,
            }
          : t,
      ),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  // Bulk operations and state replacement (for undo scenarios)
  const replaceTodos = useCallback((next: Todo[]) => {
    setTodos(next);
  }, []);

  const markAllDone = useCallback(() => {
    setTodos(prev => {
      pushSnapshot(prev);
      return prev.map(t => ({ ...t, completed: true }));
    });
  }, [pushSnapshot]);

  const clearCompleted = useCallback(() => {
    setTodos(prev => {
      pushSnapshot(prev);
      return prev.filter(t => !t.completed);
    });
  }, [pushSnapshot]);

  return {
    todos,
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    replaceTodos,
    markAllDone,
    clearCompleted,
    undo,
    syncToBlockchain,
    enqueueSync,
    fetchTodos,
  } as const;
};
