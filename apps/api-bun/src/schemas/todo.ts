import { t } from 'elysia';

/**
 * Priority levels for todos
 */
export const PriorityEnum = t.Enum({
  low: 'low',
  medium: 'medium',
  high: 'high',
});

/**
 * Blockchain networks
 */
export const BlockchainNetworkEnum = t.Enum({
  solana: 'solana',
  polkadot: 'polkadot',
  polygon: 'polygon',
});

/**
 * Create Todo request body
 */
export const CreateTodoBodySchema = t.Object(
  {
    title: t.String({
      minLength: 1,
      maxLength: 200,
      description: 'Todo title',
      example: 'Complete project documentation',
    }),
    description: t.Optional(
      t.String({
        maxLength: 1000,
        description: 'Todo description',
        example: 'Write comprehensive documentation for the todo application',
      }),
    ),
    priority: t.Optional(PriorityEnum),
    dueDate: t.Optional(
      t.String({
        format: 'date-time',
        description: 'Todo due date',
        example: '2024-01-15T00:00:00.000Z',
      }),
    ),
    tags: t.Optional(
      t.Array(t.String({ maxLength: 50 }), {
        description: 'Todo tags',
        example: ['work', 'documentation'],
      }),
    ),
  },
  {
    additionalProperties: false,
    description: 'Create Todo request body',
  },
);

/**
 * Update Todo request body
 */
export const UpdateTodoBodySchema = t.Object(
  {
    title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
    description: t.Optional(t.String({ maxLength: 1000 })),
    priority: t.Optional(PriorityEnum),
    dueDate: t.Optional(t.String({ format: 'date-time' })),
    tags: t.Optional(t.Array(t.String({ maxLength: 50 }))),
    completed: t.Optional(t.Boolean()),
    blockchainNetwork: t.Optional(BlockchainNetworkEnum),
    transactionHash: t.Optional(t.String({ maxLength: 255 })),
    blockchainAddress: t.Optional(t.String({ maxLength: 255 })),
  },
  {
    additionalProperties: false,
    description: 'Update Todo request body',
  },
);

/**
 * Todo search/filter query parameters
 */
export const TodoQuerySchema = t.Object(
  {
    page: t.Optional(
      t.Numeric({
        minimum: 1,
        default: 1,
        description: 'Page number for pagination',
      }),
    ),
    limit: t.Optional(
      t.Numeric({
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of items per page',
      }),
    ),
    completed: t.Optional(
      t.Boolean({
        description: 'Filter by completion status',
      }),
    ),
    priority: t.Optional(PriorityEnum),
    blockchainNetwork: t.Optional(BlockchainNetworkEnum),
    search: t.Optional(
      t.String({
        maxLength: 100,
        description: 'Search in title and description',
      }),
    ),
    tag: t.Optional(
      t.String({
        maxLength: 100,
        description: 'Filter by tag',
      }),
    ),
    sortBy: t.Optional(
      t.Enum(
        {
          createdAt: 'createdAt',
          updatedAt: 'updatedAt',
          title: 'title',
          priority: 'priority',
          dueDate: 'dueDate',
        },
        {
          default: 'createdAt',
          description: 'Sort field',
        },
      ),
    ),
    sortOrder: t.Optional(
      t.Enum(
        {
          asc: 'asc',
          desc: 'desc',
        },
        {
          default: 'desc',
          description: 'Sort order',
        },
      ),
    ),
  },
  {
    additionalProperties: false,
    description: 'Todo search/filter query parameters',
  },
);

/**
 * Individual Todo schema
 */
export const TodoSchema = t.Object(
  {
    id: t.String(),
    title: t.String(),
    description: t.Optional(t.String()),
    completed: t.Boolean(),
    priority: PriorityEnum,
    dueDate: t.Optional(t.String({ format: 'date-time' })),
    tags: t.Array(t.String()),
    userId: t.String(),
    blockchainNetwork: t.Optional(BlockchainNetworkEnum),
    transactionHash: t.Optional(t.String()),
    blockchainAddress: t.Optional(t.String()),
    createdAt: t.String({ format: 'date-time' }),
    updatedAt: t.String({ format: 'date-time' }),
  },
  {
    description: 'Individual Todo object',
  },
);

/**
 * Paginated Todos response
 */
export const PaginatedTodosSchema = t.Object(
  {
    todos: t.Array(TodoSchema),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
  },
  {
    description: 'Paginated list of Todos',
  },
);

/**
 * Todo statistics response
 */
export const TodoStatsSchema = t.Object(
  {
    total: t.Number(),
    completed: t.Number(),
    active: t.Number(),
    overdue: t.Number(),
    byPriority: t.Object({}, { additionalProperties: t.Number() }),
    byBlockchainNetwork: t.Object({}, { additionalProperties: t.Number() }),
  },
  {
    description: 'Todo statistics',
  },
);

export type CreateTodoBody = typeof CreateTodoBodySchema.static;
export type UpdateTodoBody = typeof UpdateTodoBodySchema.static;
export type TodoQuery = typeof TodoQuerySchema.static;
export type Todo = typeof TodoSchema.static;
export type PaginatedTodos = typeof PaginatedTodosSchema.static;
export type TodoStats = typeof TodoStatsSchema.static;
