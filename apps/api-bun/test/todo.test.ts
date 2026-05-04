import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { app } from '../src/app';
import { cache } from '../src/cache';
import { Todo } from '../src/modules/todo/todo.model';
import { User } from '../src/modules/user/user.model';

describe('Todo Integration', () => {
  let mongod: MongoMemoryServer;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    await cache.initialize();
  });

  afterAll(async () => {
    await cache.quit();
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Todo.deleteMany({});

    // Register a user to get a token
    const registerResponse = await app.handle(
      new Request('http://localhost/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'todo@example.com',
          password: 'password123',
          name: 'Todo User',
        }),
      }),
    );
    const registerBody = (await registerResponse.json()) as any;
    authToken = registerBody.access_token;
    userId = registerBody.user.id;
  });

  describe('POST /api/v1/todos', () => {
    it('should create a new todo', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: 'Test Todo',
            description: 'Test Description',
            priority: 'high',
            tags: ['test', 'integration'],
          }),
        }),
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as any;
      expect(body.title).toBe('Test Todo');
      expect(body.description).toBe('Test Description');
      expect(body.priority).toBe('high');
      expect(body.tags).toContain('test');
      expect(body.userId).toBe(userId);
      expect(body.id).toBeDefined();
    });

    it('should return 400 for invalid input (missing title)', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            description: 'Missing title',
          }),
        }),
      );

      expect(response.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'No token' }),
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/todos', () => {
    beforeEach(async () => {
      // Create some todos
      await Todo.create([
        { title: 'Todo 1', userId, completed: false, priority: 'low' },
        { title: 'Todo 2', userId, completed: true, priority: 'medium' },
        { title: 'Todo 3', userId, completed: false, priority: 'high' },
      ]);
    });

    it('should return all todos for the user', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos', {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.todos).toHaveLength(3);
      expect(body.total).toBe(3);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(10);
    });

    it('should filter todos by completion status', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos?completed=true', {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.todos).toHaveLength(1);
      expect(body.todos[0].completed).toBe(true);
    });

    it('should filter todos by priority', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos?priority=high', {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.todos).toHaveLength(1);
      expect(body.todos[0].priority).toBe('high');
    });

    it('should search todos by title', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos?search=Todo 1', {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.todos).toHaveLength(1);
      expect(body.todos[0].title).toBe('Todo 1');
    });
  });

  describe('GET /api/v1/todos/stats', () => {
    beforeEach(async () => {
      await Todo.create([
        { title: 'Todo 1', userId, completed: true, priority: 'low' },
        { title: 'Todo 2', userId, completed: false, priority: 'medium' },
        { title: 'Todo 3', userId, completed: false, priority: 'medium' },
      ]);
    });

    it('should return correct statistics', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/v1/todos/stats', {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.total).toBe(3);
      expect(body.completed).toBe(1);
      expect(body.active).toBe(2);
      expect(body.byPriority.low).toBe(1);
      expect(body.byPriority.medium).toBe(2);
      expect(body.byPriority.high).toBe(0);
    });
  });

  describe('GET /api/v1/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await Todo.create({ title: 'Specific Todo', userId });
      todoId = todo._id.toString();
    });

    it('should return a todo by ID', async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.id).toBe(todoId);
      expect(body.title).toBe('Specific Todo');
    });

    it('should return 404 for non-existent todo', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${fakeId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await Todo.create({ title: 'Old Title', userId });
      todoId = todo._id.toString();
    });

    it('should update a todo', async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: 'New Title',
            completed: true,
          }),
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as any;
      expect(body.title).toBe('New Title');
      expect(body.completed).toBe(true);
    });
  });

  describe('PATCH /api/v1/todos/:id/toggle', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await Todo.create({ title: 'Toggle Todo', userId, completed: false });
      todoId = todo._id.toString();
    });

    it('should toggle completion status', async () => {
      // Toggle to true
      let response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}/toggle`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );
      expect(response.status).toBe(200);
      let body = (await response.json()) as any;
      expect(body.completed).toBe(true);

      // Toggle back to false
      response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}/toggle`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );
      expect(response.status).toBe(200);
      body = (await response.json()) as any;
      expect(body.completed).toBe(false);
    });
  });

  describe('DELETE /api/v1/todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const todo = await Todo.create({ title: 'Delete Me', userId });
      todoId = todo._id.toString();
    });

    it('should delete a todo', async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      expect(response.status).toBe(204);

      const check = await Todo.findById(todoId);
      expect(check).toBeNull();
    });
  });

  describe('Ownership Checks', () => {
    let otherToken: string;
    let todoId: string;

    beforeEach(async () => {
      // Create a todo owned by the first user
      const todo = await Todo.create({ title: 'Owner Todo', userId });
      todoId = todo._id.toString();

      // Register another user
      const registerResponse = await app.handle(
        new Request('http://localhost/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'other@example.com',
            password: 'password123',
            name: 'Other User',
          }),
        }),
      );
      const registerBody = (await registerResponse.json()) as any;
      otherToken = registerBody.access_token;
    });

    it('should not allow another user to get a todo', async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${otherToken}` },
        }),
      );

      expect(response.status).toBe(404); // Should be 404/403 per service logic
    });

    it('should not allow another user to update a todo', async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${otherToken}`,
          },
          body: JSON.stringify({ title: 'Hacked' }),
        }),
      );

      expect(response.status).toBe(404);
    });

    it('should not allow another user to delete a todo', async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/v1/todos/${todoId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${otherToken}` },
        }),
      );

      expect(response.status).toBe(404);
    });
  });
});
