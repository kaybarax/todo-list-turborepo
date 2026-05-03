terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }

    random = {
      source = "hashicorp/random"
    }
  }
}

variable "project" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "aws_region" {
  description = "AWS region where this module is deployed."
  type        = string
}

variable "tags" {
  description = "Common AWS tags to apply to resources."
  type        = map(string)
  default     = {}
}

variable "subnet_ids" {
  description = "Private subnet IDs for Redis."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for Redis."
  type        = list(string)
}

variable "node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.micro"
}

variable "engine_version" {
  description = "Redis OSS engine version."
  type        = string
  default     = "7.1"
}

variable "parameter_group_family" {
  description = "Redis parameter group family."
  type        = string
  default     = "redis7"
}

variable "num_cache_clusters" {
  description = "Number of cache nodes in the replication group."
  type        = number
  default     = 1
}

variable "automatic_failover_enabled" {
  description = "Whether Redis automatic failover is enabled."
  type        = bool
  default     = false
}

variable "multi_az_enabled" {
  description = "Whether Redis Multi-AZ is enabled."
  type        = bool
  default     = false
}

variable "transit_encryption_enabled" {
  description = "Whether Redis encryption in transit is enabled."
  type        = bool
  default     = true
}

variable "at_rest_encryption_enabled" {
  description = "Whether Redis encryption at rest is enabled."
  type        = bool
  default     = true
}

variable "auth_token_enabled" {
  description = "Whether to generate and configure a Redis AUTH token."
  type        = bool
  default     = true
}

variable "maxmemory_policy" {
  description = "Redis eviction policy."
  type        = string
  default     = "allkeys-lru"
}

variable "snapshot_retention_limit" {
  description = "Number of Redis snapshots to retain."
  type        = number
  default     = 7
}

locals {
  module_name = "aws-redis"
  name_prefix = "${var.project}-${var.environment}"
  tags        = merge(var.tags, { service = "redis", managed_by = "terraform" })

  redis_scheme = var.transit_encryption_enabled ? "rediss" : "redis"
  redis_auth   = var.auth_token_enabled ? ":${urlencode(random_password.auth_token[0].result)}@" : ""
  redis_uri    = "${local.redis_scheme}://${local.redis_auth}${aws_elasticache_replication_group.this.primary_endpoint_address}:${aws_elasticache_replication_group.this.port}"
}

resource "random_password" "auth_token" {
  count = var.auth_token_enabled ? 1 : 0

  length  = 32
  special = false
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${local.name_prefix}-redis"
  subnet_ids = var.subnet_ids

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis"
  })
}

resource "aws_elasticache_parameter_group" "this" {
  name   = "${local.name_prefix}-redis"
  family = var.parameter_group_family

  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis"
  })
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id       = substr("${local.name_prefix}-redis", 0, 40)
  description                = "${local.name_prefix} Redis"
  engine                     = "redis"
  engine_version             = var.engine_version
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.this.name
  security_group_ids         = var.security_group_ids
  parameter_group_name       = aws_elasticache_parameter_group.this.name
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                 = var.auth_token_enabled ? random_password.auth_token[0].result : null
  snapshot_retention_limit   = var.snapshot_retention_limit

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-redis"
  })
}

resource "aws_secretsmanager_secret" "redis_uri" {
  name                    = "${var.project}/${var.environment}/redis/REDIS_URI"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.tags, {
    Name = "${var.project}/${var.environment}/redis/REDIS_URI"
  })
}

resource "aws_secretsmanager_secret_version" "redis_uri" {
  secret_id     = aws_secretsmanager_secret.redis_uri.id
  secret_string = local.redis_uri
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}

output "redis_uri_secret_arn" {
  description = "Secrets Manager ARN containing REDIS_URI."
  value       = aws_secretsmanager_secret.redis_uri.arn
}

output "replication_group_id" {
  description = "ElastiCache replication group ID."
  value       = aws_elasticache_replication_group.this.replication_group_id
}

output "primary_endpoint_address" {
  description = "Redis primary endpoint address."
  value       = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "port" {
  description = "Redis port."
  value       = aws_elasticache_replication_group.this.port
}
