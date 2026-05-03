# Ingestion Service

A background worker service that processes blockchain events and synchronizes data with the primary database.

## 🚀 Features

- **Multi-Network Ingestion**: Processes data from Polygon, Solana, Polkadot, Moonbeam, and Base.
- **Resilient Processing**: Implements retry logic and error handling for blockchain RPC flakiness.
- **Decoupled Architecture**: Operates independently of the main API to ensure background tasks don't impact request latency.
- **Observability**: Comprehensive logging and metrics for ingestion health.

## 🛠️ Development

### Prerequisites

- Node.js 22+
- MongoDB
- Redis
- Access to blockchain RPC nodes (see `.env.example`)

### Running Locally

```bash
# Install dependencies
pnpm install

# Start development mode
pnpm dev
```

## 🚀 Deployment

### AWS ECS Fargate (Primary Path)

The Ingestion service is deployed as a private ECS Fargate service.

- **Automation**: Managed via the `deploy-ingestion-aws.yml` workflow.
- **Identity**: Assumes AWS IAM roles via OIDC.
- **Config**: Ingests configuration from AWS Secrets Manager and Terraform outputs.
- **Health**: Monitored via CloudWatch alarms and custom health checks.

## 📊 Monitoring

- **Logs**: Streamed to AWS CloudWatch Logs.
- **Metrics**: Ingestion rates and error counts are tracked via OTEL.
