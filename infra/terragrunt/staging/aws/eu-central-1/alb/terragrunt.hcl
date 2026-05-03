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
    vpc_id            = "vpc-00000000000000000"
    public_subnet_ids = ["subnet-00000000000000000", "subnet-11111111111111111"]
    security_group_ids = {
      alb = "sg-00000000000000000"
    }
  }
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-alb"
}

inputs = {
  vpc_id                     = dependency.network.outputs.vpc_id
  public_subnet_ids          = dependency.network.outputs.public_subnet_ids
  security_group_id          = dependency.network.outputs.security_group_ids.alb
  api_container_port         = 3001
  api_health_check_path      = "/api/v1/health"
  hosted_zone_id             = local.env.route53_zone_id
  domain_name                = local.env.api_domain_name
  certificate_arn            = local.env.acm_certificate_arn
  enable_deletion_protection = local.env.environment == "prod"
}
