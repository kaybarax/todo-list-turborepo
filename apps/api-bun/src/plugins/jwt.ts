import { bearer } from '@elysiajs/bearer';
import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { config } from '../config/env';
import { UnauthorizedError } from './errors';

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

      return {
        user: {
          id: profile.sub as string,
          email: profile.email as string,
        },
      };
    })
    .macro(({ onBeforeHandle }) => ({
      isPublic(value: boolean) {
        if (value) return;

        onBeforeHandle(({ user }) => {
          if (!user) {
            throw new UnauthorizedError('Authentication required');
          }
        });
      },
    }));
