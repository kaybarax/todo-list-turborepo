terraform {
  required_version = ">= 1.9.0"
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
}

variable "tags" {
  description = "Common tags to apply to resources."
  type        = map(string)
  default     = {}
}

locals {
  module_name = "aws-documentdb-or-atlas"
  tags        = merge(var.tags, { managed_by = "terraform" })
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}
