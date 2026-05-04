import { t } from 'elysia';

/**
 * MongoDB ObjectId pattern validation
 */
export const ObjectIdSchema = t.String({
  pattern: '^[0-9a-fA-F]{24}$',
  description: 'Valid MongoDB ObjectId',
  examples: ['507f1f77bcf86cd799439011'],
});

/**
 * Standard error response schema matching NestJS default error structure
 */
export const ErrorResponseSchema = t.Object({
  statusCode: t.Number(),
  message: t.Union([t.String(), t.Array(t.String())]),
  error: t.String(),
});

export type ErrorResponse = typeof ErrorResponseSchema.static;
