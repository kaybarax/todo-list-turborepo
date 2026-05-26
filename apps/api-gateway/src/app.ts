import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';

import { requestId } from './plugins/request-id';
import { indexRoute } from './routes/index.route';

export const app = new Elysia()
  .use(
    openapi({
      path: '/api/docs',
      documentation: {
        info: {
          title: 'API Gateway',
          description: 'Unified API Gateway for the Todo application',
          version: '0.0.1',
        },
        tags: [{ name: 'Gateway', description: 'Gateway general endpoints' }],
      },
      exclude: {
        paths: ['/api/docs', '/api/docs/json'],
      },
    }),
  )
  .use(requestId)
  .use(indexRoute);
