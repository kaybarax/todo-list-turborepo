import { describe, it, expect, beforeAll, afterAll, beforeEach, mock } from 'bun:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { AuthService, type JwtSigner } from '../../../src/modules/auth/auth.service';
import { User } from '../../../src/modules/user/user.model';
import { UserService } from '../../../src/modules/user/user.service';
import { UnauthorizedError, ConflictError } from '../../../src/plugins/errors';

describe('AuthService', () => {
  let mongod: MongoMemoryServer;
  let userService: UserService;
  let authService: AuthService;

  const mockJwt: JwtSigner = {
    sign: mock(async () => 'mock-token'),
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    userService = new UserService();
    authService = new AuthService(userService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    // @ts-ignore
    mockJwt.sign.mockClear();
  });

  describe('register', () => {
    it('should register a new user and return token response', async () => {
      const registerData = {
        email: 'register@example.com',
        password: 'password123',
        name: 'Register User',
      };

      const result = await authService.register(registerData, mockJwt);

      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('register@example.com');
      expect(result.user.name).toBe('Register User');
      expect(mockJwt.sign).toHaveBeenCalled();

      // Verify user was created in DB
      const user = await User.findOne({ email: 'register@example.com' });
      expect(user).not.toBeNull();
      expect(await Bun.password.verify('password123', user!.password)).toBe(true);
    });

    it('should throw ConflictError if user already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      await authService.register(registerData, mockJwt);
      expect(authService.register(registerData, mockJwt)).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const password = 'password123';
      const hashed = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 4 }); // use low cost for tests

      await User.create({
        email: 'login@example.com',
        password: hashed,
        name: 'Login User',
      });

      const result = await authService.login(
        {
          email: 'login@example.com',
          password: 'password123',
        },
        mockJwt,
      );

      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('login@example.com');
    });

    it('should throw UnauthorizedError with incorrect password', async () => {
      const password = 'password123';
      const hashed = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 4 });

      await User.create({
        email: 'wrongpass@example.com',
        password: hashed,
        name: 'Wrong Pass User',
      });

      expect(
        authService.login(
          {
            email: 'wrongpass@example.com',
            password: 'wrongpassword',
          },
          mockJwt,
        ),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if user not found', async () => {
      expect(
        authService.login(
          {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
          mockJwt,
        ),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken', () => {
    it('should return new token response for valid user ID', async () => {
      const user = await User.create({
        email: 'refresh@example.com',
        password: 'hashedpassword',
        name: 'Refresh User',
      });

      const result = await authService.refreshToken(user.id, mockJwt);

      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('refresh@example.com');
    });

    it('should throw UnauthorizedError if user ID is invalid', async () => {
      const randomId = new mongoose.Types.ObjectId().toString();
      expect(authService.refreshToken(randomId, mockJwt)).rejects.toThrow(UnauthorizedError);
    });
  });
});
