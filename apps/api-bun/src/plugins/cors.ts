import { cors } from '@elysiajs/cors';
import { type Elysia } from 'elysia';

import { config } from '../config/env';

export const corsPlugin = (app: Elysia) =>
  app.use(
    cors({
      origin: config.CORS_ORIGIN ? config.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
