import { Elysia } from 'elysia';

import { userService } from './user.service';
import { UnauthorizedError } from '../../plugins/errors';
import { jwtPlugin } from '../../plugins/jwt';
import { ErrorResponseSchema } from '../../schemas/common';
import { UserProfileSchema } from '../../schemas/user';

export const userController = new Elysia({ prefix: '/users' })
  .use(jwtPlugin)
  .onBeforeHandle(({ user }) => {
    if (!user) throw new UnauthorizedError('Authentication required');
  })
  .get(
    '/profile',
    async ({ user }) => {
      // In a real app, 'user' from context might only have basic info.
      // Parity with NestJS: UserController.getProfile calls userService.findById(user.id)
      const profile = await userService.findById(user!.id);

      return {
        id: (profile._id as any).toString(),
        email: profile.email,
        name: profile.name,
        walletAddress: profile.walletAddress,
        preferredNetwork: profile.preferredNetwork,
        settings: profile.settings,
        isVerified: profile.isVerified,
        isActive: profile.isActive,
        lastLoginAt: profile.lastLoginAt?.toISOString(),
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      };
    },
    {
      response: {
        200: UserProfileSchema,
        401: ErrorResponseSchema,
      },
      detail: {
        tags: ['Users'],
        summary: 'Get user profile',
        security: [{ bearer: [] }],
        responses: {
          200: {
            description: 'User profile retrieved successfully',
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
  );
