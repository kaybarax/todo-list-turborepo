import dotenv from 'dotenv';

import { connectToDatabase } from './services/database';
import { startIngestion } from './services/ingestion';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

function validateEnv() {
  const required = ['MONGODB_URI', 'MONGODB_DB_NAME'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables:', { missing });
    process.exit(1);
  }
}

async function main() {
  validateEnv();
  try {
    logger.info('Starting data ingestion service...');

    // Connect to the database
    await connectToDatabase();

    // Start the ingestion process
    await startIngestion();

    logger.info('Data ingestion service started successfully');
  } catch (error) {
    logger.error('Failed to start data ingestion service', { error });
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Shutting down data ingestion service...');
  process.exit(0);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

// Start the application
void main();
