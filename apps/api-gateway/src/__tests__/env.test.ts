import { describe, expect, it, beforeAll, afterAll } from 'bun:test';

// validators.ts has no process.env dependency — safe to import statically
import { parseBoolean, parsePositiveInt, parseURL, requireNonEmpty } from '../config/validators';

// ---------------------------------------------------------------------------
// Config helpers used across integration tests
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type ConfigModule = typeof import('../config/env');

const ORIGINAL_ENV = { ...process.env };

// ---------------------------------------------------------------------------
// Unit tests — validation helpers (no process.env dependency)
// ---------------------------------------------------------------------------

describe('requireNonEmpty', () => {
  it('returns the value when non-empty', () => {
    expect(requireNonEmpty('JWT_SECRET', 'secret')).toBe('secret');
  });

  it('throws a clear error for undefined', () => {
    expect(() => requireNonEmpty('JWT_SECRET', undefined)).toThrow('Missing required environment variable: JWT_SECRET');
  });

  it('throws a clear error for empty string', () => {
    expect(() => requireNonEmpty('JWT_SECRET', '')).toThrow('Missing required environment variable: JWT_SECRET');
  });

  it('throws a clear error for whitespace-only string', () => {
    expect(() => requireNonEmpty('JWT_SECRET', '   ')).toThrow('Missing required environment variable: JWT_SECRET');
  });
});

describe('parsePositiveInt', () => {
  it('returns default when value is undefined', () => {
    expect(parsePositiveInt('PORT', undefined, 3003)).toBe(3003);
  });

  it('returns default when value is empty string', () => {
    expect(parsePositiveInt('PORT', '', 3003)).toBe(3003);
  });

  it('parses a valid number string', () => {
    expect(parsePositiveInt('PORT', '4000', 3003)).toBe(4000);
  });

  it('throws a clear error for non-numeric value', () => {
    expect(() => parsePositiveInt('PORT', 'abc', 3003)).toThrow(
      'Environment variable PORT must be a positive integer, got: abc',
    );
  });

  it('throws a clear error for zero', () => {
    expect(() => parsePositiveInt('PORT', '0', 3003)).toThrow(
      'Environment variable PORT must be a positive integer, got: 0',
    );
  });

  it('throws a clear error for negative number', () => {
    expect(() => parsePositiveInt('PORT', '-1', 3003)).toThrow(
      'Environment variable PORT must be a positive integer, got: -1',
    );
  });

  it('throws a clear error for float', () => {
    expect(() => parsePositiveInt('PORT', '3.14', 3003)).toThrow(
      'Environment variable PORT must be a positive integer, got: 3.14',
    );
  });
});

describe('parseURL', () => {
  it('returns default when value is undefined', () => {
    expect(parseURL('NEST_API_URL', undefined, 'http://localhost:3001')).toBe('http://localhost:3001');
  });

  it('returns default when value is empty string', () => {
    expect(parseURL('NEST_API_URL', '', 'http://localhost:3001')).toBe('http://localhost:3001');
  });

  it('returns the URL string when valid', () => {
    expect(parseURL('NEST_API_URL', 'https://api.example.com', 'http://localhost:3001')).toBe(
      'https://api.example.com',
    );
  });

  it('throws a clear error for invalid URL', () => {
    expect(() => parseURL('NEST_API_URL', 'not-a-url', 'http://localhost:3001')).toThrow(
      'Environment variable NEST_API_URL must be a valid URL, got: not-a-url',
    );
  });
});

describe('parseBoolean', () => {
  it('returns default when value is undefined', () => {
    expect(parseBoolean('RATE_LIMIT_ENABLED', undefined, true)).toBe(true);
  });

  it('returns default when value is empty string', () => {
    expect(parseBoolean('RATE_LIMIT_ENABLED', '', true)).toBe(true);
  });

  it('parses "true"', () => {
    expect(parseBoolean('RATE_LIMIT_ENABLED', 'true', true)).toBe(true);
  });

  it('parses "false"', () => {
    expect(parseBoolean('RATE_LIMIT_ENABLED', 'false', true)).toBe(false);
  });

  it('parses "TRUE" case-insensitively', () => {
    expect(parseBoolean('AUTH_VALIDATE_LOCALLY', 'TRUE', true)).toBe(true);
  });

  it('parses "FALSE" case-insensitively', () => {
    expect(parseBoolean('AUTH_VALIDATE_LOCALLY', 'FALSE', true)).toBe(false);
  });

  it('throws a clear error for invalid boolean value', () => {
    expect(() => parseBoolean('RATE_LIMIT_ENABLED', 'yes', true)).toThrow(
      'Environment variable RATE_LIMIT_ENABLED must be "true" or "false", got: yes',
    );
  });

  it('throws a clear error for numeric string', () => {
    expect(() => parseBoolean('RATE_LIMIT_ENABLED', '1', true)).toThrow(
      'Environment variable RATE_LIMIT_ENABLED must be "true" or "false", got: 1',
    );
  });
});

// ---------------------------------------------------------------------------
// Integration tests — the real config object (built from process.env)
// ---------------------------------------------------------------------------

describe('env config integration', () => {
  let mod: ConfigModule;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-value';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    mod = await import('../config/env');
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('uses default PORT when not set', () => {
    expect(mod.config.server.port).toBe(3003);
  });

  it('uses default publicPrefix when not set', () => {
    expect(mod.config.server.publicPrefix).toBe('/api/v1');
  });

  it('uses default upstream URLs when not set', () => {
    expect(mod.config.upstreams.nestApiUrl).toBe('http://localhost:3001');
    expect(mod.config.upstreams.bunApiUrl).toBe('http://localhost:3002');
  });

  it('reads JWT_SECRET from environment', () => {
    expect(mod.config.auth.jwtSecret).toBe('test-secret-value');
  });

  it('uses default auth booleans when not set', () => {
    expect(mod.config.auth.authValidateLocally).toBe(true);
    expect(mod.config.auth.authForwardAuthorization).toBe(true);
  });

  it('reads CORS_ORIGIN from environment', () => {
    expect(mod.config.cors.corsOrigin).toBe('http://localhost:3000');
  });

  it('uses default proxyTimeoutMs when not set', () => {
    expect(mod.config.proxy.proxyTimeoutMs).toBe(10000);
  });

  it('uses default rateLimitEnabled when not set', () => {
    expect(mod.config.rateLimiting.rateLimitEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Exported shape — destructured named exports match the group configs
// ---------------------------------------------------------------------------

describe('config named exports', () => {
  let mod: ConfigModule;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-value';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    mod = await import('../config/env');
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('exports server group', () => {
    expect(mod.server).toBe(mod.config.server);
  });

  it('exports upstreams group', () => {
    expect(mod.upstreams).toBe(mod.config.upstreams);
  });

  it('exports auth group', () => {
    expect(mod.auth).toBe(mod.config.auth);
  });

  it('exports cors group', () => {
    expect(mod.cors).toBe(mod.config.cors);
  });

  it('exports proxy group', () => {
    expect(mod.proxy).toBe(mod.config.proxy);
  });

  it('exports rateLimiting group', () => {
    expect(mod.rateLimiting).toBe(mod.config.rateLimiting);
  });
});
