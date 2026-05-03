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

variable "service" {
  description = "Application service name, for example api or ingestion."
  type        = string
}

variable "cluster_arn" {
  description = "ECS cluster ARN."
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name."
  type        = string
}

variable "image" {
  description = "Container image URI. Deploy workflows should update this to an immutable digest."
  type        = string
}

variable "cpu" {
  description = "Task CPU units."
  type        = number
  default     = 512
}

variable "memory" {
  description = "Task memory in MiB."
  type        = number
  default     = 1024
}

variable "container_port" {
  description = "Container port. Set to null for workers without exposed ports."
  type        = number
  default     = null
}

variable "desired_count" {
  description = "Desired task count for ECS service mode."
  type        = number
  default     = 1
}

variable "subnet_ids" {
  description = "Private subnet IDs for ECS tasks."
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for ECS tasks."
  type        = list(string)
}

variable "assign_public_ip" {
  description = "Whether ECS tasks receive public IPs."
  type        = bool
  default     = false
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN."
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN."
  type        = string
}

variable "task_role_name" {
  description = "ECS task role name, used when attaching inline service permissions."
  type        = string
  default     = ""
}

variable "log_group_name" {
  description = "CloudWatch log group name for the container."
  type        = string
}

variable "environment_variables" {
  description = "Plaintext environment variables for the container."
  type        = map(string)
  default     = {}
}

variable "secret_arns" {
  description = "Environment variable names mapped to Secrets Manager or SSM parameter ARNs."
  type        = map(string)
  default     = {}
}

variable "managed_secret_names" {
  description = "Environment variable names for empty Secrets Manager secrets that this service owns. Secret values are set out-of-band."
  type        = list(string)
  default     = []
}

variable "target_group_arn" {
  description = "Optional ALB target group ARN for public HTTP services."
  type        = string
  default     = ""
}

variable "health_check_grace_period_seconds" {
  description = "Health check grace period for services behind an ALB."
  type        = number
  default     = 60
}

variable "service_mode" {
  description = "Whether to run as a continuous ECS service or EventBridge scheduled task."
  type        = string
  default     = "service"

  validation {
    condition     = contains(["service", "scheduled"], var.service_mode)
    error_message = "service_mode must be service or scheduled."
  }
}

variable "schedule_expression" {
  description = "EventBridge schedule expression when service_mode is scheduled."
  type        = string
  default     = "rate(5 minutes)"
}

variable "autoscaling_enabled" {
  description = "Whether Application Auto Scaling is enabled for ECS service mode."
  type        = bool
  default     = false
}

variable "autoscaling_min_capacity" {
  description = "Minimum ECS service task count."
  type        = number
  default     = 1
}

variable "autoscaling_max_capacity" {
  description = "Maximum ECS service task count."
  type        = number
  default     = 3
}

variable "autoscaling_cpu_target" {
  description = "Target average ECS service CPU utilization percentage."
  type        = number
  default     = 60
}

variable "task_role_policy_statements" {
  description = "Additional least-privilege task role policy statements."
  type = list(object({
    sid       = optional(string)
    actions   = list(string)
    resources = list(string)
    effect    = optional(string, "Allow")
  }))
  default = []
}

variable "tags" {
  description = "Common AWS tags to apply to resources."
  type        = map(string)
  default     = {}
}

locals {
  module_name = "aws-ecs-service"
  name_prefix = "${var.project}-${var.environment}-${var.service}"
  tags        = merge(var.tags, { service = var.service, managed_by = "terraform" })

  managed_secret_arns = {
    for name, secret in aws_secretsmanager_secret.managed : name => secret.arn
  }

  container_secrets = merge(var.secret_arns, local.managed_secret_arns)

  container_definition = {
    name      = var.service
    image     = var.image
    essential = true

    environment = [
      for name, value in var.environment_variables : {
        name  = name
        value = value
      }
    ]

    secrets = [
      for name, value_from in local.container_secrets : {
        name      = name
        valueFrom = value_from
      }
    ]

    portMappings = var.container_port == null ? [] : [
      {
        containerPort = var.container_port
        hostPort      = var.container_port
        protocol      = "tcp"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = var.log_group_name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = var.service
      }
    }
  }
}

data "aws_iam_policy_document" "task" {
  count = length(var.task_role_policy_statements) > 0 ? 1 : 0

  dynamic "statement" {
    for_each = var.task_role_policy_statements

    content {
      sid       = try(statement.value.sid, null)
      effect    = try(statement.value.effect, "Allow")
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }
}

data "aws_iam_policy_document" "events_assume_role" {
  count = var.service_mode == "scheduled" ? 1 : 0

  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "events_run_task" {
  count = var.service_mode == "scheduled" ? 1 : 0

  statement {
    actions   = ["ecs:RunTask"]
    resources = [aws_ecs_task_definition.this.arn]
  }

  statement {
    actions = ["iam:PassRole"]
    resources = [
      var.execution_role_arn,
      var.task_role_arn,
    ]
  }
}

resource "aws_secretsmanager_secret" "managed" {
  for_each = toset(var.managed_secret_names)

  name                    = "${var.project}/${var.environment}/${var.service}/${each.value}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.tags, {
    Name = "${var.project}/${var.environment}/${var.service}/${each.value}"
  })
}

resource "aws_iam_role_policy" "task" {
  count = length(var.task_role_policy_statements) > 0 && var.task_role_name != "" ? 1 : 0

  name   = "${local.name_prefix}-task"
  role   = var.task_role_name
  policy = data.aws_iam_policy_document.task[0].json
}

resource "aws_ecs_task_definition" "this" {
  family                   = local.name_prefix
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.cpu)
  memory                   = tostring(var.memory)
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn
  container_definitions    = jsonencode([local.container_definition])

  tags = merge(local.tags, {
    Name = local.name_prefix
  })
}

resource "aws_ecs_service" "this" {
  count = var.service_mode == "service" ? 1 : 0

  name            = local.name_prefix
  cluster         = var.cluster_arn
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = var.target_group_arn == "" ? null : var.health_check_grace_period_seconds

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }

  dynamic "load_balancer" {
    for_each = var.target_group_arn == "" || var.container_port == null ? [] : [1]

    content {
      target_group_arn = var.target_group_arn
      container_name   = var.service
      container_port   = var.container_port
    }
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = merge(local.tags, {
    Name = local.name_prefix
  })
}

resource "aws_appautoscaling_target" "ecs" {
  count = var.service_mode == "service" && var.autoscaling_enabled ? 1 : 0

  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${var.cluster_name}/${aws_ecs_service.this[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  count = var.service_mode == "service" && var.autoscaling_enabled ? 1 : 0

  name               = "${local.name_prefix}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = var.autoscaling_cpu_target
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

resource "aws_iam_role" "events" {
  count = var.service_mode == "scheduled" ? 1 : 0

  name               = "${local.name_prefix}-events"
  assume_role_policy = data.aws_iam_policy_document.events_assume_role[0].json

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-events"
  })
}

resource "aws_iam_role_policy" "events" {
  count = var.service_mode == "scheduled" ? 1 : 0

  name   = "${local.name_prefix}-events"
  role   = aws_iam_role.events[0].id
  policy = data.aws_iam_policy_document.events_run_task[0].json
}

resource "aws_cloudwatch_event_rule" "schedule" {
  count = var.service_mode == "scheduled" ? 1 : 0

  name                = "${local.name_prefix}-schedule"
  schedule_expression = var.schedule_expression
  state               = "ENABLED"

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-schedule"
  })
}

resource "aws_cloudwatch_event_target" "ecs" {
  count = var.service_mode == "scheduled" ? 1 : 0

  rule     = aws_cloudwatch_event_rule.schedule[0].name
  arn      = var.cluster_arn
  role_arn = aws_iam_role.events[0].arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.this.arn
    launch_type         = "FARGATE"

    network_configuration {
      subnets          = var.subnet_ids
      security_groups  = var.security_group_ids
      assign_public_ip = var.assign_public_ip
    }
  }
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}

output "task_definition_arn" {
  description = "ECS task definition ARN."
  value       = aws_ecs_task_definition.this.arn
}

output "service_name" {
  description = "ECS service name when service_mode is service."
  value       = try(aws_ecs_service.this[0].name, null)
}

output "service_arn" {
  description = "ECS service ARN when service_mode is service."
  value       = try(aws_ecs_service.this[0].id, null)
}

output "managed_secret_arns" {
  description = "Managed empty Secrets Manager secret ARNs by environment variable name."
  value       = local.managed_secret_arns
}
