import Redis, { type RedisOptions } from 'ioredis';

import { MemoryCache } from './memory-cache';

export class RedisCache extends MemoryCache {
  private readonly client: Redis;

  constructor(uri: string, options: RedisOptions = {}) {
    super();
    this.client = new Redis(uri, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      ...options,
    });
    this.client.on('error', () => {
      // ioredis emits connection failures even when callers handle fallbacks.
    });
  }

  async connect(): Promise<void> {
    if (this.client.status === 'ready') {
      return;
    }
    await this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      await this.connect();
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, 'EX', Math.ceil(ttlSeconds));
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
      // Cache writes should never fail the API request path.
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.connect();
      await this.client.del(key);
    } catch {
      // Cache deletes are best effort.
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      await this.connect();
      const keys = await this.client.keys(`${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // Cache deletes are best effort.
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.connect();
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  async quit(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
