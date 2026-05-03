include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env_config = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  env        = local.env_config.locals
}

dependency "network" {
  config_path = "../network"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    database_subnet_ids = ["subnet-22222222222222222", "subnet-33333333333333333"]
    security_group_ids = {
      database = "sg-22222222222222222"
    }
  }
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-documentdb-or-atlas"
}

inputs = {
  database_provider     = local.env.database.provider
  subnet_ids            = dependency.network.outputs.database_subnet_ids
  security_group_ids    = [dependency.network.outputs.security_group_ids.database]
  instance_class        = local.env.database.instance_class
  instance_count        = local.env.database.instance_count
  backup_retention_days = local.env.database.backup_retention_days
  deletion_protection   = local.env.database.deletion_protection
  skip_final_snapshot   = local.env.database.skip_final_snapshot
}
