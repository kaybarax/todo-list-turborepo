import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';

import { CachePort } from './cache.port';

@Injectable()
export class CacheService implements CachePort {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType | undefined) {}

  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) return null;
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.redisClient) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.setEx(key, ttlSeconds, serialized);
      } else {
        await this.redisClient.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.redisClient) return;
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      this.logger.error(`Cache delPattern error for pattern ${pattern}:`, error);
    }
  }

  generateTodoKey(id: string): string {
    return `todo:${id}`;
  }

  generateUserTodosKey(userId: string, page: number, filterString: string): string {
    return `user:${userId}:todos:${page}:${filterString}`;
  }

  generateUserStatsKey(userId: string): string {
    return `user:${userId}:stats`;
  }

  generateUserPattern(userId: string): string {
    return `user:${userId}:*`;
  }
}
