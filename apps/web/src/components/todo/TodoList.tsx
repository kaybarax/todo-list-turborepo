'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button, cn, Input, Select } from '@todo/ui-web';
import { TodoData, TodoItem } from './TodoItem';
import { BlockchainNetwork } from '@todo/services';

const todoListVariants = cva('w-full', {
  variants: {
    variant: {
      default: 'space-y-4',
      compact: 'space-y-2',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type FilterType = 'all' | 'active' | 'completed';
export type SortType = 'created' | 'priority' | 'dueDate' | 'title';

export interface TodoListStats {
  total: number;
  completed: number;
  active: number;
  overdue: number;
}

export interface TodoListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onToggle'>,
    VariantProps<typeof todoListVariants> {
  todos: TodoData[];
  onToggle: (todoId: string) => void;
  onEdit: (todo: TodoData) => void;
  onDelete: (todoId: string) => void;
  onBlockchainSync?: (todoId: string, network: BlockchainNetwork) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  showStats?: boolean;
  showFilters?: boolean;
  initialFilter?: FilterType;
  initialSort?: SortType;
  initialSearchTerm?: string;
  TransactionStatusComponent?: React.ComponentType<{
    transactionHash: string;
    network: BlockchainNetwork;
  }>;
  getNetworkDisplayInfo?: (network: BlockchainNetwork) => { displayName: string };
  supportedNetworks?: string[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const TodoList = React.forwardRef<HTMLDivElement, TodoListProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      todos,
      onToggle,
      onEdit,
      onDelete,
      onBlockchainSync,
      loading = false,
      emptyState,
      showStats = true,
      showFilters = true,
      initialFilter = 'all',
      initialSort = 'created',
      initialSearchTerm = '',
      TransactionStatusComponent,
      getNetworkDisplayInfo,
      supportedNetworks,
      onRefresh,
      refreshing = false,
      ...props
    },
    ref,
  ) => {
    const [filter, setFilter] = useState<FilterType>(initialFilter);
    const [sort, setSort] = useState<SortType>(initialSort);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

    const filteredAndSortedTodos = useMemo(() => {
      let filtered = todos;

      // Apply filter
      switch (filter) {
        case 'active':
          filtered = todos.filter(todo => !todo.completed);
          break;
        case 'completed':
          filtered = todos.filter(todo => todo.completed);
          break;
        default:
          filtered = todos;
      }

      // Apply search
      if (searchTerm) {
        filtered = filtered.filter(
          todo =>
            todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())),
        );
      }

      // Apply sort
      filtered.sort((a, b) => {
        switch (sort) {
          case 'priority': {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      return filtered;
    }, [todos, filter, sort, searchTerm]);

    const stats: TodoListStats = useMemo(() => {
      const total = todos.length;
      const completed = todos.filter(todo => todo.completed).length;
      const active = total - completed;
      const overdue = todos.filter(
        todo => todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed,
      ).length;

      return { total, completed, active, overdue };
    }, [todos]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    }, []);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter(e.target.value as FilterType);
    }, []);

    const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      setSort(e.target.value as SortType);
    }, []);

    const renderEmptyState = () => {
      if (emptyState) {
        return emptyState;
      }

      const refreshButton =
        onRefresh !== undefined ? (
          <Button className="mt-4" variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        ) : null;

      if (todos.length === 0) {
        return (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-base-content">No todos</h3>
            <p className="mt-1 text-sm text-base-content/70">Get started by creating a new todo.</p>
            {refreshButton}
          </div>
        );
      }

      return (
        <div className="text-center py-8">
          <p className="text-sm text-base-content/70">No todos match your current filter and search criteria.</p>
          {refreshButton}
        </div>
      );
    };

    const renderStats = () => {
      if (!showStats) return null;

      return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <div className="text-2xl font-bold text-base-content">{stats.total}</div>
            <div className="text-sm text-base-content/70">Total</div>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <div className="text-2xl font-bold text-info">{stats.active}</div>
            <div className="text-sm text-base-content/70">Active</div>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <div className="text-sm text-base-content/70">Completed</div>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
            <div className="text-2xl font-bold text-error">{stats.overdue}</div>
            <div className="text-sm text-base-content/70">Overdue</div>
          </div>
        </div>
      );
    };

    const renderControls = () => {
      if (!showFilters) return null;

      return (
        <div className="bg-base-100 p-4 rounded-lg shadow-sm border border-base-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search todos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            <div className="flex space-x-3">
              <Select value={filter} onChange={handleFilterChange}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </Select>

              <Select value={sort} onChange={handleSortChange}>
                <option value="created">Created Date</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
              </Select>
            </div>
          </div>
          <div className="mt-2 text-sm text-base-content/70">{filteredAndSortedTodos.length} todos to display</div>
        </div>
      );
    };

    const renderTodoList = () => {
      if (loading) {
        return (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        );
      }

      if (filteredAndSortedTodos.length === 0) {
        return renderEmptyState();
      }

      const todoItemVariant = variant === 'compact' ? 'compact' : variant === 'grid' ? 'default' : 'default';

      return (
        <div className={cn(todoListVariants({ variant: variant === 'grid' ? 'grid' : variant, size }))}>
          {filteredAndSortedTodos.map(todo => (
            <TodoItem
              key={todo.id}
              data-testid={`todo-item-${todo.id}`}
              todo={todo}
              variant={todoItemVariant}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onBlockchainSync={onBlockchainSync}
              hideActionsUntilHover
              TransactionStatusComponent={TransactionStatusComponent}
              getNetworkDisplayInfo={getNetworkDisplayInfo}
              supportedNetworks={supportedNetworks}
            />
          ))}
          {onRefresh ? (
            <div className="flex justify-center mt-4">
              <Button variant="link" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          ) : null}
        </div>
      );
    };

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {renderStats()}
        {renderControls()}
        {renderTodoList()}
      </div>
    );
  },
);

TodoList.displayName = 'TodoList';

export { TodoList, todoListVariants };
