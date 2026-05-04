import { Elysia } from 'elysia';
import { corsPlugin } from './plugins/cors';
import { errors, UnauthorizedError } from './plugins/errors';
import { jwtPlugin } from './plugins/jwt';
import { openapi } from './plugins/openapi';
import { rateLimitPlugin } from './plugins/rate-limit';
import { security } from './plugins/security';

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
          },
        },
      )

      // Public Health Routes (to be implemented in Phase 12)
      .group('/health', app =>
        app
          .get('', () => ({ status: 'ok' }), {
            detail: { tags: ['Health'], summary: 'Health check' },
          })
          .get('/ready', () => ({ status: 'ready' }), {
            detail: { tags: ['Health'], summary: 'Readiness check' },
          }),
      )

      // Authentication (Mixed public/private, will be handled in Phase 10)
      // For now just placeholders

      // Protected Routes (Required JWT)
      .group('', app =>
        app
          .onBeforeHandle(({ user }) => {
            if (!user) throw new UnauthorizedError('Authentication required');
          })
          // These will be filled in later phases
          .get('/auth/profile', ({ user }) => ({ user }), {
            detail: {
              tags: ['Authentication'],
              summary: 'Get current user profile',
              security: [{ bearer: [] }],
            },
          }),
      ),
  );
