import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { config } from '../config/env';

export const corsPlugin = (app: Elysia) =>
  app.use(
    cors({
      origin: config.CORS_ORIGIN ? config.CORS_ORIGIN.split(',') : true,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
