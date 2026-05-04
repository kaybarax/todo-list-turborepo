import { Elysia, t } from 'elysia';

import { type TodoDocument } from './todo.model';
import { todoService } from './todo.service';
import { UnauthorizedError } from '../../plugins/errors';
import { jwtPlugin } from '../../plugins/jwt';
import { ErrorResponseSchema } from '../../schemas/common';
import {
  CreateTodoBodySchema,
  UpdateTodoBodySchema,
  TodoQuerySchema,
  TodoSchema,
  PaginatedTodosSchema,
  TodoStatsSchema,
} from '../../schemas/todo';

/**
 * Map Mongoose Todo document to Schema Todo object
 */
const mapTodo = (todo: TodoDocument) => ({
  id: (todo._id as any).toString(),
  title: todo.title,
  description: todo.description,
  completed: todo.completed,
  priority: todo.priority,
  dueDate: todo.dueDate?.toISOString(),
  tags: todo.tags,
  userId: todo.userId,
  blockchainNetwork: todo.blockchainNetwork,
  transactionHash: todo.transactionHash,
  blockchainAddress: todo.blockchainAddress,
  createdAt: todo.createdAt.toISOString(),
  updatedAt: todo.updatedAt.toISOString(),
});

export const todoController = new Elysia({ prefix: '/todos' })
  .use(jwtPlugin)
  .onBeforeHandle(({ user }) => {
    if (!user) throw new UnauthorizedError('Authentication required');
  })
  .post(
    '/',
    async ({ body, user, set }) => {
      const todo = await todoService.create(body as any, user!.id);
      set.status = 201;
      return mapTodo(todo);
    },
    {
      body: CreateTodoBodySchema,
      response: {
        201: TodoSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Create a new todo',
        security: [{ bearer: [] }],
      },
    },
  )
  .get(
    '/',
    async ({ query, user }) => {
      const result = await todoService.findAll(query as any, user!.id);
      return {
        ...result,
        todos: result.todos.map(mapTodo),
      };
    },
    {
      query: TodoQuerySchema,
      response: {
        200: PaginatedTodosSchema,
        401: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Get all todos with filtering and pagination',
        security: [{ bearer: [] }],
      },
    },
  )
  .get(
    '/stats',
    async ({ user }) => {
      return todoService.getStats(user!.id);
    },
    {
      response: {
        200: TodoStatsSchema,
        401: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Get todo statistics',
        security: [{ bearer: [] }],
      },
    },
  )
  .get(
    '/:id',
    async ({ params: { id }, user }) => {
      const todo = await todoService.findOne(id, user!.id);
      return mapTodo(todo);
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: TodoSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Get a todo by ID',
        security: [{ bearer: [] }],
      },
    },
  )
  .patch(
    '/:id',
    async ({ params: { id }, body, user }) => {
      const todo = await todoService.update(id, body as any, user!.id);
      return mapTodo(todo);
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateTodoBodySchema,
      response: {
        200: TodoSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Update a todo (Partial)',
        security: [{ bearer: [] }],
      },
    },
  )
  .put(
    '/:id',
    async ({ params: { id }, body, user }) => {
      const todo = await todoService.update(id, body as any, user!.id);
      return mapTodo(todo);
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateTodoBodySchema,
      response: {
        200: TodoSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Update a todo (Full/Alias)',
        security: [{ bearer: [] }],
      },
    },
  )
  .patch(
    '/:id/toggle',
    async ({ params: { id }, user }) => {
      const todo = await todoService.toggleComplete(id, user!.id);
      return mapTodo(todo);
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: TodoSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Toggle todo completion status',
        security: [{ bearer: [] }],
      },
    },
  )
  .delete(
    '/:id',
    async ({ params: { id }, user, set }) => {
      await todoService.remove(id, user!.id);
      set.status = 204;
      return;
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        204: t.Undefined(),
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      detail: {
        tags: ['Todos'],
        summary: 'Delete a todo',
        security: [{ bearer: [] }],
      },
    },
  );
