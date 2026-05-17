import { describe, expect, it } from 'bun:test';
import { app } from '../app';

describe('api-gateway', () => {
  it('responds to health check', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { service: string; version: string; timestamp: string };
    expect(body.service).toBe('api-gateway');
    expect(body.version).toBe('0.0.1');
    expect(body.timestamp).toBeDefined();
  });
});
