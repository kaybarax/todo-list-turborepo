locals {
  account_config = read_terragrunt_config(find_in_parent_folders("account.hcl"))
  env_config     = read_terragrunt_config(find_in_parent_folders("env.hcl"))

  account = local.account_config.locals
  env     = local.env_config.locals
  project = "todo-list"

  common_tags = merge(
    {
      app         = local.project
      environment = local.env.environment
      managed_by  = "terraform"
    },
    local.env.tags
  )
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
