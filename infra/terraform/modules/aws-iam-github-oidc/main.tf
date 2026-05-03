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
  description = "AWS region where IAM-adjacent support resources are deployed."
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
  description = "Common AWS tags to apply to resources."
  type        = map(string)
  default     = {}
}

locals {
  module_name = "aws-iam-github-oidc"
  tags        = merge(var.tags, { managed_by = "terraform" })
  github_url  = "https://token.actions.githubusercontent.com"
}

# OIDC Provider for GitHub Actions
# Note: This is a singleton per account/region. If it already exists, 
# you might need to import it or use a data source.
resource "aws_iam_openid_connect_provider" "github" {
  url             = local.github_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = local.tags
}

# Trust Policy Helper
data "aws_iam_policy_document" "github_oidc_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_owner}/${var.github_repository}:*"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

# Role: Terraform Plan
resource "aws_iam_role" "terraform_plan" {
  name               = "${var.project}-${var.environment}-tf-plan"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_trust.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "terraform_plan_readonly" {
  role       = aws_iam_role.terraform_plan.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Role: Terraform Apply
resource "aws_iam_role" "terraform_apply" {
  name               = "${var.project}-${var.environment}-tf-apply"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_trust.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "terraform_apply_admin" {
  role       = aws_iam_role.terraform_apply.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# Role: API Deploy
resource "aws_iam_role" "api_deploy" {
  name               = "${var.project}-${var.environment}-api-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_trust.json
  tags               = local.tags
}

resource "aws_iam_policy" "api_deploy" {
  name        = "${var.project}-${var.environment}-api-deploy"
  description = "Permissions for API deployment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Effect   = "Allow"
        Resource = "*" # Scoped by ECR login or specific repo ARN if known
      },
      {
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
          "iam:PassRole"
        ]
        Effect   = "Allow"
        Resource = "*" # Scoped to ECS service/task roles if known
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_deploy" {
  role       = aws_iam_role.api_deploy.name
  policy_arn = aws_iam_policy.api_deploy.arn
}

# Role: Ingestion Deploy
resource "aws_iam_role" "ingestion_deploy" {
  name               = "${var.project}-${var.environment}-ingestion-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_oidc_trust.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "ingestion_deploy" {
  role       = aws_iam_role.ingestion_deploy.name
  policy_arn = aws_iam_policy.api_deploy.arn # Reusing same policy as it's similar ECS/ECR
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "terraform_plan_role_arn" {
  value = aws_iam_role.terraform_plan.arn
}

output "terraform_apply_role_arn" {
  value = aws_iam_role.terraform_apply.arn
}

output "api_deploy_role_arn" {
  value = aws_iam_role.api_deploy.arn
}

output "ingestion_deploy_role_arn" {
  value = aws_iam_role.ingestion_deploy.arn
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}
