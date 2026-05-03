import { z } from 'zod';

/**
 * Todo priority levels
 */

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Todo status options
 */

export enum TodoStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

/**
 * Schema for validating todo items
 */
export const todoSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  status: z.nativeEnum(TodoStatus).default(TodoStatus.TODO),
  priority: z.nativeEnum(TodoPriority).default(TodoPriority.MEDIUM),
  dueDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  userId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

/**
 * Type definition for a todo item
 */
export type Todo = z.infer<typeof todoSchema>;

/**
 * Schema for creating a new todo
 */
export const createTodoSchema = todoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Type for creating a new todo
 */
export type CreateTodoInput = z.input<typeof createTodoSchema>;

/**
 * Schema for updating an existing todo
 */
export const updateTodoSchema = createTodoSchema.partial();

/**
 * Type for updating an existing todo
 */
export type UpdateTodoInput = z.input<typeof updateTodoSchema>;

/**
 * Schema for todo query parameters
 */
export const todoQuerySchema = z.object({
  status: z.nativeEnum(TodoStatus).optional(),
  priority: z.nativeEnum(TodoPriority).optional(),
  userId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type for todo query parameters
 */
export type TodoQueryParams = z.infer<typeof todoQuerySchema>;
