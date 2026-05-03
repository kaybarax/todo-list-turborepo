import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { User } from '../src/modules/user/user.model';
import { Todo } from '../src/modules/todo/todo.model';

describe('Database Smoke Test', () => {
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

  it('should create and save a user with hashed password', async () => {
    const userData = {
      email: 'smoke@example.com',
      password: 'password123',
      name: 'Smoke Test User',
    };

    const user = new User(userData);
    await user.save();

    expect(user.id).toBeDefined();
    expect(user.email).toBe('smoke@example.com');
    expect(user.password).not.toBe('password123');

    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);

    // Verify serialization
    const json = user.toJSON();
    expect(json.id).toBe(user.id);
    expect(json._id).toBeUndefined();
    expect(json.password).toBeUndefined();
  });

  it('should create and save a todo', async () => {
    const todoData = {
      title: 'Smoke Test Todo',
      userId: 'user123',
      priority: 'high' as const,
    };

    const todo = new Todo(todoData);
    await todo.save();

    expect(todo.id).toBeDefined();
    expect(todo.title).toBe('Smoke Test Todo');
    expect(todo.priority).toBe('high');
    expect(todo.completed).toBe(false);

    // Verify serialization
    const json = todo.toJSON();
    expect(json.id).toBe(todo.id);
    expect(json._id).toBeUndefined();
  });
});
