import { MemoryCache } from './memory-cache';
import { RedisCache } from './redis-cache';
import { config } from '../config/env';

export type CacheStore = MemoryCache | RedisCache;

class CacheManager extends MemoryCache {
  private backend: CacheStore = new MemoryCache();

  async initialize(): Promise<void> {
    if (!config.REDIS_URI) {
      this.backend = new MemoryCache();
      return;
    }

    const redis = new RedisCache(config.REDIS_URI);
    try {
      await redis.connect();
      this.backend = redis;
    } catch {
      await redis.quit();
      this.backend = new MemoryCache();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    return this.backend.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    return this.backend.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    return this.backend.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    return this.backend.delPattern(pattern);
  }

  async ping(): Promise<boolean> {
    return this.backend.ping();
  }

  async quit(): Promise<void> {
    await this.backend.quit();
    this.backend = new MemoryCache();
  }
}

export const cache = new CacheManager();
export { MemoryCache } from './memory-cache';
export { RedisCache } from './redis-cache';
