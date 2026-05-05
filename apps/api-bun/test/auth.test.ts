import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { app } from '../src/app';
import { User } from '../src/modules/user/user.model';

describe('Auth Integration', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.access_token).toBeDefined();
      expect(body.user.email).toBe('test@example.com');
      expect(body.user.name).toBe('Test User');
      expect(body.user.password).toBeUndefined();
    });

    it('should return 409 if email already exists', async () => {
      const registerData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // First registration
      await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
        }),
      );

      // Second registration
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
        }),
      );

      expect(response.status).toBe(409);
      const body = (await response.json()) as any;
      expect(body.message).toBe('User with this email already exists');
    });

    it('should return 400 for invalid input', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'not-an-email',
            password: 'short',
          }),
        }),
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'login@example.com',
            password: 'password123',
            name: 'Login User',
          }),
        }),
      );
    });

    it('should login successfully with correct credentials', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'login@example.com',
            password: 'password123',
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.access_token).toBeDefined();
      expect(body.user.email).toBe('login@example.com');
      expect(body.user.password).toBeUndefined();
    });

    it('should return 401 with incorrect password', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'login@example.com',
            password: 'wrongpassword',
          }),
        }),
      );

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.message).toBe('Invalid credentials');
    });

    it('should return 401 if user not found', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'password123',
          }),
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let token: string;

    beforeEach(async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'refresh@example.com',
            password: 'password123',
            name: 'Refresh User',
          }),
        }),
      );
      const body = (await response.json()) as any;
      token = body.access_token;
    });

    it('should refresh token successfully', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/refresh', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.access_token).toBeDefined();
      expect(body.user.email).toBe('refresh@example.com');
    });

    it('should return 401 if no token provided', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/refresh', {
          method: 'POST',
        }),
      );

      expect(response.status).toBe(401);
    });

    it('should return 401 for an invalid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/refresh', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'profile@example.com',
            password: 'password123',
            name: 'Profile User',
          }),
        }),
      );
      const body = (await response.json()) as any;
      token = body.access_token;
    });

    it('should return profile successfully', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.email).toBe('profile@example.com');
      expect(body.name).toBe('Profile User');
      expect(body.password).toBeUndefined();
    });

    it('should return 401 if no token provided', async () => {
      const response = await app.handle(new Request('http://localhost/api/v1/auth/profile'));
      expect(response.status).toBe(401);
    });

    it('should return 401 for an invalid token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/auth/profile', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
      );
      expect(response.status).toBe(401);
    });
  });
});
