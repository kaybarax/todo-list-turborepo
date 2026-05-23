// ---------------------------------------------------------------------------
// Environment variable validation helpers (no process.env dependency)
// ---------------------------------------------------------------------------

export interface ServerConfig {
  port: number;
  publicPrefix: string;
}

export interface UpstreamsConfig {
  nestApiUrl: string;
  bunApiUrl: string;
}

export interface AuthConfig {
  jwtSecret: string;
  authValidateLocally: boolean;
  authForwardAuthorization: boolean;
}

export interface CorsConfig {
  corsOrigin: string;
}

export interface ProxyConfig {
  proxyTimeoutMs: number;
}

export interface RateLimitingConfig {
  rateLimitEnabled: boolean;
}

export interface Config {
  server: ServerConfig;
  upstreams: UpstreamsConfig;
  auth: AuthConfig;
  cors: CorsConfig;
  proxy: ProxyConfig;
  rateLimiting: RateLimitingConfig;
}

export function requireNonEmpty(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function parsePositiveInt(key: string, value: string | undefined, defaultVal: number): number {
  if (value === undefined || value === '') return defaultVal;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer, got: ${value}`);
  }
  return parsed;
}

export function parseURL(key: string, value: string | undefined, defaultVal: string): string {
  if (value === undefined || value === '') return defaultVal;
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Environment variable ${key} must be a valid URL, got: ${value}`);
  }
}

export function parseBoolean(key: string, value: string | undefined, defaultVal: boolean): boolean {
  if (value === undefined || value === '') return defaultVal;
  const lower = value.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  throw new Error(`Environment variable ${key} must be "true" or "false", got: ${value}`);
}
