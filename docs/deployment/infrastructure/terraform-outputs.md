# Terraform Outputs and Environment Injection

This document defines which infrastructure values managed by Terraform/Terragrunt should be exported as outputs and how they are consumed by the applications and CI/CD pipelines.

## 1. Global Infrastructure Outputs

| Output Name       | Target Consumption      | Description                  |
| ----------------- | ----------------------- | ---------------------------- |
| `vpc_id`          | Other Terraform modules | ID of the VPC                |
| `public_subnets`  | Other Terraform modules | List of public subnet IDs    |
| `private_subnets` | Other Terraform modules | List of private subnet IDs   |
| `aws_region`      | GitHub Variables / Env  | AWS region for all resources |

## 2. API Service (`apps/api`)

| Output Name              | Target Consumption    | Description                       |
| ------------------------ | --------------------- | --------------------------------- |
| `api_ecr_repository_url` | GitHub Variables      | ECR URL for the API image         |
| `api_ecs_cluster_name`   | GitHub Variables      | Name of the ECS cluster           |
| `api_ecs_service_name`   | GitHub Variables      | Name of the ECS service           |
| `api_alb_dns_name`       | `NEXT_PUBLIC_API_URL` | DNS name of the ALB               |
| `api_secrets_arn`        | ECS Task Definition   | ARN of the Secrets Manager secret |

## 3. Ingestion Service (`apps/ingestion`)

| Output Name                    | Target Consumption | Description                     |
| ------------------------------ | ------------------ | ------------------------------- |
| `ingestion_ecr_repository_url` | GitHub Variables   | ECR URL for the ingestion image |
| `ingestion_ecs_cluster_name`   | GitHub Variables   | Name of the ECS cluster         |
| `ingestion_ecs_service_name`   | GitHub Variables   | Name of the ECS service         |

## 4. Database and Cache

| Output Name        | Target Consumption | Description                     |
| ------------------ | ------------------ | ------------------------------- |
| `mongodb_endpoint` | `MONGODB_URI`      | Connection endpoint for MongoDB |
| `redis_endpoint`   | `REDIS_URI`        | Connection endpoint for Redis   |

## 5. CI/CD and Security

| Output Name               | Target Consumption | Description                               |
| ------------------------- | ------------------ | ----------------------------------------- |
| `github_actions_role_arn` | GitHub Variables   | IAM Role ARN for GitHub Actions to assume |

## 6. Web Application (`apps/web`)

| Output Name | Target Consumption    | Description                            |
| ----------- | --------------------- | -------------------------------------- |
| `api_url`   | `NEXT_PUBLIC_API_URL` | Final public URL for the API           |
| `ws_url`    | `NEXT_PUBLIC_WS_URL`  | Final public WebSocket URL for the API |

## Consumption Strategy

- **GitHub Variables**: Non-secret outputs are published to GitHub Repository Variables using the `scripts/publish-terraform-outputs.sh` script.
- **GitHub Secrets**: Secret outputs (if any, though rare for IaC outputs) should be manually verified or carefully automated.
- **ECS Task Definition**: Secrets Manager ARNs are injected directly into the Task Definition by Terraform.
- **Runtime Injection**: Apps fetch configuration from SSM Parameter Store or Environment Variables provided by ECS.
