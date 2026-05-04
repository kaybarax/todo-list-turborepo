import { type Elysia } from 'elysia';
import { rateLimit } from 'elysia-rate-limit';

export const rateLimitPlugin = (app: Elysia) =>
  app.use(
    rateLimit({
      duration: 60000,
      max: 100,
      errorResponse: 'Too many requests, please try again later.',
    }),
  );
