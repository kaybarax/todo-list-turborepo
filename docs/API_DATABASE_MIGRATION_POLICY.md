# API Database Migration Policy

## Overview

This document defines the policies and procedures for running database migrations for the Todo API. Database migrations are critical operations that must be:

- **Explicit**: Never run automatically or implicitly
- **Audited**: All migrations must be recorded with timestamp and executor
- **Safe**: Include rollback procedures and backups
- **Tested**: Tested in staging before production deployment

## Migration Framework

The API uses `migrate-mongo` for MongoDB schema migrations. See `/Users/kevin/workspace/todo-list-turborepo/db/` for migration scripts.

### Migration Files Structure

Migrations are timestamped files in `db/migrations/`:

```text
db/migrations/
├── 20240101000000-initial-schema.js
├── 20240115120000-add-user-preferences.js
└── 20240220080000-add-indices.js
```

Each migration file must implement:

```javascript
module.exports = {
  async up(db, client) {
    // Forward migration logic
  },

  async down(db, client) {
    // Rollback logic (exact reverse of up())
  },
};
```

## Migration Workflow

### Development

Migrations run locally with development database:

```bash
# Check current migration status
node db/migrate.js status

# List available migrations
node db/migrate.js list

# Run pending migrations
node db/migrate.js up

# Rollback last migration
node db/migrate.js down

# Rollback all migrations
node db/migrate.js down all

# Rollback last 3 migrations
node db/migrate.js down 3
```

### Staging Environment

Staging migrations are explicitly triggered by DevOps before production deployment:

1. **Backup**: Automated daily backup of staging database
2. **Execute**: Run migrations via ECS task
3. **Test**: Verify API health and functionality
4. **Prepare Rollback**: Document rollback procedure

```bash
# These commands are run via GitHub Actions workflow
node db/migrate.js up

# Test is performed by integration tests
pnpm test:integration
```

### Production Environment

Production migrations are the most critical:

1. **Approval**: Require explicit approval from database team lead
2. **Backup**: Create manual backup before migrations
3. **Maintenance Window**: Run during scheduled maintenance window
4. **Monitoring**: Continuous health check monitoring
5. **Verification**: Post-migration verification steps
6. **Communication**: Notify stakeholders before/after

## Implementation: ECS Task for Migrations

### Step 1: Create Migration Task Definition

```json
{
  "family": "todo-api-migration",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecs-task-execution-role",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecs-task-role",
  "containerDefinitions": [
    {
      "name": "todo-api-migration",
      "image": "ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/todo-api:v1.0.0",
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:todo-api-prod-secrets:MONGODB_URI::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/todo-api-migration",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "command": ["node", "db/migrate.js", "up"]
    }
  ]
}
```

### Step 2: Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/todo-api-migration \
  --region eu-central-1

aws logs put-retention-policy \
  --log-group-name /ecs/todo-api-migration \
  --retention-in-days 30 \
  --region eu-central-1
```

### Step 3: Create IAM Role for Migrations

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:todo-api-prod-secrets"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:eu-central-1:ACCOUNT_ID:log-group:/ecs/todo-api-migration:*"
    },
    {
      "Effect": "Allow",
      "Action": ["ec2:DescribeSecurityGroups", "ec2:DescribeNetworkInterfaces"],
      "Resource": "*"
    }
  ]
}
```

## Migration Execution

### Manual Execution (One-Off Task)

```bash
# List available migrations
aws ecs describe-task-definition \
  --task-definition todo-api-migration

# Run migration ECS task
aws ecs run-task \
  --cluster todo-api-prod \
  --task-definition todo-api-migration \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --tags-key app,value todo-list \
  --tags-key service,value api \
  --tags-key operation,value migration

# Monitor task execution
aws ecs describe-tasks \
  --cluster todo-api-prod \
  --tasks <task-arn> \
  --query 'tasks[0].{status: lastStatus, exitCode: containers[0].exitCode}'

# View logs
aws logs tail /ecs/todo-api-migration --follow
```

### Via GitHub Actions Workflow

See `.github/workflows/migrate-api-database.yml` for the automated migration workflow.

## Rollback Procedures

### Before Migration (Preventive)

1. **Backup creation**:

   ```bash
   # Create automated backup
   aws backup create-backup-plan \
     --backup-plan file://backup-plan.json

   # Manual backup
   mongodump --uri "$MONGODB_URI" --archive=backup-$(date +%s).archive
   ```

2. **Document rollback steps** in the migration PR

3. **Test rollback** in staging environment first

### After Migration Failure (Reactive)

1. **Stop application**:

   ```bash
   aws ecs update-service \
     --cluster todo-api-prod \
     --service todo-api \
     --desired-count 0
   ```

2. **Restore database**:

   ```bash
   # Option 1: Restore from AWS backup
   aws backup start-restore-job \
     --recovery-point-arn arn:aws:backup:...

   # Option 2: Restore from mongodump
   mongorestore --uri "$MONGODB_URI" --archive=backup.archive
   ```

3. **Verify data integrity**:

   ```bash
   # Check document counts
   db.todos.countDocuments()
   db.users.countDocuments()
   ```

4. **Restart application**:
   ```bash
   aws ecs update-service \
     --cluster todo-api-prod \
     --service todo-api \
     --desired-count 3 \
     --force-new-deployment
   ```

## Critical Rules

### ✅ DO:

- [ ] Write migration down() procedures first (test rollback)
- [ ] Create backups before production migrations
- [ ] Test migrations in staging environment
- [ ] Get explicit approval for production migrations
- [ ] Run migrations as separate ECS tasks, not during app startup
- [ ] Verify API health after migration
- [ ] Document migration in ticket/changelog

### ❌ DON'T:

- [ ] Run migrations automatically during app deployment
- [ ] Use auto-scaling during migrations
- [ ] Skip staging tests
- [ ] Run multiple migrations concurrently
- [ ] Code migrations that depend on app code
- [ ] Assume migrations will never fail
- [ ] Deploy without rollback plan

## Monitoring and Alerts

### CloudWatch Metrics

```bash
# Alert on migration task failure
aws cloudwatch put-metric-alarm \
  --alarm-name api-migration-failed \
  --alarm-description "Alert when DB migration task fails" \
  --metric-name TaskFailureCount \
  --namespace AWS/ECS \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1
```

### CloudWatch Logs

Track all migrations in application logs:

```typescript
// Example in API logger
logger.info('Migration executed', {
  migration_name: '20240220080000-add-indices',
  status: 'completed',
  duration_ms: 1234,
  executor: 'CI/CD',
  environment: 'production',
  timestamp: new Date().toISOString(),
});
```

## Scheduling and Maintenance Windows

### Maintenance Windows

Production migrations are scheduled during:

- **Frequency**: As needed, with minimum 48h notice
- **Duration**: Off-peak hours (typically 22:00-04:00 UTC)
- **Window**: 2-hour blocks with 30-minute buffer before/after
- **Communication**: Slack notification to #devops-alerts

### Migration Calendar

```text
Q1 2024:
- Week 6 (Feb 5-11): User preferences schema migration
- Week 10 (Mar 4-10): Add indices for performance
- Week 13 (Mar 25-31): Archive old todos

Q2 2024:
- Week 18 (Apr 29-May 5): Blockchain integration prep
- (additional as needed)
```

## Verification Checklist

After production migration, verify:

- [ ] Application logs show no errors
- [ ] Health check endpoint returns 200 OK
- [ ] At least one successful API request in logs
- [ ] Database document counts match pre-migration (or document expected changes)
- [ ] No spike in error rate (CloudWatch metrics)
- [ ] Slack notification (success status)
- [ ] Ticket updated with completion details

## References

- [migrate-mongo Documentation](https://github.com/seppevs/migrate-mongo)
- [MongoDB Backup and Restore](https://docs.mongodb.com/manual/core/backups/)
- [AWS Backup for MongoDB](https://docs.aws.amazon.com/backup/latest/userguide/)
- [AWS ECS Task Definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
