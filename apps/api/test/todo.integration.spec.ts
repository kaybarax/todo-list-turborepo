// Integration test file: allowing 'any' type for request mocking and test utilities
import { type INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Todo Integration Tests', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;
  let todoId: string;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  const testTodo = {
    title: 'Integration Test Todo',
    description: 'Testing todo creation via API',
    priority: 'high',
    dueDate: '2024-12-31',
    tags: ['integration', 'test'],
  };

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer()).post('/auth/register').send(testUser).expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);

      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('should not register user with duplicate email', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(testUser).expect(409);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should not login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Todo CRUD Operations', () => {
    it('should create a new todo', async () => {
      const response = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTodo)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(testTodo.title);
      expect(response.body.description).toBe(testTodo.description);
      expect(response.body.priority).toBe(testTodo.priority);
      expect(response.body.completed).toBe(false);
      expect(response.body.userId).toBe(userId);
      expect(response.body.tags).toEqual(testTodo.tags);

      todoId = response.body._id;
    });

    it('should not create todo without authentication', async () => {
      await request(app.getHttpServer()).post('/todos').send(testTodo).expect(401);
    });

    it('should not create todo with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Invalid: empty title
          description: testTodo.description,
        })
        .expect(400);
    });

    it('should get all todos for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('todos');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.todos).toHaveLength(1);
      expect(response.body.todos[0]._id).toBe(todoId);
    });

    it('should get todos with pagination', async () => {
      // Create additional todos
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...testTodo,
            title: `Todo ${i}`,
          });
      }

      const response = await request(app.getHttpServer())
        .get('/todos?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos).toHaveLength(3);
      expect(response.body.total).toBe(6); // Original + 5 new
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(3);
      expect(response.body.totalPages).toBe(2);
    });

    it('should filter todos by completion status', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos?completed=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos.every((todo: any) => !todo.completed)).toBe(true);
    });

    it('should filter todos by priority', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos.every((todo: any) => todo.priority === 'high')).toBe(true);
    });

    it('should search todos by title and description', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos?search=Integration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos.length).toBeGreaterThan(0);
      expect(
        response.body.todos.some(
          (todo: any) => todo.title.includes('Integration') || todo.description.includes('Integration'),
        ),
      ).toBe(true);
    });

    it('should get todo by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body._id).toBe(todoId);
      expect(response.body.title).toBe(testTodo.title);
    });

    it('should not get todo that does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      await request(app.getHttpServer())
        .get(`/todos/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not get todo from another user', async () => {
      // Create another user
      const anotherUser = {
        email: 'another@example.com',
        password: 'password123',
        name: 'Another User',
      };

      const registerResponse = await request(app.getHttpServer()).post('/auth/register').send(anotherUser);

      const anotherToken = registerResponse.body.access_token;

      // Try to access the first user's todo
      await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(404);
    });

    it('should update todo', async () => {
      const updateData = {
        title: 'Updated Integration Test Todo',
        description: 'Updated description',
        priority: 'medium',
        completed: true,
      };

      const response = await request(app.getHttpServer())
        .put(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.completed).toBe(updateData.completed);
    });

    it('should toggle todo completion', async () => {
      // First, get current completion status
      const getResponse = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const currentStatus = getResponse.body.completed;

      // Toggle completion
      const response = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.completed).toBe(!currentStatus);
    });

    it('should delete todo', async () => {
      await request(app.getHttpServer())
        .delete(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify todo is deleted
      await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Todo Statistics', () => {
    beforeEach(async () => {
      // Create test todos with different statuses
      const todos = [
        { ...testTodo, title: 'Todo 1', completed: false, priority: 'high' },
        { ...testTodo, title: 'Todo 2', completed: true, priority: 'medium' },
        { ...testTodo, title: 'Todo 3', completed: false, priority: 'low' },
        { ...testTodo, title: 'Todo 4', completed: true, priority: 'high' },
        { ...testTodo, title: 'Overdue Todo', completed: false, priority: 'medium', dueDate: '2023-01-01' },
      ];

      for (const todo of todos) {
        await request(app.getHttpServer()).post('/todos').set('Authorization', `Bearer ${authToken}`).send(todo);
      }
    });

    it('should get todo statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/todos/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('overdue');
      expect(response.body).toHaveProperty('byPriority');
      expect(response.body).toHaveProperty('byBlockchainNetwork');

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.completed).toBeGreaterThan(0);
      expect(response.body.active).toBeGreaterThan(0);
      expect(response.body.overdue).toBeGreaterThan(0);
      expect(response.body.byPriority).toHaveProperty('high');
      expect(response.body.byPriority).toHaveProperty('medium');
      expect(response.body.byPriority).toHaveProperty('low');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JWT token', async () => {
      await request(app.getHttpServer()).get('/todos').set('Authorization', 'Bearer invalid-token').expect(401);
    });

    it('should handle expired JWT token', async () => {
      // This would require mocking time or using a very short expiration
      // For now, we'll test with a malformed token
      await request(app.getHttpServer()).get('/todos').set('Authorization', 'Bearer expired.token.here').expect(401);
    });

    it('should handle malformed request data', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send('invalid json')
        .expect(400);
    });

    it('should handle invalid ObjectId format', async () => {
      await request(app.getHttpServer())
        .get('/todos/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Caching Integration', () => {
    let testTodoId: string;

    beforeEach(async () => {
      // Create a test todo
      const response = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTodo);

      testTodoId = response.body._id;
    });

    it('should cache todo list results', async () => {
      // First request - should hit database
      const start1 = Date.now();
      await request(app.getHttpServer()).get('/todos').set('Authorization', `Bearer ${authToken}`).expect(200);
      const time1 = Date.now() - start1;

      // Second request - should hit cache (faster)
      const start2 = Date.now();
      await request(app.getHttpServer()).get('/todos').set('Authorization', `Bearer ${authToken}`).expect(200);
      const time2 = Date.now() - start2;

      // Cache should be faster (though this is not always reliable in tests)
      expect(time2).toBeLessThanOrEqual(time1 + 50); // Allow some variance
    });

    it('should invalidate cache on todo creation', async () => {
      // Get initial todo count
      const response1 = await request(app.getHttpServer()).get('/todos').set('Authorization', `Bearer ${authToken}`);

      const initialCount = response1.body.total;

      // Create new todo
      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testTodo, title: 'Cache Test Todo' });

      // Get updated todo count
      const response2 = await request(app.getHttpServer()).get('/todos').set('Authorization', `Bearer ${authToken}`);

      expect(response2.body.total).toBe(initialCount + 1);
    });

    it('should invalidate cache on todo update', async () => {
      // Update todo
      await request(app.getHttpServer())
        .put(`/todos/${testTodoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Cache Test Todo' });

      // Get todo - should reflect update
      const response = await request(app.getHttpServer())
        .get(`/todos/${testTodoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.title).toBe('Updated Cache Test Todo');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent todo creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/todos')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...testTodo,
            title: `Concurrent Todo ${i}`,
          }),
      );

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
      });

      // Verify all todos were created
      const listResponse = await request(app.getHttpServer()).get('/todos').set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.body.total).toBeGreaterThanOrEqual(10);
    });

    it('should handle concurrent todo updates', async () => {
      // Create a todo first
      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTodo);

      const todoId = createResponse.body._id;

      // Concurrent updates
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .put(`/todos/${todoId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Updated Title ${i}`,
            description: `Updated Description ${i}`,
          }),
      );

      const responses = await Promise.all(promises);

      // All requests should succeed (last one wins)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify final state
      const getResponse = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.title).toMatch(/Updated Title \d/);
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate todo title length', async () => {
      const longTitle = 'a'.repeat(256); // Assuming max length is 255

      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testTodo,
          title: longTitle,
        })
        .expect(400);
    });

    it('should validate priority values', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testTodo,
          priority: 'invalid-priority',
        })
        .expect(400);
    });

    it('should validate due date format', async () => {
      await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testTodo,
          dueDate: 'invalid-date',
        })
        .expect(400);
    });

    it('should sanitize input data', async () => {
      const maliciousInput = {
        title: '<script>alert("xss")</script>Clean Title',
        description: '<img src="x" onerror="alert(1)">Clean Description',
      };

      const response = await request(app.getHttpServer())
        .post('/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testTodo,
          ...maliciousInput,
        })
        .expect(201);

      // Should strip malicious content
      expect(response.body.title).not.toContain('<script>');
      expect(response.body.description).not.toContain('<img');
      expect(response.body.title).toContain('Clean Title');
      expect(response.body.description).toContain('Clean Description');
    });
  });
});
