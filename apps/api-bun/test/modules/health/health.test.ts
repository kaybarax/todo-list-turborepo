import { describe, expect, it, beforeAll, afterAll } from 'bun:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { app } from '../../../src/app';
import { cache } from '../../../src/cache';
import { type HealthResponse, type ReadinessResponse } from '../../../src/schemas/health';

describe('Health Module', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await cache.initialize();
  });

  afterAll(async () => {
    await cache.quit();
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 with health information', async () => {
      const response = await app.handle(new Request('http://localhost/api/v1/health'));

      expect(response.status).toBe(200);
      const data = (await response.json()) as HealthResponse;

      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeGreaterThan(0);
      expect(data.database.status).toBe('connected');
      expect(data.cache.status).toBe('connected');
      expect(data.memory).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.telemetry).toBeDefined();
    });
  });

  describe('GET /api/v1/health/ready', () => {
    it('should return 200 with readiness information', async () => {
      const response = await app.handle(new Request('http://localhost/api/v1/health/ready'));

      expect(response.status).toBe(200);
      const data = (await response.json()) as ReadinessResponse;

      expect(data.status).toBe('ready');
      expect(data.timestamp).toBeDefined();
      expect(data.checks.database).toBe(true);
      expect(data.checks.cache).toBe(true);
    });
  });
});
