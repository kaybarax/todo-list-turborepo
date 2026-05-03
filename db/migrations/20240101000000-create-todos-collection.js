/**
 * Migration: Create todos collection with validation and indexes
 * This migration creates the todos collection with proper schema validation
 * and performance indexes for the modernized NestJS API structure.
 */

module.exports = {
  async up(db, _client) {
    console.log('Creating todos collection with validation...');

    // Create the todos collection with schema validation
    await db.createCollection('todos', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'userId', 'completed', 'priority', 'createdAt'],
          properties: {
            title: {
              bsonType: 'string',
              minLength: 1,
              maxLength: 200,
              description: 'must be a string between 1 and 200 characters',
            },
            description: {
              bsonType: 'string',
              maxLength: 1000,
              description: 'must be a string with max 1000 characters',
            },
            completed: {
              bsonType: 'bool',
              description: 'must be a boolean',
            },
            priority: {
              bsonType: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'must be one of: low, medium, high',
            },
            dueDate: {
              bsonType: 'date',
              description: 'must be a date',
            },
            tags: {
              bsonType: 'array',
              items: {
                bsonType: 'string',
              },
              description: 'must be an array of strings',
            },
            userId: {
              bsonType: 'objectId',
              description: 'must be a valid ObjectId',
            },
            blockchainNetwork: {
              bsonType: 'string',
              enum: ['polygon', 'solana', 'polkadot'],
              description: 'must be one of: polygon, solana, polkadot',
            },
            transactionHash: {
              bsonType: 'string',
              description: 'blockchain transaction hash',
            },
            createdAt: {
              bsonType: 'date',
              description: 'must be a date',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'must be a date',
            },
            schemaVersion: {
              bsonType: 'int',
              minimum: 1,
              description: 'schema version for migrations',
            },
          },
        },
      },
    });

    console.log('Creating indexes for todos collection...');

    // Create indexes for better performance
    await db.collection('todos').createIndex({ userId: 1 }, { background: true });
    await db.collection('todos').createIndex({ completed: 1 }, { background: true });
    await db.collection('todos').createIndex({ createdAt: 1 }, { background: true });
    await db.collection('todos').createIndex({ dueDate: 1 }, { sparse: true, background: true });
    await db.collection('todos').createIndex({ tags: 1 }, { background: true });
    await db.collection('todos').createIndex({ priority: 1 }, { background: true });

    // Compound indexes for common queries
    await db.collection('todos').createIndex({ userId: 1, completed: 1 }, { background: true });
    await db.collection('todos').createIndex({ userId: 1, priority: 1 }, { background: true });
    await db.collection('todos').createIndex({ userId: 1, dueDate: 1 }, { background: true });
    await db.collection('todos').createIndex({ userId: 1, createdAt: -1 }, { background: true });

    // Blockchain-specific indexes
    await db.collection('todos').createIndex({ blockchainNetwork: 1 }, { sparse: true, background: true });
    await db.collection('todos').createIndex({ transactionHash: 1 }, { unique: true, sparse: true, background: true });

    // Text search index for title, description, and tags
    await db.collection('todos').createIndex(
      {
        title: 'text',
        description: 'text',
        tags: 'text',
      },
      {
        weights: {
          title: 10,
          description: 5,
          tags: 1,
        },
        name: 'todo_text_search',
        background: true,
      },
    );

    console.log('Todos collection created successfully with validation and indexes');
  },

  async down(db, _client) {
    console.log('Dropping todos collection...');

    // Drop the todos collection
    await db.collection('todos').drop();

    console.log('Todos collection dropped successfully');
  },
};
