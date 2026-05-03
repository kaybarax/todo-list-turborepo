locals {
  environment        = "staging"
  github_environment = "staging"
  aws_region         = "eu-central-1"
  aws_account_id     = get_env("AWS_ACCOUNT_ID_STAGING", "")
  workload_identity  = "todo-list-staging-github-actions"

  route53_zone_id     = get_env("ROUTE53_ZONE_ID_STAGING", "")
  api_domain_name     = get_env("API_DOMAIN_NAME_STAGING", "")
  acm_certificate_arn = get_env("ACM_CERTIFICATE_ARN_STAGING", "")

  network = {
    vpc_cidr              = "10.41.0.0/16"
    public_subnet_cidrs   = ["10.41.0.0/20", "10.41.16.0/20"]
    private_subnet_cidrs  = ["10.41.64.0/20", "10.41.80.0/20"]
    database_subnet_cidrs = ["10.41.128.0/20", "10.41.144.0/20"]
    enable_nat_gateway    = true
    single_nat_gateway    = true
    enable_vpc_endpoints  = true
  }

  ecs_services = {
    api = {
      cpu           = 512
      memory        = 1024
      desired_count = 1
      min_capacity  = 1
      max_capacity  = 3
    }

    ingestion = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      min_capacity  = 1
      max_capacity  = 1
    }
  }

  database = {
    provider              = "documentdb"
    instance_class        = "db.t4g.medium"
    instance_count        = 1
    backup_retention_days = 7
    deletion_protection   = true
    skip_final_snapshot   = false
  }

  redis = {
    node_type                  = "cache.t4g.micro"
    num_cache_clusters         = 1
    automatic_failover_enabled = false
    multi_az_enabled           = false
    snapshot_retention_limit   = 7
  }

  tags = {
    service = "shared"
  }
}
