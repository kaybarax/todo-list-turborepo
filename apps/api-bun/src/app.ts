import { Elysia, t } from 'elysia';

import { corsPlugin } from './plugins/cors';
import { errors, UnauthorizedError } from './plugins/errors';
import { jwtPlugin } from './plugins/jwt';
import { openapi } from './plugins/openapi';
import { rateLimitPlugin } from './plugins/rate-limit';
import { security } from './plugins/security';
import { ErrorResponseSchema } from './schemas/common';
import { HealthResponseSchema, ReadinessResponseSchema } from './schemas/health';
import { UserProfileSchema } from './schemas/user';
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

      // Authentication (Mixed public/private, will be handled in Phase 10)
      .group('/auth', app =>
        app
          .onTransform(({ body }: { body: any }) => {
            if (body?.email) body.email = sanitizer.lowercase(sanitizer.trim(body.email));
            if (body?.name) body.name = sanitizer.trim(body.name);
            if (body?.walletAddress) body.walletAddress = sanitizer.trim(body.walletAddress);
            if (body?.password) body.password = sanitizer.trim(body.password);
          })
          // Placeholders for now
          .post('/register', () => ({ success: true }), { detail: { tags: ['Authentication'] } })
          .post('/login', () => ({ success: true }), { detail: { tags: ['Authentication'] } }),
      )

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
          // These will be filled in later phases
          .get(
            '/auth/profile',
            ({ user }) => {
              if (!user) return { user: null };
              return {
                user: {
                  id: user.id,
                  email: user.email,
                  name: 'Stub User',
                  isVerified: true,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              };
            },
            {
              response: {
                200: t.Object({
                  user: t.Nullable(UserProfileSchema),
                }),
                401: ErrorResponseSchema,
              },
              detail: {
                tags: ['Authentication'],
                summary: 'Get current user profile',
                security: [{ bearer: [] }],
                responses: {
                  200: {
                    description: 'Profile retrieved successfully',
                  },
                  401: {
                    description: 'Authentication required',
                  },
                },
              },
            },
          ),
      ),
  );
