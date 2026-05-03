locals {
  environment        = "prod"
  github_environment = "production"
  aws_region         = "eu-central-1"
  aws_account_id     = get_env("AWS_ACCOUNT_ID_PROD", "")
  workload_identity  = "todo-list-prod-github-actions"

  route53_zone_id     = get_env("ROUTE53_ZONE_ID_PROD", "")
  api_domain_name     = get_env("API_DOMAIN_NAME_PROD", "")
  acm_certificate_arn = get_env("ACM_CERTIFICATE_ARN_PROD", "")

  network = {
    vpc_cidr              = "10.42.0.0/16"
    public_subnet_cidrs   = ["10.42.0.0/20", "10.42.16.0/20"]
    private_subnet_cidrs  = ["10.42.64.0/20", "10.42.80.0/20"]
    database_subnet_cidrs = ["10.42.128.0/20", "10.42.144.0/20"]
    enable_nat_gateway    = true
    single_nat_gateway    = false
    enable_vpc_endpoints  = true
  }

  ecs_services = {
    api = {
      cpu           = 1024
      memory        = 2048
      desired_count = 2
      min_capacity  = 2
      max_capacity  = 6
    }

    ingestion = {
      cpu           = 512
      memory        = 1024
      desired_count = 1
      min_capacity  = 1
      max_capacity  = 2
    }
  }

  database = {
    provider              = "documentdb"
    instance_class        = "db.r6g.large"
    instance_count        = 2
    backup_retention_days = 14
    deletion_protection   = true
    skip_final_snapshot   = false
  }

  redis = {
    node_type                  = "cache.t4g.small"
    num_cache_clusters         = 2
    automatic_failover_enabled = true
    multi_az_enabled           = true
    snapshot_retention_limit   = 14
  }

  tags = {
    service = "shared"
  }
}
