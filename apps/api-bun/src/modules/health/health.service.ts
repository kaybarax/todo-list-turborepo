import mongoose from 'mongoose';

import { cache } from '../../cache';
import { type HealthResponse, type ReadinessResponse } from '../../schemas/health';

export class HealthService {
  async getHealth(): Promise<HealthResponse> {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = (await cache.ping()) ? 'connected' : 'disconnected';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name,
      },
      cache: {
        status: redisStatus,
        type: 'redis',
      },
      memory: process.memoryUsage(),
      version: process.version,
      telemetry: {
        enabled: true, // Placeholder Trace is always enabled
        serviceName: 'api-bun',
        endpoint: process.env.JAEGER_ENDPOINT ?? 'console',
      },
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const isDbReady = mongoose.connection.readyState === 1;
    const isRedisReady = await cache.ping();

    const isReady = isDbReady && isRedisReady;

    return {
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: isDbReady,
        cache: isRedisReady,
      },
    };
  }
}

export const healthService = new HealthService();
