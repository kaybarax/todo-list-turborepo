# API Secrets and Configuration Terraform Module
# This module creates AWS Secrets Manager secrets and SSM parameters for the API

variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "eu-central-1"
}

variable "api_secrets" {
  type = object({
    mongodb_uri     = string
    redis_password  = string
    jwt_secret      = string
  })
  description = "API secrets from Secrets Manager"
  sensitive   = true
}

variable "api_config" {
  type = object({
    cors_origin         = string
    node_env            = string
    port                = number
    telemetry_enabled   = bool
    otlp_endpoint       = string
    otel_service_name   = string
    otel_service_version = string
  })
  description = "API configuration for SSM Parameter Store"
}

variable "tags" {
  type = map(string)
  description = "Common tags for all resources"
  default = {
    app         = "todo-list"
    service     = "api"
    managed_by  = "terraform"
  }
}

# Secrets Manager Secret for API
resource "aws_secretsmanager_secret" "api_secrets" {
  name_prefix             = "todo-api-${var.environment}-"
  description             = "Secrets for Todo API in ${var.environment} environment"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7
  kms_key_id              = var.environment == "prod" ? aws_kms_key.secrets.id : null

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

# Secret Version for API Secrets
resource "aws_secretsmanager_secret_version" "api_secrets" {
  secret_id = aws_secretsmanager_secret.api_secrets.id
  secret_string = jsonencode({
    MONGODB_URI    = var.api_secrets.mongodb_uri
    REDIS_PASSWORD = var.api_secrets.redis_password
    JWT_SECRET     = var.api_secrets.jwt_secret
  })
}

# SSM Parameters for Configuration
resource "aws_ssm_parameter" "cors_origin" {
  name  = "/todo-api/${var.environment}/CORS_ORIGIN"
  type  = "String"
  value = var.api_config.cors_origin

  tags = merge(
    var.tags,
    {
      environment = var.environment
      config_type = "public"
    }
  )
}

resource "aws_ssm_parameter" "node_env" {
  name  = "/todo-api/${var.environment}/NODE_ENV"
  type  = "String"
  value = var.api_config.node_env

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

resource "aws_ssm_parameter" "port" {
  name  = "/todo-api/${var.environment}/PORT"
  type  = "String"
  value = tostring(var.api_config.port)

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

resource "aws_ssm_parameter" "telemetry_enabled" {
  name  = "/todo-api/${var.environment}/TELEMETRY_ENABLED"
  type  = "String"
  value = tostring(var.api_config.telemetry_enabled)

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

resource "aws_ssm_parameter" "otlp_endpoint" {
  name  = "/todo-api/${var.environment}/OTLP_ENDPOINT"
  type  = "String"
  value = var.api_config.otlp_endpoint

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

resource "aws_ssm_parameter" "otel_service_name" {
  name  = "/todo-api/${var.environment}/OTEL_SERVICE_NAME"
  type  = "String"
  value = var.api_config.otel_service_name

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

resource "aws_ssm_parameter" "otel_service_version" {
  name  = "/todo-api/${var.environment}/OTEL_SERVICE_VERSION"
  type  = "String"
  value = var.api_config.otel_service_version

  tags = merge(
    var.tags,
    {
      environment = var.environment
    }
  )
}

# KMS Key for Secret Encryption (production only)
resource "aws_kms_key" "secrets" {
  count                   = var.environment == "prod" ? 1 : 0
  description             = "KMS key for API secrets in ${var.environment} environment"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      environment = var.environment
      purpose     = "secrets-encryption"
    }
  )
}

resource "aws_kms_alias" "secrets" {
  count         = var.environment == "prod" ? 1 : 0
  name          = "alias/todo-api-${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets[0].key_id
}

# IAM Policy for ECS Task to Access Secrets and Parameters
resource "aws_iam_role_policy" "api_ecs_task_secrets" {
  name = "todo-api-${var.environment}-ecs-task-secrets-policy"
  role = var.ecs_task_role_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.api_secrets.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/todo-api/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.environment == "prod" ? aws_kms_key.secrets[0].arn : "*"
      }
    ]
  })
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Outputs
output "api_secrets_arn" {
  value       = aws_secretsmanager_secret.api_secrets.arn
  description = "ARN of the API secrets in Secrets Manager"
}

output "secrets_for_ecs_task_definition" {
  value = [
    {
      name      = "MONGODB_URI"
      valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:MONGODB_URI::"
    },
    {
      name      = "REDIS_PASSWORD"
      valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:REDIS_PASSWORD::"
    },
    {
      name      = "JWT_SECRET"
      valueFrom = "${aws_secretsmanager_secret.api_secrets.arn}:JWT_SECRET::"
    },
    {
      name      = "CORS_ORIGIN"
      valueFrom = aws_ssm_parameter.cors_origin.arn
    }
  ]
  description = "Secrets and parameters configuration for ECS task definition"
}

output "kms_key_id" {
  value       = var.environment == "prod" ? aws_kms_key.secrets[0].id : null
  description = "KMS key ID for secrets encryption (production only)"
}

