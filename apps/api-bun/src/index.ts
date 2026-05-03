import { app } from './app';

const port = process.env.PORT || 3002;

// @ts-ignore - Temporary mock until Elysia is added
const server = Bun.serve({
  port,
  fetch: app.handle,
});

console.log(`🦊 Bun API is running at ${server.url}`);
