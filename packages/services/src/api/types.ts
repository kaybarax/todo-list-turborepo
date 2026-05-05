import { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { BlockchainNetwork } from '../blockchain/types';

/**
 * API response wrapper schema
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * API response type
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
};

/**
 * API error response schema
 */
export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional(),
  timestamp: z.string().optional(),
});

/**
 * API error response type
 */
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * API Todo schema for API responses
 */
export const apiTodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  userId: z.string(),
  blockchainNetwork: z.nativeEnum(BlockchainNetwork).optional(),
  transactionHash: z.string().optional(),
  blockchainAddress: z.string().optional(),
});

/**
 * API Todo type
 */
export type ApiTodo = z.infer<typeof apiTodoSchema>;

/**
 * Create API todo input schema
 */
export const createApiTodoSchema = apiTodoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

/**
 * Create API todo input type
 */
export type CreateApiTodoInput = z.infer<typeof createApiTodoSchema>;

/**
 * Update API todo input schema
 */
export const updateApiTodoSchema = createApiTodoSchema.partial();

/**
 * Update API todo input type
 */
export type UpdateApiTodoInput = z.infer<typeof updateApiTodoSchema>;

/**
 * User schema for API responses
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  preferredNetwork: z.nativeEnum(BlockchainNetwork).optional(),
  settings: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true),
    defaultPriority: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * User type
 */
export type User = z.infer<typeof userSchema>;

/**
 * Authentication response schema
 */
export const authResponseSchema = z.object({
  user: userSchema,
  access_token: z.string(),
  token: z.string().optional(), // for backward compatibility if needed
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
});

/**
 * Authentication response type
 */
export type AuthResponse = z.infer<typeof authResponseSchema>;

/**
 * Login input schema
 */
export const loginInputSchema = z
  .object({
    email: z.string().email().optional(),
    walletAddress: z.string().optional(),
    signature: z.string().optional(),
    message: z.string().optional(),
  })
  .refine(data => data.email ?? (data.walletAddress && data.signature && data.message), {
    message: 'Either email or wallet authentication is required',
  });

/**
 * Login input type
 */
export type LoginInput = z.infer<typeof loginInputSchema>;

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
}

/**
 * Request interceptor function type
 */

export type RequestInterceptor = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

/**
 * Response interceptor function type
 */

export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;

/**
 * Error interceptor function type
 */

export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

/**
 * Retry configuration
 */
export interface RetryConfig {
  attempts: number;
  delay: number;
  backoff?: 'linear' | 'exponential';

  retryCondition?: (error: unknown) => boolean;
}
