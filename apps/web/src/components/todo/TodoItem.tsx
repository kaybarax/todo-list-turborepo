'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Edit, Trash2 } from 'lucide-react';
import { cn, Badge, Button, Checkbox, IconButton } from '@todo/ui-web';
import { BlockchainNetwork } from '@todo/services';

const todoItemVariants = cva('card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow', {
  variants: {
    variant: {
      default: 'card-normal',
      compact: 'card-compact',
      detailed: 'card-normal',
    },
    completed: {
      true: 'opacity-60',
      false: '',
    },
    overdue: {
      true: 'border-error',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    completed: false,
    overdue: false,
  },
});

export interface TodoData {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  blockchainNetwork?: BlockchainNetwork;
  transactionHash?: string;
  blockchainAddress?: string;
}

export interface TodoItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onToggle'>,
    VariantProps<typeof todoItemVariants> {
  todo: TodoData;
  onToggle: (todoId: string) => void;
  onEdit: (todo: TodoData) => void;
  onDelete: (todoId: string) => void;
  onBlockchainSync?: (todoId: string, network: BlockchainNetwork) => void;
  showActions?: boolean;
  showBlockchainInfo?: boolean;
  TransactionStatusComponent?: React.ComponentType<{
    transactionHash: string;
    network: BlockchainNetwork;
  }>;
  getNetworkDisplayInfo?: (network: BlockchainNetwork) => { displayName: string };
  supportedNetworks?: string[];
  hideActionsUntilHover?: boolean;
}

const TodoItem = React.forwardRef<HTMLDivElement, TodoItemProps>(
  (
    {
      className,
      variant = 'default',
      todo,
      onToggle,
      onEdit,
      onDelete,
      onBlockchainSync,
      showActions = true,
      showBlockchainInfo = true,
      TransactionStatusComponent,
      getNetworkDisplayInfo,
      supportedNetworks = [BlockchainNetwork.POLYGON, BlockchainNetwork.SOLANA],
      hideActionsUntilHover = false,
      ...props
    },
    ref,
  ) => {
    const [actionsVisible, setActionsVisible] = React.useState(!hideActionsUntilHover);
    const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

    const getNetworkDisplayName = (network: BlockchainNetwork) => {
      return getNetworkDisplayInfo
        ? getNetworkDisplayInfo(network).displayName
        : network.charAt(0).toUpperCase() + network.slice(1);
    };

    const getPriorityVariant = (priority: string) => {
      switch (priority) {
        case 'high':
          return 'error';
        case 'medium':
          return 'warning';
        case 'low':
          return 'secondary';
        default:
          return 'success';
      }
    };

    const renderSyncButton = () => {
      if (!onBlockchainSync) return null;
      if (variant === 'compact') return null;

      return (
        <details>
          <summary className="cursor-pointer list-none">
            <Button variant="outline" size="sm" asChild>
              <span className="cursor-pointer">Sync to blockchain</span>
            </Button>
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {supportedNetworks.map(network => (
              <Button
                key={network}
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => onBlockchainSync(todo.id, network as BlockchainNetwork)}
              >
                {getNetworkDisplayName(network as BlockchainNetwork)}
              </Button>
            ))}
          </div>
        </details>
      );
    };

    const formattedDueDate = todo.dueDate
      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
          new Date(todo.dueDate),
        )
      : null;

    return (
      <div
        ref={ref}
        className={cn(todoItemVariants({ variant, completed: todo.completed, overdue: isOverdue, className }))}
        onMouseEnter={event => {
          setActionsVisible(true);
          props.onMouseEnter?.(event);
        }}
        onMouseLeave={event => {
          setActionsVisible(false);
          props.onMouseLeave?.(event);
        }}
        {...props}
      >
        <div className="card-body">
          <div className="flex items-start gap-4">
            <Checkbox
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
              aria-label={`Mark ${todo.title} as ${todo.completed ? 'incomplete' : 'complete'}`}
            />
            <div className="flex-1">
              <h3 className={cn('card-title', { 'line-through text-base-content/50': todo.completed })}>
                {todo.title}
              </h3>
              {variant !== 'compact' && todo.description && (
                <p className="text-sm text-base-content/70 mt-1">{todo.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-base-content/70">
                <Badge variant={getPriorityVariant(todo.priority)} size="sm">
                  {todo.priority}
                </Badge>
                {formattedDueDate && (
                  <Badge variant={isOverdue ? 'error' : 'outline'} size="sm">
                    Due: {formattedDueDate}
                  </Badge>
                )}
              </div>

              {variant !== 'compact' && todo.tags && todo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {todo.tags.map(tag => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {showBlockchainInfo && todo.blockchainNetwork && todo.transactionHash && TransactionStatusComponent && (
                <div className="mt-3">
                  <span className="sr-only">{getNetworkDisplayName(todo.blockchainNetwork)}</span>
                  <TransactionStatusComponent transactionHash={todo.transactionHash} network={todo.blockchainNetwork} />
                </div>
              )}
              {showBlockchainInfo && todo.blockchainNetwork && !todo.transactionHash && (
                <div className="mt-3 text-sm text-base-content/70">{getNetworkDisplayName(todo.blockchainNetwork)}</div>
              )}
            </div>
          </div>

          {showActions && actionsVisible && (
            <div className="card-actions justify-end mt-4">
              {renderSyncButton()}
              <IconButton
                variant="ghost"
                size="sm"
                title="Edit todo"
                aria-label="Edit todo"
                onClick={() => onEdit(todo)}
              >
                <Edit className="h-4 w-4" />
              </IconButton>
              <IconButton
                variant="ghost"
                size="sm"
                title="Delete todo"
                aria-label="Delete todo"
                onClick={() => onDelete(todo.id)}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          )}
        </div>
      </div>
    );
  },
);

TodoItem.displayName = 'TodoItem';

export { TodoItem, todoItemVariants };
