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

variable "tags" {
  description = "Common labels represented as a map for consistency with AWS modules."
  type        = map(string)
  default     = {}
}

resource "github_repository" "this" {
  name       = var.github_repository
  visibility = "public" # Or private, depending on the project

  has_issues      = true
  has_projects    = true
  has_wiki        = true
  has_downloads   = true
  
  vulnerability_alerts = true
  
  security_and_analysis {
    secret_scanning {
      status = "enabled"
    }
    secret_scanning_push_protection {
      status = "enabled"
    }
  }

  topics = ["turborepo", "typescript", "nestjs", "blockchain", "security"]
}

locals {
  module_name = "github-repository"
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "repository_full_name" {
  value = github_repository.this.full_name
}
