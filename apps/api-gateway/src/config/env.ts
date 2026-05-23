// ---------------------------------------------------------------------------
// Typed environment configuration for the API Gateway
// ---------------------------------------------------------------------------

export interface ServerConfig {
  port: number;
  publicApiPrefix: string;
  env: string;
}

export interface UpstreamsConfig {
  nestApiUrl: string;
  bunApiUrl: string;
}

export interface AuthConfig {
  jwtSecret: string;
}

export interface CorsConfig {
  origin: string;
}

export interface ProxyConfig {
  timeoutMs: number;
}

export interface RateLimitingConfig {
  enabled: boolean;
}

export interface AppConfig {
  server: ServerConfig;
  upstreams: UpstreamsConfig;
  auth: AuthConfig;
  cors: CorsConfig;
  proxy: ProxyConfig;
  rateLimiting: RateLimitingConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` + `Please set ${name} in your .env file or environment.`,
    );
  }
  return value.trim();
}

function toInt(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const trimmed = raw.trim();
  const n = Number(trimmed);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    throw new Error(`[env] Invalid value for ${name}: "${raw}" — expected a numeric value.`);
  }
  return n;
}

function toPort(raw: string | undefined, name: string, fallback: number): number {
  const n = toInt(raw, name, fallback);
  if (n < 0) {
    throw new Error(`[env] Invalid value for ${name}: "${raw}" — port must not be negative.`);
  }
  return n;
}

function toUrl(raw: string | undefined, name: string, fallback: string): string {
  const value = raw !== undefined && raw.trim().length > 0 ? raw.trim() : fallback;
  try {
    new URL(value);
  } catch {
    throw new Error(`[env] Invalid URL for ${name}: "${value}" — must be a valid URL.`);
  }
  return value;
}

function toBool(raw: string | undefined, name: string, fallback: boolean): boolean {
  if (raw === undefined || raw.trim().length === 0) return fallback;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === 'true' || trimmed === '1') return true;
  if (trimmed === 'false' || trimmed === '0') return false;
  throw new Error(`[env] Invalid value for ${name}: "${raw}" — expected a boolean (true/false/1/0, case-insensitive).`);
}

// ---------------------------------------------------------------------------
// Build config
// ---------------------------------------------------------------------------

const PORT = toPort(process.env.PORT, 'PORT', 3003);

export const config: AppConfig = {
  server: {
    port: PORT,
    publicApiPrefix: process.env.PUBLIC_API_PREFIX?.trim() || '/api/v1',
    env: process.env.NODE_ENV?.trim() || 'development',
  },
  upstreams: {
    nestApiUrl: toUrl(process.env.NEST_API_URL, 'NEST_API_URL', 'http://localhost:3001'),
    bunApiUrl: toUrl(process.env.BUN_API_URL, 'BUN_API_URL', 'http://localhost:3002'),
  },
  auth: {
    jwtSecret: requireEnv('JWT_SECRET'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:3000',
  },
  proxy: {
    timeoutMs: toInt(process.env.PROXY_TIMEOUT_MS, 'PROXY_TIMEOUT_MS', 10000),
  },
  rateLimiting: {
    enabled: toBool(process.env.RATE_LIMIT_ENABLED, 'RATE_LIMIT_ENABLED', true),
  },
};

// Backward-compatible re-export so src/index.ts keeps working unchanged.
export { PORT };
