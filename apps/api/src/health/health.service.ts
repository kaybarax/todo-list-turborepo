import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisClientType } from 'redis';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly connection: Connection,

    @Optional() @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType | undefined,
  ) {}

  async getHealth() {
    const dbStatus = this.connection.readyState === 1 ? 'connected' : 'disconnected';

    let redisStatus = 'disconnected';
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        redisStatus = 'connected';
      } catch {
        redisStatus = 'disconnected';
      }
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: this.connection.name,
      },
      cache: {
        status: redisStatus,
        type: 'redis',
      },
      memory: process.memoryUsage(),
      version: process.version,
    };
  }

  async getReadiness() {
    const isDbReady = this.connection.readyState === 1;

    let isRedisReady = false;
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        isRedisReady = true;
      } catch {
        isRedisReady = false;
      }
    }

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
