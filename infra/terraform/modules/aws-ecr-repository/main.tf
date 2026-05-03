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

variable "repositories" {
  description = "ECR repositories to create."
  type        = list(string)
  default     = ["todo-api", "todo-ingestion"]
}

variable "image_tag_mutability" {
  description = "ECR tag mutability setting."
  type        = string
  default     = "IMMUTABLE"

  validation {
    condition     = contains(["MUTABLE", "IMMUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be MUTABLE or IMMUTABLE."
  }
}

variable "scan_on_push" {
  description = "Whether ECR scans images when pushed."
  type        = bool
  default     = true
}

variable "lifecycle_max_tagged_images" {
  description = "Maximum tagged images retained per repository."
  type        = number
  default     = 50
}

variable "lifecycle_max_untagged_days" {
  description = "Number of days to retain untagged images."
  type        = number
  default     = 14
}

locals {
  module_name = "aws-ecr-repository"
  tags        = merge(var.tags, { managed_by = "terraform" })
}

resource "aws_ecr_repository" "this" {
  for_each = toset(var.repositories)

  name                 = each.value
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.tags, {
    Name    = each.value
    service = replace(each.value, "todo-", "")
  })
}

resource "aws_ecr_lifecycle_policy" "this" {
  for_each = aws_ecr_repository.this

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after ${var.lifecycle_max_untagged_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.lifecycle_max_untagged_days
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Retain the latest ${var.lifecycle_max_tagged_images} tagged images"
        selection = {
          tagStatus   = "tagged"
          tagPrefixList = [
            "sha-",
            "v",
            "release-"
          ]
          countType   = "imageCountMoreThan"
          countNumber = var.lifecycle_max_tagged_images
        }
        action = {
          type = "expire"
        }
      }
    ]
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

output "repository_urls" {
  description = "Repository URLs by repository name."
  value       = { for name, repo in aws_ecr_repository.this : name => repo.repository_url }
}

output "repository_arns" {
  description = "Repository ARNs by repository name."
  value       = { for name, repo in aws_ecr_repository.this : name => repo.arn }
}
