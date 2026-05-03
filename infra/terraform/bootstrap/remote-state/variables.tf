variable "project" {
  description = "Project name used for resource naming and tags."
  type        = string
  default     = "todo-list"
}

variable "environment" {
  description = "Environment that owns this state backend."
  type        = string
  default     = "shared"

  validation {
    condition     = contains(["shared", "dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of shared, dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region where the state backend resources are created."
  type        = string
  default     = "eu-central-1"
}

variable "bucket_name" {
  description = "Optional explicit globally unique S3 bucket name. Defaults to <project>-<environment>-<account-id>-terraform-state."
  type        = string
  default     = null

  validation {
    condition     = var.bucket_name == null || can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.bucket_name))
    error_message = "bucket_name must be a valid S3 bucket name when set."
  }
}

variable "lock_table_name" {
  description = "Optional explicit DynamoDB lock table name. Defaults to <project>-<environment>-terraform-locks."
  type        = string
  default     = null
}

variable "kms_alias_name" {
  description = "Optional explicit KMS alias name. Defaults to alias/<project>-<environment>-terraform-state."
  type        = string
  default     = null

  validation {
    condition     = var.kms_alias_name == null || startswith(var.kms_alias_name, "alias/")
    error_message = "kms_alias_name must start with alias/ when set."
  }
}

variable "state_access_principal_arns" {
  description = "IAM role/user ARNs allowed to read and write Terraform state, typically GitHub Actions OIDC roles and trusted human operator roles."
  type        = list(string)

  validation {
    condition     = length(var.state_access_principal_arns) > 0
    error_message = "state_access_principal_arns must include at least one trusted principal ARN."
  }
}

variable "state_admin_principal_arns" {
  description = "Additional IAM role/user ARNs allowed to administer the KMS key and backend resources. The current account root is always included for KMS recovery."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags to merge with the standard Terraform tags."
  type        = map(string)
  default     = {}
}
