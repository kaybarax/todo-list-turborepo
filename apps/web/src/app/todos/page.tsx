'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, Button, BlockchainStats, FloatingActionButton, useToast } from '@todo/ui-web';
import { TodoFormModal } from '@/components/todo/TodoFormModal';
import { TodoList } from '@/components/todo/TodoList';
import { TodoFilters, type PriorityFilter, type StatusFilter } from '@/components/todo/TodoFilters';
import { TodoBulkActions } from '@/components/todo/TodoBulkActions';
import { useTodoStore } from '@/store/todoStore';
import { useWallet } from '@/components/WalletProvider';
import type { BlockchainNetwork } from '@todo/services';
import type { TodoData as Todo } from '@/components/todo/TodoItem';

const TodosPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const {
    todos,
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    markAllDone,
    clearCompleted,
    undo,
    canUndo,
    syncToBlockchain,
    fetchTodos,
  } = useTodoStore();

  const { isConnected, supportedNetworks } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    void fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    if (error) {
      toast({
        variant: 'error',
        title: 'An error occurred',
        description: error,
      });
    }
  }, [error, toast]);

  const filteredTodos = useMemo(() => {
    const term = search.trim().toLowerCase();

    return todos.filter(todo => {
      if (status === 'open' && todo.completed) return false;
      if (status === 'completed' && !todo.completed) return false;

      if (priority !== 'all' && todo.priority !== priority) return false;

      if (term.length > 0) {
        const inTitle = todo.title.toLowerCase().includes(term);
        const inDescription = (todo.description ?? '').toLowerCase().includes(term);
        const inTags = (todo.tags ?? []).some(tag => {
          const lower = tag.toLowerCase();
          return lower.includes(term) || `#${lower}`.includes(term);
        });

        if (!inTitle && !inDescription && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [todos, search, priority, status]);

  const blockchainStats = useMemo(() => {
    const total = filteredTodos.length;
    const onChain = filteredTodos.filter(todo => todo.blockchainNetwork).length;
    const offChain = total - onChain;

    const networkBreakdown = filteredTodos.reduce(
      (acc, todo) => {
        if (todo.blockchainNetwork) {
          acc[todo.blockchainNetwork] = (acc[todo.blockchainNetwork] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const pendingTransactions = filteredTodos.filter(todo => todo.transactionHash && !todo.blockchainAddress).length;

    return {
      total,
      onChain,
      offChain,
      networkBreakdown,
      pendingTransactions,
      syncPercentage: total > 0 ? Math.round((onChain / total) * 100) : 0,
    };
  }, [filteredTodos]);

  const handleClearFilters = () => {
    setSearch('');
    setPriority('all');
    setStatus('all');
  };

  const handleRefresh = () => {
    void fetchTodos();
  };

  const handleSubmit = (todoData: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    tags: string[];
  }) => {
    const fullTodoData = {
      ...todoData,
      completed: editingTodo?.completed || false,
      dueDate: todoData.dueDate ? new Date(todoData.dueDate) : undefined,
    };

    if (editingTodo) {
      updateTodo(editingTodo.id, fullTodoData);
      toast({ variant: 'success', title: 'Todo updated' });
      setEditingTodo(null);
    } else {
      addTodo(fullTodoData);
      toast({ variant: 'success', title: 'Todo created' });
    }
    setShowForm(false);
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTodo(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      deleteTodo(id);
      toast({ variant: 'info', title: 'Todo deleted' });
    }
  };

  const handleMarkAllDone = () => {
    const hasOpenTodos = todos.some(todo => !todo.completed);
    if (!hasOpenTodos) {
      toast({ variant: 'info', title: 'No open todos to mark as done.' });
      return;
    }
    markAllDone();
    toast({ variant: 'success', title: 'Marked all todos as done.' });
  };

  const handleClearCompleted = () => {
    const hasCompletedTodos = todos.some(todo => todo.completed);
    if (!hasCompletedTodos) {
      toast({ variant: 'info', title: 'No completed todos to clear.' });
      return;
    }
    clearCompleted();
    toast({ variant: 'success', title: 'Cleared completed todos.' });
  };

  const handleUndo = () => {
    if (!canUndo) return;
    undo();
    toast({ title: 'Action reverted', description: 'The last bulk action has been undone.' });
  };

  const handleBlockchainSync = (todoId: string, network: BlockchainNetwork) => {
    toast({ title: 'Syncing to blockchain...', description: `Todo is being synced to ${network}.` });
    syncToBlockchain(todoId, network)
      .then(() =>
        toast({ variant: 'success', title: 'Sync successful', description: 'Todo has been synced to the blockchain.' }),
      )
      .catch(err => toast({ variant: 'error', title: 'Sync failed', description: (err as Error).message }));
  };

  const filteredHasTodos = filteredTodos.length > 0;
  const filteredHasCompleted = filteredTodos.some(todo => todo.completed);

  const emptyState =
    !isLoading && filteredTodos.length === 0 ? (
      todos.length === 0 ? (
        <div className="rounded-lg border border-base-300 bg-base-100 p-6 text-center">
          <h3 className="text-base font-semibold text-base-content">You have no todos yet</h3>
          <p className="mt-2 text-sm text-base-content/70">Create your first todo to get started.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-base-300 bg-base-100 p-6 text-center">
          <h3 className="text-base font-semibold text-base-content">No results match your filters</h3>
          <p className="mt-2 text-sm text-base-content/70">Try adjusting or clearing your filters.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={handleClearFilters}>
            Clear filters
          </Button>
        </div>
      )
    ) : undefined;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todo Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create, manage, and sync your todos to blockchain networks.</p>
        </div>
        <Button onClick={() => setShowForm(true)} variant="default" className="hidden sm:inline-flex">
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Todo
        </Button>
      </div>

      <TodoFormModal
        open={showForm}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        initialData={
          editingTodo
            ? {
                title: editingTodo.title,
                description: editingTodo.description,
                priority: editingTodo.priority,
                dueDate: editingTodo.dueDate ? editingTodo.dueDate.toISOString().split('T')[0] : undefined,
                tags: editingTodo.tags,
              }
            : undefined
        }
      />

      {!isConnected && todos.length > 0 && (
        <Alert variant="warning" className="mb-6">
          <div className="flex-1">
            <h3 className="font-bold">Wallet Not Connected</h3>
            <p className="text-xs">Connect your wallet to sync todos to blockchain networks.</p>
          </div>
          <a href="/wallet" className="btn btn-sm btn-warning">
            Go to wallet page
          </a>
        </Alert>
      )}

      <TodoFilters
        search={search}
        onSearchChange={setSearch}
        priority={priority}
        onPriorityChange={setPriority}
        status={status}
        onStatusChange={setStatus}
        onClear={handleClearFilters}
      />

      <TodoBulkActions
        onMarkAllDone={handleMarkAllDone}
        onClearCompleted={handleClearCompleted}
        onUndo={canUndo ? handleUndo : undefined}
        hasTodos={filteredHasTodos && !isLoading}
        hasCompleted={filteredHasCompleted && !isLoading}
        canUndo={canUndo}
      />

      {blockchainStats.total > 0 && <BlockchainStats data={blockchainStats} />}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}

      <TodoList
        todos={filteredTodos}
        onToggle={toggleTodo}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBlockchainSync={isConnected ? handleBlockchainSync : undefined}
        supportedNetworks={supportedNetworks}
        loading={isLoading}
        showFilters={false}
        emptyState={emptyState}
        onRefresh={handleRefresh}
        refreshing={isLoading}
      />
      <FloatingActionButton onClick={() => setShowForm(true)} className="sm:hidden" />
    </div>
  );
};

export default TodosPage;
