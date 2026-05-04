import { Elysia } from 'elysia';

import { authService } from './auth.service';
import { UnauthorizedError } from '../../plugins/errors';
import { jwtPlugin } from '../../plugins/jwt';
import { RegisterBodySchema, LoginBodySchema, AuthResponseSchema } from '../../schemas/auth';
import { PublicUserSchema } from '../../schemas/user';
import { sanitizer } from '../../utils/sanitizer';

export const authController = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)
  .onTransform(({ body }: { body: any }) => {
    if (body?.email) body.email = sanitizer.lowercase(sanitizer.trim(body.email));
    if (body?.name) body.name = sanitizer.trim(body.name);
    if (body?.walletAddress) body.walletAddress = sanitizer.trim(body.walletAddress);
    if (body?.password) body.password = sanitizer.trim(body.password);
  })
  .post(
    '/register',
    async ({ body, jwt }) => {
      return authService.register(body, jwt);
    },
    {
      body: RegisterBodySchema,
      response: AuthResponseSchema,
      detail: {
        tags: ['Authentication'],
        summary: 'User registration',
      },
      isPublic: true,
    },
  )
  .post(
    '/login',
    async ({ body, jwt }) => {
      return authService.login(body, jwt);
    },
    {
      body: LoginBodySchema,
      response: AuthResponseSchema,
      detail: {
        tags: ['Authentication'],
        summary: 'User login',
      },
      isPublic: true,
    },
  )
  .group('', app =>
    app
      .onBeforeHandle(({ user }) => {
        if (!user) throw new UnauthorizedError('Authentication required');
      })
      .post(
        '/refresh',
        async ({ user, jwt }) => {
          return authService.refreshToken(user!.id, jwt);
        },
        {
          response: AuthResponseSchema,
          detail: {
            tags: ['Authentication'],
            summary: 'Refresh access token',
            security: [{ bearerAuth: [] }],
          },
        },
      )
      .get(
        '/profile',
        async ({ user }) => {
          const u = user!;
          return {
            id: u.id,
            email: u.email,
            name: u.name,
            walletAddress: u.walletAddress,
          };
        },
        {
          response: PublicUserSchema,
          detail: {
            tags: ['Authentication'],
            summary: 'Get current user profile',
            security: [{ bearerAuth: [] }],
          },
        },
      ),
  );
