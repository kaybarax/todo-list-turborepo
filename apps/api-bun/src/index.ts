import { app } from './app';
import { config } from './config/env';

const server = Bun.serve({
  port: config.PORT,
  fetch: app.handle,
});

console.info(`🦊 Bun API is running at ${server.url}`);
