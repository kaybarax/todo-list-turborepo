import { ApiClientFactory } from '@todo/services';

/**
 * Get the API base URL based on environment and feature flag
 */
export const getApiBaseUrl = (): string => {
  const mode = process.env.NEXT_PUBLIC_API_MODE;
  const standardUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const bunUrl = process.env.NEXT_PUBLIC_API_BUN_URL || 'http://localhost:3002';

  return mode === 'bun' ? bunUrl : standardUrl;
};

/**
 * Global API client factory instance
 */
export const apiFactory = new ApiClientFactory({
  baseUrl: getApiBaseUrl(),
  environment: (process.env.NODE_ENV as any) || 'development',
});

/**
 * Convenience export for the todo client
 */
export const todoClient = apiFactory.getTodoClient();

/**
 * Convenience export for the auth client
 */
export const authClient = apiFactory.getAuthClient();
