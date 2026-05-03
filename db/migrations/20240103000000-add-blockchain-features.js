/**
 * Migration: Add blockchain-specific features and collections
 * This migration adds collections and indexes for blockchain integration
 * including transaction tracking and network-specific data.
 */

module.exports = {
  async up(db, _client) {
    console.log('Adding blockchain features...');

    // Create blockchain_transactions collection for tracking blockchain operations
    await db.createCollection('blockchain_transactions', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'network', 'transactionHash', 'status', 'createdAt'],
          properties: {
            userId: {
              bsonType: 'objectId',
              description: 'user who initiated the transaction',
            },
            todoId: {
              bsonType: 'objectId',
              description: 'associated todo item',
            },
            network: {
              bsonType: 'string',
              enum: ['polygon', 'solana', 'polkadot'],
              description: 'blockchain network',
            },
            transactionHash: {
              bsonType: 'string',
              description: 'blockchain transaction hash',
            },
            blockNumber: {
              bsonType: 'long',
              description: 'block number where transaction was included',
            },
            gasUsed: {
              bsonType: 'string',
              description: 'gas used for the transaction',
            },
            gasPrice: {
              bsonType: 'string',
              description: 'gas price for the transaction',
            },
            status: {
              bsonType: 'string',
              enum: ['pending', 'confirmed', 'failed'],
              description: 'transaction status',
            },
            operation: {
              bsonType: 'string',
              enum: ['create', 'update', 'delete'],
              description: 'type of operation performed',
            },
            contractAddress: {
              bsonType: 'string',
              description: 'smart contract address',
            },
            errorMessage: {
              bsonType: 'string',
              description: 'error message if transaction failed',
            },
            metadata: {
              bsonType: 'object',
              description: 'additional transaction metadata',
            },
            createdAt: {
              bsonType: 'date',
              description: 'transaction creation timestamp',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'transaction update timestamp',
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

    // Create indexes for blockchain_transactions
    await db.collection('blockchain_transactions').createIndex({ userId: 1 }, { background: true });
    await db.collection('blockchain_transactions').createIndex({ todoId: 1 }, { sparse: true, background: true });
    await db.collection('blockchain_transactions').createIndex({ network: 1 }, { background: true });
    await db
      .collection('blockchain_transactions')
      .createIndex({ transactionHash: 1 }, { unique: true, background: true });
    await db.collection('blockchain_transactions').createIndex({ status: 1 }, { background: true });
    await db.collection('blockchain_transactions').createIndex({ createdAt: 1 }, { background: true });
    await db.collection('blockchain_transactions').createIndex({ userId: 1, network: 1 }, { background: true });
    await db.collection('blockchain_transactions').createIndex({ userId: 1, status: 1 }, { background: true });
    await db.collection('blockchain_transactions').createIndex({ network: 1, status: 1 }, { background: true });

    // Create user_wallets collection for managing multiple wallet addresses per user
    await db.createCollection('user_wallets', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'network', 'address', 'createdAt'],
          properties: {
            userId: {
              bsonType: 'objectId',
              description: 'user who owns the wallet',
            },
            network: {
              bsonType: 'string',
              enum: ['polygon', 'solana', 'polkadot'],
              description: 'blockchain network',
            },
            address: {
              bsonType: 'string',
              description: 'wallet address',
            },
            label: {
              bsonType: 'string',
              maxLength: 50,
              description: 'user-defined label for the wallet',
            },
            isDefault: {
              bsonType: 'bool',
              description: 'whether this is the default wallet for the network',
            },
            isActive: {
              bsonType: 'bool',
              description: 'whether the wallet is active',
            },
            balance: {
              bsonType: 'string',
              description: 'cached wallet balance',
            },
            lastBalanceUpdate: {
              bsonType: 'date',
              description: 'timestamp of last balance update',
            },
            createdAt: {
              bsonType: 'date',
              description: 'wallet creation timestamp',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'wallet update timestamp',
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

    // Create indexes for user_wallets
    await db.collection('user_wallets').createIndex({ userId: 1 }, { background: true });
    await db.collection('user_wallets').createIndex({ network: 1 }, { background: true });
    await db.collection('user_wallets').createIndex({ address: 1 }, { background: true });
    await db.collection('user_wallets').createIndex({ userId: 1, network: 1 }, { background: true });
    await db.collection('user_wallets').createIndex({ userId: 1, isDefault: 1 }, { background: true });
    await db.collection('user_wallets').createIndex({ userId: 1, isActive: 1 }, { background: true });
    await db.collection('user_wallets').createIndex({ network: 1, address: 1 }, { unique: true, background: true });

    // Add blockchain-specific indexes to existing todos collection
    console.log('Adding blockchain indexes to todos collection...');

    // These indexes might already exist from the previous migration, so we'll handle errors gracefully
    try {
      await db
        .collection('todos')
        .createIndex({ blockchainNetwork: 1, transactionHash: 1 }, { sparse: true, background: true });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Create network_status collection for tracking blockchain network health
    await db.createCollection('network_status', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['network', 'status', 'lastChecked'],
          properties: {
            network: {
              bsonType: 'string',
              enum: ['polygon', 'solana', 'polkadot'],
              description: 'blockchain network',
            },
            status: {
              bsonType: 'string',
              enum: ['online', 'offline', 'degraded'],
              description: 'network status',
            },
            blockHeight: {
              bsonType: 'long',
              description: 'current block height',
            },
            gasPrice: {
              bsonType: 'string',
              description: 'current gas price',
            },
            responseTime: {
              bsonType: 'int',
              description: 'response time in milliseconds',
            },
            errorMessage: {
              bsonType: 'string',
              description: 'error message if network is down',
            },
            lastChecked: {
              bsonType: 'date',
              description: 'timestamp of last status check',
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

    // Create indexes for network_status
    await db.collection('network_status').createIndex({ network: 1 }, { unique: true, background: true });
    await db.collection('network_status').createIndex({ status: 1 }, { background: true });
    await db.collection('network_status').createIndex({ lastChecked: 1 }, { background: true });

    // Insert initial network status records
    const networks = ['polygon', 'solana', 'polkadot'];
    const networkStatusRecords = networks.map(network => ({
      network,
      status: 'offline',
      lastChecked: new Date(),
      schemaVersion: 1,
    }));

    await db.collection('network_status').insertMany(networkStatusRecords);

    console.log('Blockchain features added successfully');
  },

  async down(db, _client) {
    console.log('Removing blockchain features...');

    // Drop blockchain-specific collections
    await db.collection('blockchain_transactions').drop();
    await db.collection('user_wallets').drop();
    await db.collection('network_status').drop();

    // Remove blockchain-specific indexes from todos collection
    try {
      await db.collection('todos').dropIndex('blockchainNetwork_1_transactionHash_1');
    } catch (error) {
      // Index might not exist, ignore error
    }

    console.log('Blockchain features removed successfully');
  },
};
