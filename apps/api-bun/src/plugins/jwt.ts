import { bearer } from '@elysiajs/bearer';
import { jwt } from '@elysiajs/jwt';
import { type Elysia } from 'elysia';

import { UnauthorizedError } from './errors';
import { config } from '../config/env';
import { userService } from '../modules/user/user.service';

export const jwtPlugin = (app: Elysia) =>
  app
    .use(
      jwt({
        name: 'jwt',
        secret: config.JWT_SECRET,
      }),
    )
    .use(bearer())
    .derive(async ({ jwt, bearer }) => {
      if (!bearer) {
        return {
          user: null,
        };
      }

      const profile = await jwt.verify(bearer);
      if (!profile) {
        return {
          user: null,
        };
      }

      // Fetch full user for parity with NestJS JwtStrategy
      const user = await userService.findById(profile.sub as string).catch(() => null);
      if (!user) {
        return {
          user: null,
        };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
          preferredNetwork: user.preferredNetwork,
        },
      };
    })
    .macro(({ onBeforeHandle }) => ({
      isPublic(value: boolean) {
        if (value) return;

        onBeforeHandle(({ user }: { user: any }) => {
          if (!user) {
            throw new UnauthorizedError('Authentication required');
          }
        });
      },
    }));
