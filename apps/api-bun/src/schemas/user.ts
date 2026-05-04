import { t } from 'elysia';

/**
 * Publicly visible user information
 */
export const PublicUserSchema = t.Object(
  {
    id: t.String(),
    email: t.String(),
    name: t.String(),
    walletAddress: t.Optional(t.String()),
  },
  {
    description: 'Publicly visible user information',
  },
);

/**
 * Full user profile with settings
 */
export const UserProfileSchema = t.Object(
  {
    id: t.String(),
    email: t.String({ maxLength: 255 }),
    name: t.String({ maxLength: 100 }),
    walletAddress: t.Optional(t.String({ maxLength: 100 })),
    preferredNetwork: t.Optional(t.String()),
    settings: t.Optional(
      t.Object({
        theme: t.Optional(t.String()),
        notifications: t.Optional(t.Boolean()),
      }),
    ),
    isVerified: t.Boolean(),
    isActive: t.Boolean(),
    lastLoginAt: t.Optional(t.String({ format: 'date-time' })),
    createdAt: t.String({ format: 'date-time' }),
    updatedAt: t.String({ format: 'date-time' }),
  },
  {
    additionalProperties: false,
    description: 'Full user profile information',
  },
);

export type PublicUser = typeof PublicUserSchema.static;
export type UserProfile = typeof UserProfileSchema.static;
