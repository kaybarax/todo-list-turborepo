// ---------------------------------------------------------------------------
// Typed environment configuration for the API Gateway
// ---------------------------------------------------------------------------

import {
  type AuthConfig,
  type Config,
  type CorsConfig,
  type ProxyConfig,
  type RateLimitingConfig,
  type ServerConfig,
  type UpstreamsConfig,
  parseBoolean,
  parsePositiveInt,
  parseURL,
  requireNonEmpty,
} from './validators';

export type { AuthConfig, Config, CorsConfig, ProxyConfig, RateLimitingConfig, ServerConfig, UpstreamsConfig };
export { parseBoolean, parsePositiveInt, parseURL, requireNonEmpty };

// ---------------------------------------------------------------------------
// Config object
// ---------------------------------------------------------------------------

export const config: Config = {
  server: {
    port: parsePositiveInt('PORT', process.env.PORT, 3003),
    publicPrefix: process.env.PUBLIC_API_PREFIX || '/api/v1',
  },
  upstreams: {
    nestApiUrl: parseURL('NEST_API_URL', process.env.NEST_API_URL, 'http://localhost:3001'),
    bunApiUrl: parseURL('BUN_API_URL', process.env.BUN_API_URL, 'http://localhost:3002'),
  },
  auth: {
    jwtSecret: requireNonEmpty('JWT_SECRET', process.env.JWT_SECRET),
    authValidateLocally: parseBoolean('AUTH_VALIDATE_LOCALLY', process.env.AUTH_VALIDATE_LOCALLY, true),
    authForwardAuthorization: parseBoolean('AUTH_FORWARD_AUTHORIZATION', process.env.AUTH_FORWARD_AUTHORIZATION, true),
  },
  cors: {
    corsOrigin: requireNonEmpty('CORS_ORIGIN', process.env.CORS_ORIGIN),
  },
  proxy: {
    proxyTimeoutMs: parsePositiveInt('PROXY_TIMEOUT_MS', process.env.PROXY_TIMEOUT_MS, 10000),
  },
  rateLimiting: {
    rateLimitEnabled: parseBoolean('RATE_LIMIT_ENABLED', process.env.RATE_LIMIT_ENABLED, true),
  },
};

export const { server, upstreams, auth, cors, proxy, rateLimiting } = config;
