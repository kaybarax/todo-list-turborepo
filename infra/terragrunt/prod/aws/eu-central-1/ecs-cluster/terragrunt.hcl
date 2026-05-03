include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env_config        = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  env               = local.env_config.locals
  project_secret_id = "arn:aws:secretsmanager:${local.env.aws_region}:${local.env.aws_account_id}:secret:todo-list/${local.env.environment}/*"
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-ecs-cluster"
}

inputs = {
  services = [
    "api",
    "ingestion",
  ]

  execution_role_secret_arns = {
    api       = [local.project_secret_id]
    ingestion = [local.project_secret_id]
  }
}
