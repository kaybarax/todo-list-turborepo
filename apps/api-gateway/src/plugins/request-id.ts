import { Elysia } from 'elysia';

export const requestId = new Elysia({ name: 'request-id' }).onRequest(ctx => {
  const { request, set } = ctx;
  const existingId = request.headers.get('x-request-id');
  const id = existingId && existingId.length > 0 ? existingId : crypto.randomUUID();
  set.headers['x-request-id'] = id;
});
