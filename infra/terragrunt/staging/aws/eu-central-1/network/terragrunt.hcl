include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env_config = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  env        = local.env_config.locals
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-network"
}

inputs = {
  vpc_cidr              = local.env.network.vpc_cidr
  public_subnet_cidrs   = local.env.network.public_subnet_cidrs
  private_subnet_cidrs  = local.env.network.private_subnet_cidrs
  database_subnet_cidrs = local.env.network.database_subnet_cidrs
  enable_nat_gateway    = local.env.network.enable_nat_gateway
  single_nat_gateway    = local.env.network.single_nat_gateway
  enable_vpc_endpoints  = local.env.network.enable_vpc_endpoints
  api_container_port    = 3001
}
