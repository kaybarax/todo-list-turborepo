locals {
  env_config = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/github-environments"
}

inputs = {
  environment_names = [local.env_config.locals.github_environment]
}
