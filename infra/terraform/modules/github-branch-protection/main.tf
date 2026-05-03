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

locals {
  module_name = "github-branch-protection"
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}
