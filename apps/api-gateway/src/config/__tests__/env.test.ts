import { describe, expect, it, beforeEach } from 'bun:test';

const ORIGINAL_ENV = { ...process.env };

let counter = 0;

/** Dynamic import with cache busting so each call gets a fresh module evaluation. */
async function importEnv() {
  counter += 1;
  // The query parameter forces Bun to resolve a new module instance.
  return import(`../env?cb=${counter}`);
}

describe('env configuration', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  // ── Defaults ──────────────────────────────────────────────────────────

  it('provides default values when no overrides set', async () => {
    delete process.env.NODE_ENV;
    delete process.env.PUBLIC_API_PREFIX;
    delete process.env.NEST_API_URL;
    delete process.env.BUN_API_URL;
    delete process.env.CORS_ORIGIN;
    delete process.env.PROXY_TIMEOUT_MS;
    delete process.env.RATE_LIMIT_ENABLED;
    process.env.JWT_SECRET = 'test-secret';

    const { config: cfg } = await importEnv();

    // server
    expect(cfg.server.port).toBe(3003);
    expect(cfg.server.publicApiPrefix).toBe('/api/v1');
    expect(cfg.server.env).toBe('development');

    // upstreams
    expect(cfg.upstreams.nestApiUrl).toBe('http://localhost:3001');
    expect(cfg.upstreams.bunApiUrl).toBe('http://localhost:3002');

    // auth
    expect(cfg.auth.jwtSecret).toBe('test-secret');

    // cors
    expect(cfg.cors.origin).toBe('http://localhost:3000');

    // proxy
    expect(cfg.proxy.timeoutMs).toBe(10000);

    // rate limiting
    expect(cfg.rateLimiting.enabled).toBe(true);

    // backward-compatible PORT export
    const { PORT } = await importEnv();
    expect(PORT).toBe(3003);
  });

  // ── Custom values ─────────────────────────────────────────────────────

  it('reads custom values from environment variables', async () => {
    process.env.JWT_SECRET = 'my-secret-key';
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_API_PREFIX = '/api/v2';
    process.env.NEST_API_URL = 'http://nest.example.com';
    process.env.BUN_API_URL = 'http://bun.example.com';
    process.env.CORS_ORIGIN = 'http://app.example.com';
    process.env.PROXY_TIMEOUT_MS = '15000';
    process.env.RATE_LIMIT_ENABLED = 'false';

    const { config: cfg } = await importEnv();

    expect(cfg.server.port).toBe(4000);
    expect(cfg.server.env).toBe('production');
    expect(cfg.server.publicApiPrefix).toBe('/api/v2');
    expect(cfg.upstreams.nestApiUrl).toBe('http://nest.example.com');
    expect(cfg.upstreams.bunApiUrl).toBe('http://bun.example.com');
    expect(cfg.auth.jwtSecret).toBe('my-secret-key');
    expect(cfg.cors.origin).toBe('http://app.example.com');
    expect(cfg.proxy.timeoutMs).toBe(15000);
    expect(cfg.rateLimiting.enabled).toBe(false);
  });

  it('accepts 1/0 for RATE_LIMIT_ENABLED', async () => {
    process.env.JWT_SECRET = 's';
    process.env.RATE_LIMIT_ENABLED = '1';
    const m1 = await importEnv();
    expect(m1.config.rateLimiting.enabled).toBe(true);

    process.env.RATE_LIMIT_ENABLED = '0';
    const m2 = await importEnv();
    expect(m2.config.rateLimiting.enabled).toBe(false);
  });

  it('accepts case-insensitive boolean strings', async () => {
    process.env.JWT_SECRET = 's';
    process.env.RATE_LIMIT_ENABLED = 'TRUE';
    const m1 = await importEnv();
    expect(m1.config.rateLimiting.enabled).toBe(true);

    process.env.RATE_LIMIT_ENABLED = 'FALSE';
    const m2 = await importEnv();
    expect(m2.config.rateLimiting.enabled).toBe(false);
  });

  // ── Validation errors ─────────────────────────────────────────────────

  it('rejects missing/empty JWT_SECRET', async () => {
    delete process.env.JWT_SECRET;
    await expect(importEnv()).rejects.toThrow('Missing required environment variable');

    process.env.JWT_SECRET = '   ';
    await expect(importEnv()).rejects.toThrow('Missing required environment variable');
  });

  it('rejects non-numeric PORT', async () => {
    process.env.JWT_SECRET = 's';
    process.env.PORT = 'abc';
    await expect(importEnv()).rejects.toThrow('Invalid value for PORT');
  });

  it('rejects negative PORT', async () => {
    process.env.JWT_SECRET = 's';
    process.env.PORT = '-50';
    await expect(importEnv()).rejects.toThrow('port must not be negative');
  });

  it('rejects invalid URL for NEST_API_URL', async () => {
    process.env.JWT_SECRET = 's';
    process.env.NEST_API_URL = 'not-a-url';
    await expect(importEnv()).rejects.toThrow('Invalid URL for NEST_API_URL');
  });

  it('rejects invalid URL for BUN_API_URL', async () => {
    process.env.JWT_SECRET = 's';
    process.env.BUN_API_URL = 'not-a-url';
    await expect(importEnv()).rejects.toThrow('Invalid URL for BUN_API_URL');
  });

  it('rejects invalid boolean for RATE_LIMIT_ENABLED', async () => {
    process.env.JWT_SECRET = 's';
    process.env.RATE_LIMIT_ENABLED = 'maybe';
    await expect(importEnv()).rejects.toThrow('Invalid value for RATE_LIMIT_ENABLED');
  });

  it('rejects non-numeric PROXY_TIMEOUT_MS', async () => {
    process.env.JWT_SECRET = 's';
    process.env.PROXY_TIMEOUT_MS = 'not-a-number';
    await expect(importEnv()).rejects.toThrow('Invalid value for PROXY_TIMEOUT_MS');
  });
});
