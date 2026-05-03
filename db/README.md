# Database Setup and Migrations

This directory contains a comprehensive database management system for the Todo App MongoDB database. The setup has been modernized to work seamlessly with the NestJS API structure and includes enterprise-grade features for development, staging, and production environments.

## 🎯 Key Accomplishments

### Advanced Database Management

- **Schema Validation**: Comprehensive MongoDB schema validation with proper constraints
- **Migration System**: Professional migration system with rollback capabilities
- **Automated Seeding**: Intelligent seeding with sample data and user accounts
- **Multi-Environment Support**: Separate configurations for development, staging, and production

### Blockchain Integration

- **Multi-Network Collections**: Support for Polygon, Solana, and Polkadot transactions
- **Transaction Tracking**: Comprehensive blockchain transaction monitoring
- **Wallet Management**: Multi-wallet support per user with network-specific addresses
- **Network Status**: Real-time blockchain network health monitoring

### Developer Experience

- **CLI Tools**: Comprehensive command-line tools for all database operations
- **Automated Setup**: One-command database setup with validation
- **Error Handling**: Robust error handling with helpful troubleshooting guides
- **Performance Optimization**: Optimized indexes and query patterns

## Directory Structure

```text
db/
├── migrations/                    # Database migration files
│   ├── 20240101000000-create-todos-collection.js
│   ├── 20240102000000-create-users-collection.js
│   └── 20240103000000-add-blockchain-features.js
├── init-mongo.js                 # MongoDB initialization script (Docker)
├── migrate-mongo-config.js       # Migration configuration
├── migrate.js                    # Migration runner script
├── seed-todos.js                 # Database seeding script
├── setup.js                      # Complete database setup script
├── .env.example                  # Environment variables example
└── README.md                     # This file
```

## Quick Start

### Prerequisites

1. **MongoDB**: Running MongoDB instance (local or containerized)
2. **Node.js**: Version 20 or higher
3. **Dependencies**: Install with `pnpm install`

### Environment Setup

1. **Copy environment file**:

   ```bash
   cp db/.env.example .env.development
   ```

2. **Update environment variables**:

   ```bash
   # Development (Docker)
   MONGODB_URI=mongodb://admin:password@localhost:27017/todo-app?authSource=admin
   MONGODB_DATABASE=todo-app

   # Production (update with actual values)
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/todo-app
   ```

### Complete Setup

Run the complete database setup (recommended for first-time setup):

```bash
# Complete setup with migrations and seeding
node db/setup.js

# Or using the npm script
pnpm db:setup
```

This will:

1. Test database connection
2. Run all migrations
3. Seed the database with sample data
4. Validate the setup

## Database Schema

### Collections

#### Users Collection

Stores user account information with authentication data.

```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String (hashed),
  role: String (enum: 'user', 'admin'),
  isActive: Boolean,
  walletAddress: String (optional, unique),
  lastLoginAt: Date,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  schemaVersion: Number
}
```

#### Todos Collection

Stores todo items with blockchain integration support.

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  completed: Boolean,
  priority: String (enum: 'low', 'medium', 'high'),
  dueDate: Date (optional),
  tags: [String],
  userId: ObjectId (ref: users),
  blockchainNetwork: String (enum: 'polygon', 'solana', 'polkadot'),
  transactionHash: String (optional),
  createdAt: Date,
  updatedAt: Date,
  schemaVersion: Number
}
```

#### Blockchain Transactions Collection

Tracks blockchain operations and their status.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  todoId: ObjectId (ref: todos),
  network: String (enum: 'polygon', 'solana', 'polkadot'),
  transactionHash: String (unique),
  blockNumber: Long,
  gasUsed: String,
  gasPrice: String,
  status: String (enum: 'pending', 'confirmed', 'failed'),
  operation: String (enum: 'create', 'update', 'delete'),
  contractAddress: String,
  errorMessage: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date,
  schemaVersion: Number
}
```

#### User Wallets Collection

Manages multiple wallet addresses per user.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  network: String (enum: 'polygon', 'solana', 'polkadot'),
  address: String,
  label: String,
  isDefault: Boolean,
  isActive: Boolean,
  balance: String,
  lastBalanceUpdate: Date,
  createdAt: Date,
  updatedAt: Date,
  schemaVersion: Number
}
```

#### Network Status Collection

Tracks blockchain network health and status.

```javascript
{
  _id: ObjectId,
  network: String (enum: 'polygon', 'solana', 'polkadot'),
  status: String (enum: 'online', 'offline', 'degraded'),
  blockHeight: Long,
  gasPrice: String,
  responseTime: Number,
  errorMessage: String,
  lastChecked: Date,
  schemaVersion: Number
}
```

## Migration Management

### Running Migrations

```bash
# Run all pending migrations
node db/migrate.js up

# Check migration status
node db/migrate.js status

# Rollback last migration
node db/migrate.js down

# Rollback multiple migrations
node db/migrate.js down 3

# Rollback all migrations
node db/migrate.js down all
```

### Creating New Migrations

```bash
# Create a new migration file
node db/migrate.js create add-user-preferences

# This creates: db/migrations/YYYYMMDDHHMMSS-add-user-preferences.js
```

### Migration File Structure

```javascript
module.exports = {
  async up(db, client) {
    // Migration logic (forward)
    await db.createCollection('new_collection');
    await db.collection('existing').createIndex({ field: 1 });
  },

  async down(db, client) {
    // Rollback logic (backward)
    await db.collection('new_collection').drop();
    await db.collection('existing').dropIndex('field_1');
  },
};
```

## Database Seeding

### Seeding Data

```bash
# Seed database with sample data
node db/seed-todos.js

# Clear all data
node db/seed-todos.js clear

# Or using the setup script
node db/setup.js seed
```

### Sample Data

The seeding script creates:

- **2 users**: Admin and regular user accounts
- **7 todos**: Various priority levels and completion states
- **Sample credentials**:
  - Admin: `admin@todo-app.com` / `admin123`
  - User: `user@todo-app.com` / `user123`

## Development Workflow

### Daily Development

1. **Start development environment**:

   ```bash
   # Start all services including MongoDB
   docker-compose -f docker-compose.dev.yml up -d

   # Verify database setup
   node db/setup.js validate
   ```

2. **Make schema changes**:

   ```bash
   # Create migration for schema changes
   node db/migrate.js create your-change-description

   # Edit the migration file
   # Run the migration
   node db/migrate.js up
   ```

3. **Reset development data**:

   ```bash
   # Clear and reseed database
   node db/setup.js reset
   ```

### Testing

```bash
# Setup test database
NODE_ENV=test node db/setup.js

# Run tests with clean database
pnpm test

# Clear test data
NODE_ENV=test node db/seed-todos.js clear
```

## Production Deployment

### Pre-deployment Checklist

1. **Environment Variables**:

   ```bash
   # Production MongoDB connection
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/todo-app
   MONGODB_DATABASE=todo-app
   NODE_ENV=production
   ```

2. **Security**:
   - Use strong database credentials
   - Enable MongoDB authentication
   - Configure network security (VPC, firewall)
   - Use TLS/SSL for connections

3. **Backup**:

   ```bash
   # Create backup before deployment
   mongodump --uri="$MONGODB_URI" --out=backup-$(date +%Y%m%d)
   ```

### Deployment Process

```bash
# 1. Test connection
node db/setup.js test

# 2. Run migrations (no seeding in production)
node db/setup.js migrate

# 3. Validate setup
node db/setup.js validate

# 4. Start application
pnpm start
```

## Monitoring and Maintenance

### Database Health Checks

```bash
# Check database status
node db/setup.js validate

# Monitor connection
node db/setup.js test

# Check migration status
node db/migrate.js status
```

### Performance Monitoring

The database includes indexes for:

- **User queries**: email, wallet address, role
- **Todo queries**: userId, completed, priority, due date
- **Blockchain queries**: transaction hash, network, status
- **Text search**: todos (title, description, tags)

### Backup and Recovery

```bash
# Create backup
mongodump --uri="$MONGODB_URI" --out=backup-$(date +%Y%m%d)

# Restore backup
mongorestore --uri="$MONGODB_URI" backup-20240101/

# Point-in-time recovery (if using MongoDB Atlas)
# Use Atlas UI or API for point-in-time recovery
```

## Troubleshooting

### Common Issues

1. **Connection Failed**:

   ```bash
   # Check if MongoDB is running
   docker-compose -f docker-compose.dev.yml ps mongodb

   # Check connection string
   echo $MONGODB_URI

   # Test connection manually
   mongosh "$MONGODB_URI"
   ```

2. **Migration Errors**:

   ```bash
   # Check migration status
   node db/migrate.js status

   # View migration logs
   node db/migrate.js up --verbose

   # Rollback problematic migration
   node db/migrate.js down
   ```

3. **Seeding Issues**:

   ```bash
   # Clear and reseed
   node db/seed-todos.js clear
   node db/seed-todos.js

   # Check data
   node db/setup.js validate
   ```

4. **Index Problems**:

   ```bash
   # Rebuild indexes
   mongosh "$MONGODB_URI" --eval "db.todos.reIndex()"

   # Check index usage
   mongosh "$MONGODB_URI" --eval "db.todos.getIndexes()"
   ```

### Performance Issues

1. **Slow Queries**:

   ```bash
   # Enable profiling
   mongosh "$MONGODB_URI" --eval "db.setProfilingLevel(2)"

   # Check slow queries
   mongosh "$MONGODB_URI" --eval "db.system.profile.find().sort({ts:-1}).limit(5)"
   ```

2. **Index Optimization**:

   ```bash
   # Analyze query patterns
   mongosh "$MONGODB_URI" --eval "db.todos.explain('executionStats').find({userId: ObjectId('...')})"
   ```

### Error Recovery

1. **Corrupted Migration State**:

   ```bash
   # Reset migration state (DANGEROUS - backup first!)
   mongosh "$MONGODB_URI" --eval "db.migrations_changelog.drop()"
   node db/migrate.js up
   ```

2. **Schema Validation Errors**:

   ```bash
   # Disable validation temporarily
   mongosh "$MONGODB_URI" --eval "db.runCommand({collMod: 'todos', validator: {}})"

   # Fix data, then re-enable validation
   node db/migrate.js up
   ```

## Scripts Reference

| Script          | Purpose                 | Usage                           |
| --------------- | ----------------------- | ------------------------------- |
| `setup.js`      | Complete database setup | `node db/setup.js [command]`    |
| `migrate.js`    | Migration management    | `node db/migrate.js [command]`  |
| `seed-todos.js` | Data seeding            | `node db/seed-todos.js [clear]` |
| `init-mongo.js` | Docker initialization   | Automatic (Docker)              |

## Environment Variables

| Variable               | Description                   | Default                                                              |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------- |
| `MONGODB_URI`          | MongoDB connection string     | `mongodb://admin:password@localhost:27017/todo-app?authSource=admin` |
| `MONGODB_DATABASE`     | Database name                 | `todo-app`                                                           |
| `NODE_ENV`             | Environment                   | `development`                                                        |
| `MIGRATION_COLLECTION` | Migration tracking collection | `migrations_changelog`                                               |

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in staging environment first
3. **Use transactions** for complex migrations
4. **Monitor performance** after schema changes
5. **Keep migrations small** and focused
6. **Document breaking changes** in migration comments
7. **Use semantic versioning** for schema versions
8. **Regular maintenance** of indexes and statistics

For more information, see the main project documentation or contact the development team.
