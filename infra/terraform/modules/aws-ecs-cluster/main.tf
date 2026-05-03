terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
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

variable "services" {
  description = "Service names that need ECS log groups and IAM roles."
  type        = list(string)
  default     = ["api", "ingestion"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention for ECS service log groups."
  type        = number
  default     = 30
}

variable "container_insights_enabled" {
  description = "Whether ECS Container Insights is enabled."
  type        = bool
  default     = true
}

variable "execution_role_secret_arns" {
  description = "Secrets Manager or SSM parameter ARNs the ECS task execution role may read."
  type        = map(list(string))
  default     = {}
}

locals {
  module_name = "aws-ecs-cluster"
  name_prefix = "${var.project}-${var.environment}"
  services    = toset(var.services)
  tags        = merge(var.tags, { managed_by = "terraform" })
}

data "aws_iam_policy_document" "ecs_tasks_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "execution_secrets" {
  for_each = {
    for service in local.services : service => lookup(var.execution_role_secret_arns, service, [])
    if length(lookup(var.execution_role_secret_arns, service, [])) > 0
  }

  statement {
    actions = [
      "secretsmanager:GetSecretValue",
      "ssm:GetParameters",
      "ssm:GetParameter",
    ]
    resources = each.value
  }
}

resource "aws_ecs_cluster" "this" {
  name = "${local.name_prefix}-ecs"

  setting {
    name  = "containerInsights"
    value = var.container_insights_enabled ? "enabled" : "disabled"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-ecs"
  })
}

resource "aws_cloudwatch_log_group" "service" {
  for_each = local.services

  name              = "/aws/ecs/${local.name_prefix}/${each.value}"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name    = "/aws/ecs/${local.name_prefix}/${each.value}"
    service = each.value
  })
}

resource "aws_iam_role" "execution" {
  for_each = local.services

  name               = "${local.name_prefix}-${each.value}-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role.json

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-${each.value}-exec"
    service = each.value
  })
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  for_each = aws_iam_role.execution

  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  for_each = data.aws_iam_policy_document.execution_secrets

  name   = "${local.name_prefix}-${each.key}-exec-secrets"
  role   = aws_iam_role.execution[each.key].id
  policy = each.value.json
}

resource "aws_iam_role" "task" {
  for_each = local.services

  name               = "${local.name_prefix}-${each.value}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role.json

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-${each.value}-task"
    service = each.value
  })
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}

output "cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.this.name
}

output "cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.this.arn
}

output "log_group_names" {
  description = "CloudWatch log group names by service."
  value       = { for service, log_group in aws_cloudwatch_log_group.service : service => log_group.name }
}

output "execution_role_arns" {
  description = "ECS task execution role ARNs by service."
  value       = { for service, role in aws_iam_role.execution : service => role.arn }
}

output "task_role_arns" {
  description = "ECS task role ARNs by service."
  value       = { for service, role in aws_iam_role.task : service => role.arn }
}

output "task_role_names" {
  description = "ECS task role names by service."
  value       = { for service, role in aws_iam_role.task : service => role.name }
}
