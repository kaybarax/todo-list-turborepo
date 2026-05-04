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

export const errors = (app: Elysia) =>
  app
    .error({
      BAD_REQUEST: BadRequestError,
      UNAUTHORIZED: UnauthorizedError,
      FORBIDDEN: ForbiddenError,
      NOT_FOUND: NotFoundError,
      CONFLICT: ConflictError,
    })
    .onError(({ code, error, set }) => {
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

          console.error(error);
          set.status = 500;
          return {
            statusCode: 500,
            message: 'Internal Server Error',
            error: 'Internal Server Error',
          };
      }
    });
