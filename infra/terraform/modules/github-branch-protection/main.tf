terraform {
  required_version = ">= 1.9.0"
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

variable "protected_branches" {
  description = "Repository branches managed by this module."
  type        = set(string)
  default     = ["main"]
}

variable "tags" {
  description = "Common labels represented as a map for consistency with AWS modules."
  type        = map(string)
  default     = {}
}

resource "github_branch_protection" "main" {
  for_each      = var.protected_branches
  repository_id = var.github_repository
  pattern       = each.value

  enforce_admins = true

  required_pull_request_reviews {
    dismiss_stale_reviews           = true
    required_approving_review_count = 1
    require_code_owner_reviews      = true
  }

  required_status_checks {
    strict   = true
    contexts = ["build", "lint", "typecheck", "test"] # Generic names, should match GHA jobs
  }

  allows_force_pushes = false
  allows_deletions    = false
}

locals {
  module_name = "github-branch-protection"
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}
