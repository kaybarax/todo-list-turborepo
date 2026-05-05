# Deployment Guide

This guide covers the comprehensive deployment process for the Todo App monorepo using **Infrastructure as Code (IaC)** and a **Decoupled Deployment** strategy.

## 🚀 Deployment Strategy Overview

The monorepo uses a platform-optimized deployment strategy where each component is hosted on the infrastructure best suited for its runtime:

- **Web Application**: [Vercel](https://vercel.com) (Next.js 15)
- **API Server**: [AWS ECS Fargate](https://aws.amazon.com/ecs/) (NestJS)
- **Ingestion Service**: [AWS ECS Fargate](https://aws.amazon.com/ecs/) (Private Worker)
- **Mobile Application**: [Expo Application Services (EAS)](https://expo.dev/eas)
- **Infrastructure**: Managed via **Terraform** and **Terragrunt**

## 🏗️ Infrastructure as Code (IaC)

Infrastructure is managed using Terraform modules orchestrated by Terragrunt for environment-specific configuration.

### Prerequisites

- [Terraform](https://www.terraform.io/downloads) (>= 1.9.0)
- [Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started/quick-start/)
- AWS CLI configured with appropriate permissions
- GitHub Personal Access Token (for GitHub provider)

### Infrastructure Workflow

1.  **Navigate to an environment**:

    ```bash
    cd infra/terragrunt/dev/aws
    ```

2.  **Plan changes**:

    ```bash
    terragrunt run-all plan
    ```

3.  **Apply changes**:
    ```bash
    terragrunt run-all apply
    ```

For detailed infrastructure documentation, see [infra/terragrunt/README.md](file:///Users/kevin/workspace/todo-list-turborepo/infra/terragrunt/README.md).

## 🚢 Application Deployment

### Web Application (`apps/web`)

The web app is deployed to Vercel.

- **Primary Path**: Automated via GitHub integration or `deploy-web-vercel.yml` workflow.
- **Manual Deploy**:
  ```bash
  pnpm turbo run build --filter=@todo/web...
  # Follow Vercel CLI instructions
  ```

### API & Ingestion (`apps/api`, `apps/ingestion`)

Backend services are deployed to AWS ECS Fargate.

1.  **Build and Push Image**: Triggered by `deploy-api-aws.yml` or `deploy-ingestion-aws.yml`.
2.  **Deployment**: GitHub Actions assumes an AWS role via OIDC, renders a task definition with the new image digest, and updates the ECS service.

### Mobile Application (`apps/mobile`)

The mobile app uses EAS for builds and submissions.

- **Build**: `eas build --platform all --profile production`
- **Submit**: `eas submit --platform all`
- **Automation**: Triggered by `deploy-mobile-eas.yml`.

## 🔐 Environment Variables & Secrets

### Sources of Truth

- **Secrets**: Stored in **AWS Secrets Manager** (runtime) or **GitHub Secrets** (build-time/deployment).
- **Configuration**: Managed via **Terraform Outputs** and injected into GitHub Environments.
- **Environment Variables**: Defined in [Environment Variables](../development/environment-variables.md).

### Updating Secrets

To update a runtime secret for the API:

1. Update the value in AWS Secrets Manager.
2. Redeploy the ECS service to pick up the new secret version (if using versioned secrets) or restart the tasks.

## 🔄 CI/CD Pipelines

The project uses GitHub Actions for CI/CD, optimized with path filtering:

- **Affected-CI**: Runs linting, typechecking, and tests only for affected apps/packages on Pull Requests.
- **Terraform Plan**: Automatically runs on PRs affecting `infra/` or `terragrunt/`.
- **App Deploys**: Triggered on merges to `main` for the specific app that was changed.

## 📊 Monitoring & Observability

- **Tracing**: OpenTelemetry (OTEL) traces sent to AWS CloudWatch or a configured OTLP collector.
- **Logs**: Centralized in **AWS CloudWatch Logs**.
- **Alarms**: Configured via the `aws-observability` Terraform module for CPU/Memory/Error thresholds.

## ☸️ Legacy Kubernetes (Reference Only)

The original Kubernetes manifests are maintained for reference in [infra/kubernetes](file:///Users/kevin/workspace/todo-list-turborepo/infra/kubernetes/). These are **not** the primary production path and should be used only for local development or specialized environments.

See [infra/kubernetes/README.md](file:///Users/kevin/workspace/todo-list-turborepo/infra/kubernetes/README.md) for more details.

## 🔧 Troubleshooting

- **Deployment Failures**: Check GitHub Action logs for the specific service.
- **ECS Issues**: Inspect ECS Task logs in CloudWatch.
- **Connectivity**: Verify Security Group settings and VPC endpoints in the `aws-network` module.
- **Terraform State**: If state is locked, check the DynamoDB lock table.
