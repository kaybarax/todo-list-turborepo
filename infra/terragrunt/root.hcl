locals {
  account_config = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  env_config     = read_terragrunt_config(find_in_parent_folders("env.hcl"))

  account = local.account_config.locals
  env     = local.env_config.locals
  project = "todo-list"

  terraform_version       = ">= 1.9.0, < 2.0.0"
  aws_provider_version    = "~> 6.43.0"
  github_provider_version = "~> 6.12.0"

  common_tags = merge(
    {
      app         = local.project
      service     = lookup(local.env.tags, "service", "shared")
      environment = local.env.environment
      managed_by  = "terraform"
    },
    local.env.tags
  )

  state_bucket     = get_env("TG_STATE_BUCKET", "")
  state_lock_table = get_env("TG_STATE_LOCK_TABLE", "")
  state_kms_key_id = get_env("TG_STATE_KMS_KEY_ID", "")
}

remote_state {
  backend = "s3"

  config = {
    bucket         = local.state_bucket
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.env.aws_region
    encrypt        = true
    dynamodb_table = local.state_lock_table
    kms_key_id     = local.state_kms_key_id
  }

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"

  contents = <<EOF
terraform {
  required_version = "${local.terraform_version}"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "${local.aws_provider_version}"
    }

    github = {
      source  = "integrations/github"
      version = "${local.github_provider_version}"
    }
  }
}

provider "aws" {
  region              = "${local.env.aws_region}"
  allowed_account_ids = compact(["${local.env.aws_account_id}"])

  default_tags {
    tags = ${jsonencode(local.common_tags)}
  }
}

provider "github" {
  owner = "${local.account.github_owner}"
}
EOF
}

inputs = {
  project           = local.project
  environment       = local.env.environment
  aws_region        = local.env.aws_region
  aws_account_id    = local.env.aws_account_id
  github_owner      = local.account.github_owner
  github_repository = local.account.github_repository
  tags              = local.common_tags
}
