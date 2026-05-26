import { describe, expect, it } from 'bun:test';

import { app } from '../app';

describe('request-id plugin', () => {
  it('sets x-request-id on response when no header sent', async () => {
    const response = await app.handle(new Request('http://localhost/api/v1'));
    expect(response.status).toBe(200);
    const requestId = response.headers.get('x-request-id');
    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('preserves incoming x-request-id header', async () => {
    const incomingId = 'incoming-test-id-12345';
    const response = await app.handle(
      new Request('http://localhost/api/v1', {
        headers: { 'x-request-id': incomingId },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe(incomingId);
  });

  it('sets x-request-id on error responses', async () => {
    const response = await app.handle(new Request('http://localhost/not-found'));
    expect(response.status).toBe(404);
    const requestId = response.headers.get('x-request-id');
    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
