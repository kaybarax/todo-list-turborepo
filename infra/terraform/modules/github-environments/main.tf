terraform {
  required_version = ">= 1.9.0"
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

variable "project" {
  description = "Project name used for naming and labels."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "github_owner" {
  description = "GitHub organization or user that owns the repository."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
}

variable "environment_names" {
  description = "GitHub Environments managed by this module."
  type        = set(string)
  default     = []
}

variable "reviewer_users" {
  description = "List of GitHub user IDs required for approval."
  type        = list(number)
  default     = []
}

variable "tags" {
  description = "Common labels represented as a map for consistency with AWS modules."
  type        = map(string)
  default     = {}
}

resource "github_repository_environment" "env" {
  for_each    = toset(var.environment_names)
  repository  = var.github_repository
  environment = each.key

  dynamic "reviewers" {
    for_each = length(var.reviewer_users) > 0 ? [1] : []
    content {
      users = var.reviewer_users
    }
  }

  deployment_branch_policy {
    protected_branches     = true
    custom_branch_policies = false
  }
}

locals {
  module_name = "github-environments"
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}
