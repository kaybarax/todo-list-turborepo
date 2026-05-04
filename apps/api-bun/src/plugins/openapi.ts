import { openapi as openapiPlugin } from '@elysiajs/openapi';
import { type Elysia } from 'elysia';

export const openapi = (app: Elysia) =>
  app.use(
    openapiPlugin({
      path: '/api/docs',
      documentation: {
        info: {
          title: 'Todo API',
          description: 'A modern todo application API with blockchain integration',
          version: '1.0',
        },
        tags: [
          { name: 'App', description: 'General endpoints' },
          { name: 'Authentication', description: 'Authentication endpoints' },
          { name: 'Users', description: 'User management endpoints' },
          { name: 'Todos', description: 'Todo management endpoints' },
          { name: 'Health', description: 'Health and readiness checks' },
        ],
        components: {
          securitySchemes: {
            bearer: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      exclude: {
        paths: ['/api/docs', '/api/docs/json', '/api/v1/health', '/api/v1/health/ready'],
      },
    }),
  );
