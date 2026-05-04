import { app } from './app';
import { cache } from './cache';
import { config } from './config/env';
import { connectToDatabase, disconnectFromDatabase } from './db/mongo';

// Initialize services
await connectToDatabase();
await cache.initialize();

const server = Bun.serve({
  port: config.PORT,
  fetch: app.handle,
});

console.info(`🦊 Bun API is running at ${server.url}`);

async function shutdown(signal: string) {
  console.info(`\n🛑 ${signal} received. Shutting down...`);
  try {
    server.stop();
    await Promise.all([disconnectFromDatabase(), cache.quit()]);
    console.info('👋 Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
