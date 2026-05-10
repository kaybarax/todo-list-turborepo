type CacheEntry<T> = {
  value: T;
  expiresAt: number | null;
};

export class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  generateTodoKey(id: string): string {
    return `todo:${id}`;
  }

  generateUserStatsKey(userId: string): string {
    return `user:${userId}:stats`;
  }

  generateUserTodosKey(userId: string, page: number, filter: string): string {
    return `user:${userId}:todos:page:${page}:filter:${filter}`;
  }

  generateUserPattern(userId: string): string {
    return `user:${userId}:`;
  }
}
