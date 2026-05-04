import { type Elysia } from 'elysia';
import { helmet } from 'elysia-helmet';

export const security = (app: Elysia) =>
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );
