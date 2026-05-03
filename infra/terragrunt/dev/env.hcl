locals {
  environment        = "dev"
  github_environment = "dev"
  aws_region         = "eu-central-1"
  aws_account_id     = get_env("AWS_ACCOUNT_ID_DEV", "")
  workload_identity  = "todo-list-dev-github-actions"

  route53_zone_id     = get_env("ROUTE53_ZONE_ID_DEV", "")
  api_domain_name     = get_env("API_DOMAIN_NAME_DEV", "")
  acm_certificate_arn = get_env("ACM_CERTIFICATE_ARN_DEV", "")

  network = {
    vpc_cidr              = "10.40.0.0/16"
    public_subnet_cidrs   = ["10.40.0.0/20", "10.40.16.0/20"]
    private_subnet_cidrs  = ["10.40.64.0/20", "10.40.80.0/20"]
    database_subnet_cidrs = ["10.40.128.0/20", "10.40.144.0/20"]
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
      max_capacity  = 2
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
    backup_retention_days = 3
    deletion_protection   = false
    skip_final_snapshot   = true
  }

  redis = {
    node_type                  = "cache.t4g.micro"
    num_cache_clusters         = 1
    automatic_failover_enabled = false
    multi_az_enabled           = false
    snapshot_retention_limit   = 3
  }

  tags = {
    service = "shared"
  }
}
