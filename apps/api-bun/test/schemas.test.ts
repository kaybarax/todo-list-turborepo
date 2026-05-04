import { describe, expect, it } from 'bun:test';

import { Value } from '@sinclair/typebox/value';

import { RegisterBodySchema, LoginBodySchema } from '../src/schemas/auth';
import { HealthResponseSchema } from '../src/schemas/health';
import { CreateTodoBodySchema, TodoQuerySchema } from '../src/schemas/todo';

describe('Schemas Validation', () => {
  describe('Auth Schemas', () => {
    it('should validate valid register body', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      expect(Value.Check(RegisterBodySchema, data)).toBe(true);
    });

    it('should reject invalid register body (short password)', () => {
      const data = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };
      expect(Value.Check(RegisterBodySchema, data)).toBe(false);
    });

    it('should reject register body with unknown properties', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        unknown: 'property',
      };
      expect(Value.Check(RegisterBodySchema, data)).toBe(false);
    });

    it('should reject register body with overly long email', () => {
      const data = {
        email: 'a'.repeat(250) + '@example.com',
        password: 'password123',
        name: 'Test User',
      };
      expect(Value.Check(RegisterBodySchema, data)).toBe(false);
    });

    it('should validate valid login body', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      expect(Value.Check(LoginBodySchema, data)).toBe(true);
    });
  });

  describe('Todo Schemas', () => {
    it('should validate valid create todo body', () => {
      const data = {
        title: 'Test Todo',
        priority: 'medium',
        tags: ['test'],
      };
      expect(Value.Check(CreateTodoBodySchema, data)).toBe(true);
    });

    it('should reject create todo with unknown properties', () => {
      const data = {
        title: 'Test Todo',
        unknown: 'property',
      };
      expect(Value.Check(CreateTodoBodySchema, data)).toBe(false);
    });

    it('should reject create todo with overly long title', () => {
      const data = {
        title: 'a'.repeat(201),
      };
      expect(Value.Check(CreateTodoBodySchema, data)).toBe(false);
    });

    it('should reject create todo without title', () => {
      const data = {
        priority: 'medium',
      };
      expect(Value.Check(CreateTodoBodySchema, data)).toBe(false);
    });

    it('should validate valid todo query', () => {
      const data = {
        page: 1,
        limit: 10,
        completed: true,
        priority: 'high',
      };
      expect(Value.Check(TodoQuerySchema, data)).toBe(true);
    });

    it('should reject todo query with unknown properties', () => {
      const data = {
        page: 1,
        unknown: 'property',
      };
      expect(Value.Check(TodoQuerySchema, data)).toBe(false);
    });
  });

  describe('Health Schemas', () => {
    it('should validate valid health response', () => {
      const data = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 100,
        database: { status: 'connected', name: 'test' },
        cache: { status: 'connected', type: 'redis' },
        memory: { rss: 1, heapTotal: 2, heapUsed: 3, external: 4 },
        version: 'v1.0.0',
      };
      expect(Value.Check(HealthResponseSchema, data)).toBe(true);
    });
  });

  describe('Sanitization', () => {
    const { sanitizer } = require('../src/utils/sanitizer');

    it('should trim strings', () => {
      expect(sanitizer.trim('  hello  ')).toBe('hello');
    });

    it('should lowercase strings', () => {
      expect(sanitizer.lowercase('HELLO')).toBe('hello');
    });

    it('should strip HTML tags', () => {
      expect(sanitizer.stripHtml('<b>Hello</b> <script>alert(1)</script>')).toBe('Hello alert(1)');
    });

    it('should recursively trim objects', () => {
      const data = { name: '  John  ', tags: ['  tag1  ', '  tag2  '] };
      const expected = { name: 'John', tags: ['tag1', 'tag2'] };
      expect(sanitizer.trim(data)).toEqual(expected);
    });
  });
});
