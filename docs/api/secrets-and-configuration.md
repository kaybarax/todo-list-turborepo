# API Secrets and Configuration Management

## Overview

This document describes how the API manages runtime configuration and secrets through AWS Secrets Manager and Systems Manager Parameter Store (SSM). This ensures sensitive data is not hardcoded in the application or Docker images.

## Environment Variables

### Required Secrets (store in Secrets Manager)

These must be stored as JSON secrets in AWS Secrets Manager:

```json
{
  "MONGODB_URI": "mongodb+srv://user:password@cluster.mongodb.net/todo-app?retryWrites=true&w=majority",
  "REDIS_PASSWORD": "your-redis-password",
  "JWT_SECRET": "your-super-secret-jwt-key"
}
```

#### `MONGODB_URI`

- **Type**: Secret
- **Owner**: Database team
- **Runtime**: Yes (loaded at startup)
- **Default**: None (required)
- **Description**: MongoDB/DocumentDB connection string
- **Example**: `mongodb://localhost:27017/todo-app`

#### `REDIS_PASSWORD`

- **Type**: Secret
- **Owner**: DevOps/Infrastructure
- **Runtime**: Yes (loaded at startup)
- **Default**: Empty string (for development)
- **Description**: Redis authentication password
- **Format**: String

#### `JWT_SECRET`

- **Type**: Secret
- **Owner**: Security team
- **Runtime**: Yes (loaded at startup)
- **Default**: None (must be set for production)
- **Description**: Secret key for JWT token signing and verification
- **Minimum Length**: 32 characters recommended

### Optional Secrets (store in Secrets Manager)

```json
{
  "BLOCKCHAIN_RPC_URL": "https://polygon-rpc.com/",
  "BLOCKCHAIN_PRIVATE_KEY": "0x...",
  "MAILGUN_API_KEY": "your-api-key"
}
```

### Configuration (store in SSM Parameter Store)

These can be stored as plain text in SSM Parameter Store:

| Parameter                        | Type   | Environment | Value                                         |
| -------------------------------- | ------ | ----------- | --------------------------------------------- |
| `/todo-api/dev/CORS_ORIGIN`      | String | dev         | `http://localhost:3000,http://localhost:5173` |
| `/todo-api/staging/CORS_ORIGIN`  | String | staging     | `https://staging.todo.example.com`            |
| `/todo-api/prod/CORS_ORIGIN`     | String | production  | `https://todo.example.com`                    |
| `/todo-api/NODE_ENV`             | String | all         | `production` / `development`                  |
| `/todo-api/PORT`                 | String | all         | `3001`                                        |
| `/todo-api/TELEMETRY_ENABLED`    | String | all         | `true` / `false`                              |
| `/todo-api/OTLP_ENDPOINT`        | String | all         | `http://otel-collector:4318/v1/traces`        |
| `/todo-api/OTEL_SERVICE_NAME`    | String | all         | `todo-api`                                    |
| `/todo-api/OTEL_SERVICE_VERSION` | String | all         | `1.0.0`                                       |

## AWS Setup

### Step 1: Create Secrets Manager Secrets

```bash
# Create API secrets
aws secretsmanager create-secret \
  --name /todo-api/production/secrets \
  --description "API secrets for production environment" \
  --secret-string '{
    "MONGODB_URI": "mongodb+srv://...",
    "REDIS_PASSWORD": "...",
    "JWT_SECRET": "..."
  }' \
  --region eu-central-1 \
  --tags Key=app,Value=todo-list Key=service,Value=api Key=environment,Value=production Key=managed_by,Value=terraform
```

### Step 2: Add to SSM Parameter Store

```bash
# Add CORS origin for production
aws ssm put-parameter \
  --name /todo-api/prod/CORS_ORIGIN \
  --value "https://todo.example.com" \
  --type String \
  --tags Key=app,Value=todo-list Key=service,Value=api Key=environment,Value=production \
  --region eu-central-1

# Add CORS origin for staging
aws ssm put-parameter \
  --name /todo-api/staging/CORS_ORIGIN \
  --value "https://staging.todo.example.com" \
  --type String \
  --tags Key=app,Value=todo-list Key=service,Value=api Key=environment,Value=staging \
  --region eu-central-1
```

### Step 3: Configure ECS Task IAM Permissions

The API ECS task execution role needs permissions to read these secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:/todo-api/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
      "Resource": "arn:aws:ssm:eu-central-1:ACCOUNT_ID:parameter/todo-api/*"
    },
    {
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:eu-central-1:ACCOUNT_ID:key/KEY_ID"
    }
  ]
}
```

## ECS Task Definition Configuration

The ECS task definition loads secrets from Secrets Manager and parameters from SSM Parameter Store:

```json
{
  "name": "todo-api",
  "image": "ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/todo-api:latest",
  "environment": [
    {
      "name": "NODE_ENV",
      "value": "production"
    },
    {
      "name": "PORT",
      "value": "3001"
    },
    {
      "name": "TELEMETRY_ENABLED",
      "value": "true"
    },
    {
      "name": "OTLP_ENDPOINT",
      "value": "http://otel-collector:4318/v1/traces"
    }
  ],
  "secrets": [
    {
      "name": "MONGODB_URI",
      "valueFrom": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:/todo-api/production/secrets:MONGODB_URI::"
    },
    {
      "name": "REDIS_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:/todo-api/production/secrets:REDIS_PASSWORD::"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:/todo-api/production/secrets:JWT_SECRET::"
    },
    {
      "name": "CORS_ORIGIN",
      "valueFrom": "arn:aws:ssm:eu-central-1:ACCOUNT_ID:parameter/todo-api/prod/CORS_ORIGIN"
    }
  ]
}
```

## GitHub Actions Integration

### Storing Deployment Role ARN

Store the deployment role ARN in GitHub environment variables:

```bash
# For production environment
gh secret set AWS_DEPLOY_ROLE_ARN_PROD \
  --body "arn:aws:iam::ACCOUNT_ID:role/GitHubActionsAPIDeployRole" \
  --env production
```

### Accessing Secrets in Workflows

The deployment workflow uses OIDC to assume the AWS role:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
    aws-region: ${{ env.AWS_REGION }}
```

## Application Startup Validation

The API validates required environment variables at startup:

```typescript
// src/config/validation.ts
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  MONGODB_URI!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  CORS_ORIGIN?: string;
}

export function validateEnvironment() {
  const config = plainToInstance(EnvironmentVariables, process.env, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(config, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return config;
}
```

## Rotating Secrets

### Rotating MongoDB URI

```bash
# 1. Create the new secret version in Secrets Manager
aws secretsmanager update-secret \
  --secret-id /todo-api/production/secrets \
  --secret-string '{
    "MONGODB_URI": "mongodb+srv://NEW_USER:NEW_PASSWORD@cluster.mongodb.net/todo-app",
    "REDIS_PASSWORD": "existing_password",
    "JWT_SECRET": "existing_secret"
  }' \
  --region eu-central-1

# 2. Restart the ECS service to pick up the new secret
aws ecs update-service \
  --cluster todo-api-prod \
  --service todo-api \
  --force-new-deployment \
  --region eu-central-1

# 3. Monitor the deployment
aws ecs describe-services \
  --cluster todo-api-prod \
  --services todo-api \
  --region eu-central-1 \
  --query 'services[0].{status:status, runningCount:runningCount, desiredCount:desiredCount}'
```

### Rotating JWT Secret

**⚠️ Warning**: Rotating JWT_SECRET will invalidate all existing JWT tokens. Plan this carefully.

```bash
# 1. Update the secret
aws secretsmanager update-secret \
  --secret-id /todo-api/production/secrets \
  --secret-string '{
    "MONGODB_URI": "existing_uri",
    "REDIS_PASSWORD": "existing_password",
    "JWT_SECRET": "NEW_SECRET_KEY"
  }'

# 2. Force redeploy
aws ecs update-service \
  --cluster todo-api-prod \
  --service todo-api \
  --force-new-deployment

# 3. Communicate to users that they need to log in again
```

## Environment-Specific Overrides

### Development

No Secrets Manager needed. Use `.env` file (never commit):

```bash
MONGODB_URI=mongodb://localhost:27017/todo-app
REDIS_PASSWORD=
JWT_SECRET=dev-secret-do-not-use-in-production
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
NODE_ENV=development
```

### Staging

Use Secrets Manager and SSM Parameter Store with staging-specific values.

### Production

Always use Secrets Manager and SSM Parameter Store. Never use `.env` files.

## Monitoring

### CloudWatch Alarms

Set up alarms to detect secret access anomalies:

```bash
# Alert if secrets are rotated too frequently
aws cloudwatch put-metric-alarm \
  --alarm-name api-secret-rotation-frequency \
  --alarm-description "Alert if API secrets are rotated too frequently" \
  --metric-name RotationFrequency \
  --namespace AWS/SecretsManager \
  --statistic Average \
  --period 86400 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

### Audit Logging

Enable CloudTrail to audit secret access:

```bash
aws cloudtrail put-insight-selectors \
  --trail-name todo-api-trail \
  --insight-selectors AttributeKey=API,Name=PutSecret
```

## References

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [ECS Secrets Configuration](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#secrets)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
