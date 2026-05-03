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
    private_subnet_ids = ["subnet-44444444444444444", "subnet-55555555555555555"]
    security_group_ids = {
      redis = "sg-44444444444444444"
    }
  }
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-redis"
}

inputs = {
  subnet_ids                 = dependency.network.outputs.private_subnet_ids
  security_group_ids         = [dependency.network.outputs.security_group_ids.redis]
  node_type                  = local.env.redis.node_type
  num_cache_clusters         = local.env.redis.num_cache_clusters
  automatic_failover_enabled = local.env.redis.automatic_failover_enabled
  multi_az_enabled           = local.env.redis.multi_az_enabled
  snapshot_retention_limit   = local.env.redis.snapshot_retention_limit
}
