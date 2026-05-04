import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

import { app } from '../src/app';

describe('Service Smoke Test', () => {
  let server: ReturnType<typeof app.listen>;

  beforeAll(() => {
    // Start on a random port to avoid conflicts
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should start up and respond to health check via actual HTTP request', async () => {
    const port = server.server?.port;
    expect(port).toBeDefined();
    expect(port).toBeGreaterThan(0);

    const response = await fetch(`http://localhost:${port}/api/v1/health`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.uptime).toBeDefined();
  });
});
