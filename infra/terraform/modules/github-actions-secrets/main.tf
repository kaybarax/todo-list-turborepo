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

variable "secret_names" {
  description = "Names of GitHub Actions secrets managed by this module."
  type        = set(string)
  default     = []
}

variable "tags" {
  description = "Common labels represented as a map for consistency with AWS modules."
  type        = map(string)
  default     = {}
}

locals {
  module_name = "github-actions-secrets"
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}
