# API Deployment Implementation - Quick Reference

## 📋 Completed Tasks Overview

All 5 major tasks from "API Deployment Todo" are now complete:

| Task                            | Status | Key Files                                                                              |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| **Dockerfile Fix**              | ✅     | `apps/api/Dockerfile`                                                                  |
| **Image Build Workflow**        | ✅     | `.github/workflows/build-api-image.yml`                                                |
| **Deploy Workflow Enhancement** | ✅     | `.github/workflows/deploy-api-aws.yml`                                                 |
| **Secrets Management**          | ✅     | `docs/API_SECRETS_AND_CONFIGURATION.md`, `infra/terraform/modules/api-secrets/main.tf` |
| **Database Migrations**         | ✅     | `docs/API_DATABASE_MIGRATION_POLICY.md`, `.github/workflows/migrate-api-database.yml`  |

---

## 🚀 Quick Start: Using the New Infrastructure

### 1. Building the API Image Locally

```bash
# Build the Docker image
docker build -f apps/api/Dockerfile -t todo-api:latest .

# Test the health endpoint
curl http://localhost:3001/api/v1/health
```

### 2. Triggering the Image Build Via GitHub

```bash
# Build and push to ECR (automatic on commits to main)
git push origin main

# Or manually trigger via GitHub CLI
gh workflow run build-api-image.yml --ref main
```

### 3. Deploying the API to AWS

```bash
# Deploy to staging
gh workflow run deploy-api-aws.yml \
  -f environment=staging \
  -f skip_tests=false \
  -f dry_run=false

# Deploy to production
gh workflow run deploy-api-aws.yml \
  -f environment=production \
  -f skip_tests=false \
  -f dry_run=false
```

### 4. Running Database Migrations

```bash
# Dry run (staging)
gh workflow run migrate-api-database.yml \
  -f environment=staging \
  -f migration_direction=up \
  -f dry_run=true

# Execute (production)
gh workflow run migrate-api-database.yml \
  -f environment=production \
  -f migration_direction=up \
  -f skip_backup=false \
  -f dry_run=false

# Rollback
gh workflow run migrate-api-database.yml \
  -f environment=production \
  -f migration_direction=down \
  -f rollback_count=1 \
  -f dry_run=false
```

---

## 📄 Documentation Files

### Essential Reading (In Order):

1. **`docs/API_DEPLOYMENT_COMPLETION_SUMMARY.md`** (📍 START HERE)
   - Overview of all completed tasks
   - Summary of changes to each file
   - Next steps for integration

2. **`docs/API_SECRETS_AND_CONFIGURATION.md`**
   - How to store and manage secrets in AWS
   - Environment variable reference
   - ECS task definition examples
   - Secret rotation procedures

3. **`docs/API_DATABASE_MIGRATION_POLICY.md`**
   - Database migration policies
   - How to create and run migrations
   - Rollback procedures
   - Approval workflows

### Reference Guides:

- `apps/api/Dockerfile` - Production-ready Docker configuration
- `infra/terraform/modules/api-secrets/main.tf` - IaC for secrets management

---

## 🔧 Workflow Files

### `.github/workflows/build-api-image.yml`

**Purpose**: Build and push API Docker image to Amazon ECR

**Triggers**:

- Automatic: Push to main/develop with API changes
- Manual: `workflow_dispatch`

**Outputs**:

- ECR image URI with immutable digest
- Image tags (SHA, branch-latest)
- Metadata artifact for audit trail

**Key Steps**:

1. Checkout and setup pnpm/Node
2. Build API with Turbo (affected dependencies only)
3. Build Docker image with layer caching
4. Push to ECR with multiple tags
5. Output image digest for deployment

---

### `.github/workflows/deploy-api-aws.yml` (Enhanced)

**Purpose**: Deploy API to AWS ECS Fargate

**Triggers**:

- Automatic: Push to main with API changes
- Manual: `workflow_dispatch` with environment selection

**Inputs**:

- `environment`: dev, staging, production
- `image_tag`: Optional semver tag
- `skip_tests`: Emergency fallback (not recommended)

**Key Steps**:

1. Validate API (lint, typecheck, test)
2. Build API (Turbo)
3. Configure AWS credentials (OIDC)
4. Build & push Docker image to ECR
5. Download current ECS task definition
6. Render task definition with new image digest
7. Update ECS service
8. **NEW**: Run smoke tests
   - Test `/api/v1/health` endpoint
   - Test `/api/v1/docs` endpoint
   - Retry loop with backoff
9. Upload metadata artifact

**Changes from Original**:

- Added comprehensive smoke test section
- Tests health endpoint and Swagger docs
- Configurable health check endpoint via GitHub variables
- Automatic retries for service startup

---

### `.github/workflows/migrate-api-database.yml`

**Purpose**: Execute database migrations as one-off ECS tasks

**Triggers**:

- Manual only: `workflow_dispatch`

**Inputs**:

- `environment`: staging or production
- `migration_direction`: up or down
- `rollback_count`: Number of migrations to rollback (down only)
- `skip_backup`: Skip automatic backup (not recommended)
- `dry_run`: Simulate without changes (default: true)

**Key Steps**:

1. Create migration plan summary
2. Configure AWS credentials (OIDC)
3. Create database backup (AWS Backup service)
4. Register ECS migration task
5. Prepare migration command
6. **DRY RUN**: Show what would happen
7. **PRODUCTION**: Execute migration task
8. Stream logs from CloudWatch
9. Verify database health
10. Create deployment annotations
11. Notify Slack (success/failure)
12. Upload logs artifact

**Safety Features**:

- Backup before migration (configurable)
- Concurrency control (one at a time per environment)
- Dry run mode for validation
- Detailed logging and rollback instructions
- Slack notifications with issue details

---

## 🔐 Secrets Management

### AWS Secrets Manager (for sensitive data)

Store as JSON secret:

```json
{
  "MONGODB_URI": "mongodb+srv://user:password@...",
  "REDIS_PASSWORD": "secret-password",
  "JWT_SECRET": "secret-key-32-chars-minimum"
}
```

**Create via AWS CLI**:

```bash
aws secretsmanager create-secret \
  --name /todo-api/production/secrets \
  --secret-string '{...}' \
  --region eu-central-1
```

### AWS Systems Manager Parameter Store (for configuration)

Store individual parameters:

```bash
aws ssm put-parameter \
  --name /todo-api/prod/CORS_ORIGIN \
  --value "https://todo.example.com" \
  --type String
```

### Using in ECS Task Definition:

```json
"secrets": [
  {
    "name": "MONGODB_URI",
    "valueFrom": "arn:aws:secretsmanager:eu-central-1:ACCOUNT:secret:/todo-api/prod/secrets:MONGODB_URI::"
  },
  {
    "name": "CORS_ORIGIN",
    "valueFrom": "arn:aws:ssm:eu-central-1:ACCOUNT:parameter/todo-api/prod/CORS_ORIGIN"
  }
]
```

---

## 📊 Terraform Configuration

### Module: `infra/terraform/modules/api-secrets/main.tf`

**Purpose**: Manage API secrets in Secrets Manager and SSM Parameter Store

**Key Resources**:

- `aws_secretsmanager_secret` - Secrets Manager secret
- `aws_ssm_parameter` - SSM parameters (one per config option)
- `aws_kms_key` - KMS encryption for production (optional)
- `aws_iam_role_policy` - ECS task permissions

**Usage**:

```hcl
module "api_secrets" {
  source = "./infra/terraform/modules/api-secrets"

  environment = "production"

  api_secrets = {
    mongodb_uri    = var.mongodb_uri
    redis_password = var.redis_password
    jwt_secret     = var.jwt_secret
  }

  api_config = {
    cors_origin         = "https://todo.example.com"
    node_env            = "production"
    # ... other config
  }
}
```

**Outputs**:

- `api_secrets_arn` - ARN for Secrets Manager secret
- `secrets_for_ecs_task_definition` - Ready-to-use secrets array for ECS
- `kms_key_id` - KMS key for encryption (production)

---

## 🐳 Docker Image (Production Ready)

### Multi-Stage Build Strategy:

```
development     → pnpm install → pnpm build:api (dev server)
prod-deps      → pnpm install --prod (only production deps)
build          → pnpm install → pnpm build:api (compilation)
production     → copy compiled code + prod deps + curl (runtime)
```

### Production Stage Features:

- ✅ Minimal image size (only production dependencies)
- ✅ Non-root user (security)
- ✅ Health check with curl (ECS compatible)
- ✅ Proper signal handling (PID 1)
- ✅ Correct entrypoint (node apps/api/dist/main.js)

### Health Check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1
```

- **Interval**: 30 seconds between checks
- **Timeout**: 3 seconds max wait per check
- **Start Period**: 5 seconds before first check
- **Retries**: 3 failures to mark unhealthy

---

## 🗄️ Database Migrations

### Running Migrations Locally:

```bash
# See all available migrations
node db/migrate.js list

# Check current status
node db/migrate.js status

# Run all pending migrations
node db/migrate.js up

# Rollback last migration
node db/migrate.js down

# Rollback all migrations
node db/migrate.js down all

# Create new migration
node db/migrate.js create add-user-roles
```

### Running Migrations in Production:

Always use the GitHub workflow:

```bash
gh workflow run migrate-api-database.yml \
  -f environment=production \
  -f migration_direction=up \
  -f dry_run=false
```

**Never**:

- ❌ Run migrations during app deployment
- ❌ Run multiple migrations concurrently
- ❌ Skip testing in staging first
- ❌ Forget to backup before production

---

## 🎯 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ GitHub Push (main) or Manual Workflow Trigger                │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌─────────────┐      ┌──────────────────────┐
    │ build-api   │      │ migrate-api-database │
    │ -image.yml  │      │ .yml (manual)        │
    └──────┬──────┘      └──────────────────────┘
           │
    Build & Test
    Push to ECR
           │
           ▼
    ┌──────────────────────┐
    │ deploy-api-aws.yml   │
    └──────┬───────────────┘
           │
    Render Task Definition
    Update ECS Service
    Run Smoke Tests
           │
           ▼
    ✅ API Running on AWS
```

---

## ✅ Verification Commands

### Verify Docker Build:

```bash
docker build -f apps/api/Dockerfile -t todo-api:test .
docker run --rm -p 3001:3001 todo-api:test
curl http://localhost:3001/api/v1/health
```

### Verify Workflows Exist:

```bash
gh workflow list | grep -E "(build-api|deploy-api|migrate-api)"
```

### Verify Smoke Test Logic:

```bash
# Test real endpoints
curl -f http://localhost:3001/api/v1/health
curl -f http://localhost:3001/api/v1/docs
```

### Verify Secrets Setup (Terraform):

```bash
# Validate Terraform
terraform validate infra/terraform/modules/api-secrets/

# Format check
terraform fmt -check infra/terraform/modules/api-secrets/
```

---

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

---

## 🎓 Learning Resources

**Understanding the Deployment Flow**:

1. Read `docs/API_DEPLOYMENT_COMPLETION_SUMMARY.md`
2. Review the workflow files in `.github/workflows/`
3. Study the Dockerfile in `apps/api/Dockerfile`
4. Review Terraform module in `infra/terraform/modules/api-secrets/`

**Hands-On Practice**:

1. Build the Docker image locally
2. Trigger a dry-run migration on staging
3. Review logs from past workflow runs
4. Test the smoke tests manually with curl

---

## 🆘 Troubleshooting

### Build Workflow Fails

**Check**:

- Turbo cache connectivity
- pnpm lock file consistency
- ECR repository exists and is accessible

### Deploy Workflow Fails

**Check**:

- ECS cluster exists
- ECS service exists
- IAM role has correct permissions
- Network configuration correct

### Smoke Test Fails

**Check**:

- API container is running (check ECS logs)
- Health endpoint returns 200 OK
- Security groups allow port 3001
- ALB target health

### Migration Fails

**Check**:

- Database is accessible
- Migration script syntax is correct
- Secrets are accessible
- Previous migrations were successful
- Database has sufficient permissions

---

**Generated**: 2026-05-03  
**Status**: All API Deployment Tasks Complete ✅
