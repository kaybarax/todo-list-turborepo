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
  description = "AWS region where AWS-managed database resources are deployed."
  type        = string
}

variable "database_provider" {
  description = "Managed MongoDB-compatible provider, for example documentdb or atlas."
  type        = string

  validation {
    condition     = contains(["documentdb", "atlas"], var.database_provider)
    error_message = "database_provider must be documentdb or atlas."
  }
}

variable "subnet_ids" {
  description = "Private subnet IDs for DocumentDB."
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for DocumentDB."
  type        = list(string)
  default     = []
}

variable "database_name" {
  description = "Application database name."
  type        = string
  default     = "todos"
}

variable "master_username" {
  description = "DocumentDB master username."
  type        = string
  default     = "todoadmin"
}

variable "engine_version" {
  description = "DocumentDB engine version."
  type        = string
  default     = "5.0.0"
}

variable "instance_class" {
  description = "DocumentDB instance class."
  type        = string
  default     = "db.t4g.medium"
}

variable "instance_count" {
  description = "Number of DocumentDB cluster instances."
  type        = number
  default     = 1
}

variable "backup_retention_days" {
  description = "DocumentDB backup retention period."
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Whether deletion protection is enabled."
  type        = bool
  default     = true
}

variable "preferred_backup_window" {
  description = "Preferred backup window."
  type        = string
  default     = "02:00-03:00"
}

variable "skip_final_snapshot" {
  description = "Whether to skip final snapshots when destroying DocumentDB."
  type        = bool
  default     = false
}

variable "atlas_mongodb_uri" {
  description = "MongoDB Atlas URI to store when database_provider is atlas."
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.database_provider != "atlas" || var.atlas_mongodb_uri != ""
    error_message = "atlas_mongodb_uri is required when database_provider is atlas."
  }
}

variable "tags" {
  description = "Common tags to apply to resources."
  type        = map(string)
  default     = {}
}

locals {
  module_name = "aws-documentdb-or-atlas"
  name_prefix = "${var.project}-${var.environment}"
  use_docdb   = var.database_provider == "documentdb"
  tags        = merge(var.tags, { service = "database", managed_by = "terraform" })

  documentdb_uri = local.use_docdb ? "mongodb://${var.master_username}:${urlencode(random_password.master[0].result)}@${aws_docdb_cluster.this[0].endpoint}:${aws_docdb_cluster.this[0].port}/${var.database_name}?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" : null
  mongodb_uri    = local.use_docdb ? local.documentdb_uri : var.atlas_mongodb_uri
}

resource "random_password" "master" {
  count = local.use_docdb ? 1 : 0

  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_docdb_subnet_group" "this" {
  count = local.use_docdb ? 1 : 0

  name       = "${local.name_prefix}-docdb"
  subnet_ids = var.subnet_ids

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-docdb"
  })
}

resource "aws_docdb_cluster" "this" {
  count = local.use_docdb ? 1 : 0

  cluster_identifier              = "${local.name_prefix}-docdb"
  engine                          = "docdb"
  engine_version                  = var.engine_version
  master_username                 = var.master_username
  master_password                 = random_password.master[0].result
  db_subnet_group_name            = aws_docdb_subnet_group.this[0].name
  vpc_security_group_ids          = var.security_group_ids
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = var.preferred_backup_window
  storage_encrypted               = true
  deletion_protection             = var.deletion_protection
  skip_final_snapshot             = var.skip_final_snapshot
  final_snapshot_identifier       = var.skip_final_snapshot ? null : "${local.name_prefix}-docdb-final"
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-docdb"
  })
}

resource "aws_docdb_cluster_instance" "this" {
  count = local.use_docdb ? var.instance_count : 0

  identifier         = "${local.name_prefix}-docdb-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.this[0].id
  instance_class     = var.instance_class

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-docdb-${count.index + 1}"
  })
}

resource "aws_secretsmanager_secret" "master_credentials" {
  count = local.use_docdb ? 1 : 0

  name                    = "${var.project}/${var.environment}/database/master-credentials"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.tags, {
    Name = "${var.project}/${var.environment}/database/master-credentials"
  })
}

resource "aws_secretsmanager_secret_version" "master_credentials" {
  count = local.use_docdb ? 1 : 0

  secret_id = aws_secretsmanager_secret.master_credentials[0].id
  secret_string = jsonencode({
    username = var.master_username
    password = random_password.master[0].result
    endpoint = aws_docdb_cluster.this[0].endpoint
    port     = aws_docdb_cluster.this[0].port
    database = var.database_name
  })
}

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name                    = "${var.project}/${var.environment}/database/MONGODB_URI"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.tags, {
    Name = "${var.project}/${var.environment}/database/MONGODB_URI"
  })
}

resource "aws_secretsmanager_secret_version" "mongodb_uri" {
  secret_id     = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = local.mongodb_uri
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}

output "mongodb_uri_secret_arn" {
  description = "Secrets Manager ARN containing MONGODB_URI."
  value       = aws_secretsmanager_secret.mongodb_uri.arn
}

output "master_credentials_secret_arn" {
  description = "Secrets Manager ARN containing generated DocumentDB master credentials."
  value       = try(aws_secretsmanager_secret.master_credentials[0].arn, null)
}

output "cluster_identifier" {
  description = "DocumentDB cluster identifier when database_provider is documentdb."
  value       = try(aws_docdb_cluster.this[0].cluster_identifier, null)
}

output "endpoint" {
  description = "DocumentDB endpoint when database_provider is documentdb."
  value       = try(aws_docdb_cluster.this[0].endpoint, null)
}

output "port" {
  description = "DocumentDB port when database_provider is documentdb."
  value       = try(aws_docdb_cluster.this[0].port, null)
}
