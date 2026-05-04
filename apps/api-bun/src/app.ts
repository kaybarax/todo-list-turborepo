import { Elysia } from 'elysia';

import { authController } from './modules/auth/auth.controller';
import { todoController } from './modules/todo/todo.controller';
import { userController } from './modules/user/user.controller';
import { corsPlugin } from './plugins/cors';
import { errors, UnauthorizedError } from './plugins/errors';
import { jwtPlugin } from './plugins/jwt';
import { openapi } from './plugins/openapi';
import { rateLimitPlugin } from './plugins/rate-limit';
import { security } from './plugins/security';
import { HealthResponseSchema, ReadinessResponseSchema } from './schemas/health';
import { sanitizer } from './utils/sanitizer';

export const app = new Elysia()
  .use(errors)
  .use(corsPlugin)
  .use(security)
  .use(rateLimitPlugin)
  .use(openapi)
  .use(jwtPlugin)
  .group('/api/v1', app =>
    app
      // Public Root
      .get(
        '/',
        () => ({
          message: 'Todo List API (Bun + Elysia)',
          version: '1.0',
          runtime: 'Bun',
        }),
        {
          detail: {
            tags: ['App'],
            summary: 'Get API information',
            responses: {
              200: {
                description: 'API information retrieved successfully',
              },
            },
          },
        },
      )

      // Public Health Routes (to be implemented in Phase 12)
      .group('/health', app =>
        app
          .get(
            '',
            () => ({
              status: 'ok',
              timestamp: new Date().toISOString(),
              uptime: process.uptime(),
              database: { status: 'connected' },
              cache: { status: 'connected', type: 'redis' },
              memory: process.memoryUsage(),
              version: process.version,
            }),
            {
              response: {
                200: HealthResponseSchema,
              },
              detail: {
                tags: ['Health'],
                summary: 'Health check',
                responses: {
                  200: {
                    description: 'Service is healthy',
                  },
                },
              },
            },
          )
          .get(
            '/ready',
            () => ({
              status: 'ready',
              timestamp: new Date().toISOString(),
              checks: { database: true, cache: true },
            }),
            {
              response: {
                200: ReadinessResponseSchema,
              },
              detail: {
                tags: ['Health'],
                summary: 'Readiness check',
                responses: {
                  200: {
                    description: 'Service is ready',
                  },
                },
              },
            },
          ),
      )

      // Authentication (Mixed public/private)
      .use(authController)

      // Users Module
      .use(userController)

      // Protected Routes (Required JWT)
      .group('', app =>
        app
          .onBeforeHandle(({ user }) => {
            if (!user) throw new UnauthorizedError('Authentication required');
          })
          .onTransform(({ body, query }: { body: any; query: any }) => {
            // Sanitize Todo bodies
            if (body) {
              if (body.title) body.title = sanitizer.stripHtml(sanitizer.trim(body.title));
              if (body.description) body.description = sanitizer.stripHtml(sanitizer.trim(body.description));
              if (body.tags && Array.isArray(body.tags)) {
                body.tags = body.tags.map((tag: any) => sanitizer.trim(tag)).filter(Boolean);
              }
              if (body.blockchainAddress) body.blockchainAddress = sanitizer.trim(body.blockchainAddress);
              if (body.transactionHash) body.transactionHash = sanitizer.trim(body.transactionHash);
            }
            // Sanitize query params
            if (query) {
              if (query.search) query.search = sanitizer.trim(query.search);
              if (query.tag) query.tag = sanitizer.trim(query.tag);
            }
          })
          .use(todoController),
      ),
  );
