import { InjectionToken } from '@nestjs/common';

export const CACHE_PORT: InjectionToken = 'CACHE_PORT';

export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;
  generateTodoKey(id: string): string;
  generateUserTodosKey(userId: string, page: number, filterString: string): string;
  generateUserStatsKey(userId: string): string;
  generateUserPattern(userId: string): string;
}
