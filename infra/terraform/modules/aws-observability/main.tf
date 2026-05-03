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

variable "log_retention_days" {
  description = "CloudWatch log retention for observability-owned log groups."
  type        = number
  default     = 30
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for ECS service alarms."
  type        = string
  default     = ""
}

variable "ecs_service_names" {
  description = "ECS service names to alarm on."
  type        = list(string)
  default     = []
}

variable "ecs_service_min_running_tasks" {
  description = "Minimum expected running task count by ECS service name. Uses Container Insights RunningTaskCount."
  type        = map(number)
  default     = {}
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics."
  type        = string
  default     = ""
}

variable "api_target_group_arn_suffix" {
  description = "API target group ARN suffix for CloudWatch metrics."
  type        = string
  default     = ""
}

variable "documentdb_cluster_identifier" {
  description = "DocumentDB cluster identifier for database alarms."
  type        = string
  default     = ""
}

variable "redis_replication_group_id" {
  description = "Redis replication group ID for cache alarms."
  type        = string
  default     = ""
}

variable "alarm_actions" {
  description = "SNS topic ARNs or other CloudWatch alarm action ARNs."
  type        = list(string)
  default     = []
}

variable "create_otel_collector_log_group" {
  description = "Whether to create a log group reserved for a future OTEL collector."
  type        = bool
  default     = true
}

variable "api_5xx_threshold" {
  description = "ALB 5xx alarm threshold over the evaluation window."
  type        = number
  default     = 5
}

variable "cpu_threshold" {
  description = "ECS CPU utilization alarm threshold."
  type        = number
  default     = 80
}

variable "memory_threshold" {
  description = "ECS memory utilization alarm threshold."
  type        = number
  default     = 80
}

variable "redis_memory_threshold" {
  description = "Redis database memory usage percentage threshold."
  type        = number
  default     = 80
}

variable "ingestion_lag_metric_name" {
  description = "Optional custom CloudWatch metric name for ingestion lag."
  type        = string
  default     = ""
}

variable "ingestion_lag_namespace" {
  description = "CloudWatch namespace for the optional ingestion lag metric."
  type        = string
  default     = "Todo/Ingestion"
}

variable "ingestion_lag_threshold" {
  description = "Ingestion lag alarm threshold."
  type        = number
  default     = 300
}

locals {
  module_name = "aws-observability"
  name_prefix = "${var.project}-${var.environment}"
  tags        = merge(var.tags, { service = "observability", managed_by = "terraform" })
}

resource "aws_cloudwatch_log_group" "otel_collector" {
  count = var.create_otel_collector_log_group ? 1 : 0

  name              = "/aws/otel/${local.name_prefix}/collector"
  retention_in_days = var.log_retention_days

  tags = merge(local.tags, {
    Name = "/aws/otel/${local.name_prefix}/collector"
  })
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  for_each = toset(var.ecs_cluster_name == "" ? [] : var.ecs_service_names)

  alarm_name          = "${local.name_prefix}-${each.value}-ecs-cpu-high"
  alarm_description   = "ECS service CPU is above ${var.cpu_threshold}%."
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.cpu_threshold
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  for_each = toset(var.ecs_cluster_name == "" ? [] : var.ecs_service_names)

  alarm_name          = "${local.name_prefix}-${each.value}-ecs-memory-high"
  alarm_description   = "ECS service memory is above ${var.memory_threshold}%."
  namespace           = "AWS/ECS"
  metric_name         = "MemoryUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.memory_threshold
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "ecs_running_tasks" {
  for_each = toset(var.ecs_cluster_name == "" ? [] : var.ecs_service_names)

  alarm_name          = "${local.name_prefix}-${each.value}-ecs-running-tasks-low"
  alarm_description   = "ECS service running task count is below the expected minimum."
  namespace           = "ECS/ContainerInsights"
  metric_name         = "RunningTaskCount"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 3
  threshold           = lookup(var.ecs_service_min_running_tasks, each.value, 1)
  comparison_operator = "LessThanThreshold"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "breaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.value
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count = var.alb_arn_suffix == "" ? 0 : 1

  alarm_name          = "${local.name_prefix}-api-alb-5xx"
  alarm_description   = "ALB is returning elevated 5xx responses."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.api_5xx_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "api_target_health" {
  count = var.alb_arn_suffix == "" || var.api_target_group_arn_suffix == "" ? 0 : 1

  alarm_name          = "${local.name_prefix}-api-targets-unhealthy"
  alarm_description   = "API target group has no healthy targets."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HealthyHostCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.api_target_group_arn_suffix
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "documentdb_connections" {
  count = var.documentdb_cluster_identifier == "" ? 0 : 1

  alarm_name          = "${local.name_prefix}-documentdb-connections-high"
  alarm_description   = "DocumentDB connection count is elevated."
  namespace           = "AWS/DocDB"
  metric_name         = "DatabaseConnections"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 400
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBClusterIdentifier = var.documentdb_cluster_identifier
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "documentdb_cpu" {
  count = var.documentdb_cluster_identifier == "" ? 0 : 1

  alarm_name          = "${local.name_prefix}-documentdb-cpu-high"
  alarm_description   = "DocumentDB CPU utilization is elevated."
  namespace           = "AWS/DocDB"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBClusterIdentifier = var.documentdb_cluster_identifier
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  count = var.redis_replication_group_id == "" ? 0 : 1

  alarm_name          = "${local.name_prefix}-redis-memory-high"
  alarm_description   = "Redis memory utilization is elevated."
  namespace           = "AWS/ElastiCache"
  metric_name         = "DatabaseMemoryUsagePercentage"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = var.redis_memory_threshold
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ReplicationGroupId = var.redis_replication_group_id
  }

  tags = local.tags
}

resource "aws_cloudwatch_metric_alarm" "ingestion_lag" {
  count = var.ingestion_lag_metric_name == "" ? 0 : 1

  alarm_name          = "${local.name_prefix}-ingestion-lag-high"
  alarm_description   = "Ingestion lag is above the configured threshold."
  namespace           = var.ingestion_lag_namespace
  metric_name         = var.ingestion_lag_metric_name
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.ingestion_lag_threshold
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "notBreaching"

  tags = local.tags
}

variable "ingestion_log_group_name" {
  description = "Log group name for the ingestion service."
  type        = string
  default     = ""
}

resource "aws_cloudwatch_log_metric_filter" "ingestion_success" {
  count          = var.ingestion_log_group_name == "" ? 0 : 1
  name           = "${local.name_prefix}-ingestion-success"
  pattern        = "\"Ingested todo:\""
  log_group_name = var.ingestion_log_group_name

  metric_transformation {
    name      = "IngestionSuccessCount"
    namespace = "Todo/Ingestion"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "ingestion_success_low" {
  count               = var.ingestion_log_group_name == "" ? 0 : 1
  alarm_name          = "${local.name_prefix}-ingestion-success-low"
  alarm_description   = "Ingestion successful operations count is too low (heartbeat missing)."
  namespace           = "Todo/Ingestion"
  metric_name         = "IngestionSuccessCount"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "breaching"

  depends_on = [aws_cloudwatch_log_metric_filter.ingestion_success]
  tags       = local.tags
}

resource "aws_cloudwatch_log_metric_filter" "ingestion_failures" {
  count          = var.ingestion_log_group_name == "" ? 0 : 1
  name           = "${local.name_prefix}-ingestion-failures"
  pattern        = "\"Failed to ingest todo:\""
  log_group_name = var.ingestion_log_group_name

  metric_transformation {
    name      = "IngestionFailureCount"
    namespace = "Todo/Ingestion"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "ingestion_repeated_failures" {
  count               = var.ingestion_log_group_name == "" ? 0 : 1
  alarm_name          = "${local.name_prefix}-ingestion-failures-high"
  alarm_description   = "Ingestion failures are above the threshold."
  namespace           = "Todo/Ingestion"
  metric_name         = "IngestionFailureCount"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 2
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "notBreaching"

  depends_on = [aws_cloudwatch_log_metric_filter.ingestion_failures]
  tags       = local.tags
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}

output "otel_collector_log_group_name" {
  description = "OTEL collector log group name, if created."
  value       = try(aws_cloudwatch_log_group.otel_collector[0].name, null)
}

output "alarm_names" {
  description = "CloudWatch alarm names created by this module."
  value = compact(concat(
    [for alarm in aws_cloudwatch_metric_alarm.ecs_cpu : alarm.alarm_name],
    [for alarm in aws_cloudwatch_metric_alarm.ecs_memory : alarm.alarm_name],
    [for alarm in aws_cloudwatch_metric_alarm.ecs_running_tasks : alarm.alarm_name],
    [try(aws_cloudwatch_metric_alarm.alb_5xx[0].alarm_name, "")],
    [try(aws_cloudwatch_metric_alarm.api_target_health[0].alarm_name, "")],
    [try(aws_cloudwatch_metric_alarm.documentdb_connections[0].alarm_name, "")],
    [try(aws_cloudwatch_metric_alarm.documentdb_cpu[0].alarm_name, "")],
    [try(aws_cloudwatch_metric_alarm.redis_memory[0].alarm_name, "")],
    [try(aws_cloudwatch_metric_alarm.ingestion_lag[0].alarm_name, "")]
  ))
}
