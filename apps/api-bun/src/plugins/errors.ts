import { type Elysia } from 'elysia';

export class BadRequestError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends Error {
  constructor(public message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(public message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(public message: string = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

import { logger } from './logging';

function getStatusCode(code: string, error: unknown, status: unknown) {
  switch (code) {
    case 'BAD_REQUEST':
    case 'VALIDATION':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'CONFLICT':
      return 409;
    default: {
      if (error instanceof Error && error.name === 'CastError') {
        return 400;
      }

      if (typeof status === 'number') {
        return status;
      }

      if (status == null) {
        return 500;
      }

      const numericStatus = Number(status);
      return Number.isNaN(numericStatus) ? 500 : numericStatus;
    }
  }
}

export const errors = (app: Elysia) =>
  app
    .error({
      BAD_REQUEST: BadRequestError,
      UNAUTHORIZED: UnauthorizedError,
      FORBIDDEN: ForbiddenError,
      NOT_FOUND: NotFoundError,
      CONFLICT: ConflictError,
    })
    .onError(({ code, error, set, request, path }) => {
      const status = getStatusCode(code, error, set.status);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log errors using structured logger
      if (status >= 500) {
        logger.error(`${request.method} ${path} - ${errorMessage}`, {
          code,
          path,
          method: request.method,
          stack: errorStack,
        });
      } else {
        logger.warn(`${request.method} ${path} - ${errorMessage}`, {
          code,
          statusCode: status,
          path,
          method: request.method,
        });
      }

      switch (code) {
        case 'BAD_REQUEST':
        case 'VALIDATION':
          set.status = 400;
          return {
            statusCode: 400,
            message: error.message,
            error: 'Bad Request',
          };

        case 'UNAUTHORIZED':
          set.status = 401;
          return {
            statusCode: 401,
            message: error.message,
            error: 'Unauthorized',
          };

        case 'FORBIDDEN':
          set.status = 403;
          return {
            statusCode: 403,
            message: error.message,
            error: 'Forbidden',
          };

        case 'NOT_FOUND':
          set.status = 404;
          return {
            statusCode: 404,
            message: error.message,
            error: 'Not Found',
          };

        case 'CONFLICT':
          set.status = 409;
          return {
            statusCode: 409,
            message: error.message,
            error: 'Conflict',
          };

        default:
          if (error instanceof Error && error.name === 'CastError') {
            set.status = 400;
            return {
              statusCode: 400,
              message: 'Invalid ID format',
              error: 'Bad Request',
            };
          }

          set.status = 500;
          return {
            statusCode: 500,
            message: 'Internal Server Error',
            error: 'Internal Server Error',
          };
      }
    });
