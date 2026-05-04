import { t } from 'elysia';

import { PublicUserSchema } from './user';

/**
 * User registration request body
 */
export const RegisterBodySchema = t.Object(
  {
    email: t.String({
      format: 'email',
      maxLength: 255,
      description: 'User email address',
      examples: ['user@example.com'],
    }),
    password: t.String({
      minLength: 6,
      maxLength: 100,
      description: 'User password',
      examples: ['SecurePassword123!'],
    }),
    name: t.String({
      maxLength: 100,
      description: 'User display name',
      examples: ['John Doe'],
    }),
    walletAddress: t.Optional(
      t.String({
        maxLength: 100,
        description: 'User wallet address',
        examples: ['0x1234567890abcdef'],
      }),
    ),
    preferredNetwork: t.Optional(
      t.String({
        description: 'Preferred blockchain network',
        enum: ['solana', 'polkadot', 'polygon'],
      }),
    ),
  },
  {
    additionalProperties: false,
    description: 'User registration request body',
  },
);

/**
 * User login request body
 */
export const LoginBodySchema = t.Object(
  {
    email: t.String({
      format: 'email',
      maxLength: 255,
      description: 'User email address',
      examples: ['user@example.com'],
    }),
    password: t.String({
      maxLength: 100,
      description: 'User password',
      examples: ['SecurePassword123!'],
    }),
  },
  {
    additionalProperties: false,
    description: 'User login request body',
  },
);

/**
 * Authentication response containing JWT and user info
 */
export const AuthResponseSchema = t.Object(
  {
    access_token: t.String({
      description: 'JWT access token',
    }),
    user: PublicUserSchema,
  },
  {
    description: 'Authentication response',
  },
);

export type RegisterBody = typeof RegisterBodySchema.static;
export type LoginBody = typeof LoginBodySchema.static;
export type AuthResponse = typeof AuthResponseSchema.static;
