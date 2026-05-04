import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { User } from '../../../src/modules/user/user.model';
import { UserService } from '../../../src/modules/user/user.service';
import { ConflictError, NotFoundError } from '../../../src/plugins/errors';

describe('UserService', () => {
  let mongod: MongoMemoryServer;
  let userService: UserService;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    userService = new UserService();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = await userService.create(registerData);
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.password).not.toBe('password123');
    });

    it('should throw ConflictError if email already exists', async () => {
      const registerData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await userService.create(registerData);
      expect(userService.create(registerData)).rejects.toThrow(ConflictError);
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const created = await User.create({
        email: 'find@example.com',
        password: 'password123',
        name: 'Find User',
      });

      const found = await userService.findById(created.id);
      expect(found.email).toBe('find@example.com');
    });

    it('should throw NotFoundError if not found', async () => {
      const randomId = new mongoose.Types.ObjectId().toString();
      expect(userService.findById(randomId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found by email', async () => {
      await User.create({
        email: 'email@example.com',
        password: 'password123',
        name: 'Email User',
      });

      const found = await userService.findByEmail('email@example.com');
      expect(found).not.toBeNull();
      expect(found?.email).toBe('email@example.com');
    });

    it('should return null if not found', async () => {
      const found = await userService.findByEmail('none@example.com');
      expect(found).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update user fields', async () => {
      const created = await User.create({
        email: 'update@example.com',
        password: 'password123',
        name: 'Update User',
      });

      const updated = await userService.updateById(created.id, { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
    });

    it('should throw ConflictError on duplicate email update', async () => {
      await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
      });

      const created = await User.create({
        email: 'target@example.com',
        password: 'password123',
        name: 'Target User',
      });

      expect(userService.updateById(created.id, { email: 'other@example.com' })).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteById', () => {
    it('should delete user', async () => {
      const created = await User.create({
        email: 'delete@example.com',
        password: 'password123',
        name: 'Delete User',
      });

      await userService.deleteById(created.id);
      const found = await User.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw NotFoundError if user not found for deletion', async () => {
      const randomId = new mongoose.Types.ObjectId().toString();
      expect(userService.deleteById(randomId)).rejects.toThrow(NotFoundError);
    });
  });
});
