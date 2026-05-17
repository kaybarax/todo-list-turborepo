import { Elysia } from 'elysia';

export const indexRoute = new Elysia().get('/api/v1', () => ({
  service: 'api-gateway',
  version: '0.0.1',
  timestamp: new Date().toISOString(),
}));
