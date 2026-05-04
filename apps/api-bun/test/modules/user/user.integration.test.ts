import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { app } from '../../../src/app';
import { config } from '../../../src/config/env';
import { User } from '../../../src/modules/user/user.model';

describe('User Integration', () => {
  let mongod: MongoMemoryServer;

  // Helper to sign a token for testing
  const signToken = async (sub: string, email: string) => {
    const signer = new Elysia().use(
      jwt({
        name: 'jwt',
        secret: config.JWT_SECRET,
      }),
    );
    // @ts-ignore
    return await signer.decorator.jwt.sign({ sub, email });
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('GET /api/v1/users/profile', () => {
    it('should return 401 if no token provided', async () => {
      const response = await app.handle(new Request('http://localhost/api/v1/users/profile'));

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.message).toBe('Authentication required');
    });

    it('should return 200 and profile if valid token provided', async () => {
      const user = await User.create({
        email: 'profile@example.com',
        password: 'password123',
        name: 'Profile User',
      });

      const token = await signToken(user.id, user.email);

      const response = await app.handle(
        new Request('http://localhost/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.email).toBe('profile@example.com');
      expect(body.name).toBe('Profile User');
      expect(body.id).toBe(user.id);
    });

    it('should return 401 if user in token does not exist', async () => {
      const randomId = new mongoose.Types.ObjectId().toString();
      const token = await signToken(randomId, 'ghost@example.com');

      const response = await app.handle(
        new Request('http://localhost/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.message).toContain('Authentication required');
    });
  });
});
