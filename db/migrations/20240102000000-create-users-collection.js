/**
 * Migration: Create users collection with validation and indexes
 * This migration creates the users collection with proper schema validation
 * and performance indexes for authentication and user management.
 */

module.exports = {
  async up(db, _client) {
    console.log('Creating users collection with validation...');

    // Create the users collection with schema validation
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'name', 'password', 'createdAt'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              description: 'must be a valid email address',
            },
            name: {
              bsonType: 'string',
              minLength: 1,
              maxLength: 100,
              description: 'must be a string between 1 and 100 characters',
            },
            password: {
              bsonType: 'string',
              minLength: 6,
              description: 'must be a hashed password string',
            },
            role: {
              bsonType: 'string',
              enum: ['user', 'admin'],
              description: 'must be either user or admin',
            },
            isActive: {
              bsonType: 'bool',
              description: 'indicates if the user account is active',
            },
            walletAddress: {
              bsonType: 'string',
              description: 'blockchain wallet address',
            },
            lastLoginAt: {
              bsonType: 'date',
              description: 'timestamp of last login',
            },
            emailVerified: {
              bsonType: 'bool',
              description: 'indicates if email is verified',
            },
            emailVerificationToken: {
              bsonType: 'string',
              description: 'token for email verification',
            },
            passwordResetToken: {
              bsonType: 'string',
              description: 'token for password reset',
            },
            passwordResetExpires: {
              bsonType: 'date',
              description: 'expiration date for password reset token',
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

    console.log('Creating indexes for users collection...');

    // Create indexes for better performance and constraints
    await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
    await db.collection('users').createIndex({ walletAddress: 1 }, { unique: true, sparse: true, background: true });
    await db.collection('users').createIndex({ role: 1 }, { background: true });
    await db.collection('users').createIndex({ isActive: 1 }, { background: true });
    await db.collection('users').createIndex({ createdAt: 1 }, { background: true });
    await db.collection('users').createIndex({ lastLoginAt: 1 }, { sparse: true, background: true });
    await db.collection('users').createIndex({ emailVerificationToken: 1 }, { sparse: true, background: true });
    await db.collection('users').createIndex({ passwordResetToken: 1 }, { sparse: true, background: true });
    await db.collection('users').createIndex({ passwordResetExpires: 1 }, { sparse: true, background: true });

    // Compound indexes for common queries
    await db.collection('users').createIndex({ email: 1, isActive: 1 }, { background: true });
    await db.collection('users').createIndex({ role: 1, isActive: 1 }, { background: true });

    // Text search index for name and email
    await db.collection('users').createIndex(
      {
        name: 'text',
        email: 'text',
      },
      {
        weights: {
          name: 10,
          email: 5,
        },
        name: 'user_text_search',
        background: true,
      },
    );

    console.log('Users collection created successfully with validation and indexes');
  },

  async down(db, _client) {
    console.log('Dropping users collection...');

    // Drop the users collection
    await db.collection('users').drop();

    console.log('Users collection dropped successfully');
  },
};
