import { t } from 'elysia';

/**
 * Standard error response schema matching NestJS default error structure
 */
export const ErrorResponseSchema = t.Object({
  statusCode: t.Number(),
  message: t.Union([t.String(), t.Array(t.String())]),
  error: t.String(),
});

export type ErrorResponse = typeof ErrorResponseSchema.static;
