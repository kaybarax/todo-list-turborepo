import { app } from './app';
import { config } from './config/env';
import { connectToDatabase, disconnectFromDatabase } from './db/mongo';

// Initialize database connection
await connectToDatabase();

const server = Bun.serve({
  port: config.PORT,
  fetch: app.handle,
});

console.info(`🦊 Bun API is running at ${server.url}`);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down...');
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down...');
  await disconnectFromDatabase();
  process.exit(0);
});
