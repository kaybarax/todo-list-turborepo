include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env_config = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  env        = local.env_config.locals
  service    = local.env.ecs_services.ingestion
}

dependency "network" {
  config_path = "../network"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    private_subnet_ids = ["subnet-44444444444444444", "subnet-55555555555555555"]
    security_group_ids = {
      ingestion = "sg-66666666666666666"
    }
  }
}

dependency "ecr" {
  config_path = "../ecr"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    repository_urls = {
      todo-ingestion = "000000000000.dkr.ecr.eu-central-1.amazonaws.com/todo-ingestion"
    }
  }
}

dependency "ecs_cluster" {
  config_path = "../ecs-cluster"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    cluster_arn  = "arn:aws:ecs:eu-central-1:000000000000:cluster/todo-list-staging-ecs"
    cluster_name = "todo-list-staging-ecs"
    log_group_names = {
      ingestion = "/aws/ecs/todo-list-staging/ingestion"
    }
    execution_role_arns = {
      ingestion = "arn:aws:iam::000000000000:role/todo-list-staging-ingestion-exec"
    }
    task_role_arns = {
      ingestion = "arn:aws:iam::000000000000:role/todo-list-staging-ingestion-task"
    }
    task_role_names = {
      ingestion = "todo-list-staging-ingestion-task"
    }
  }
}

dependency "alb" {
  config_path = "../alb"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    api_url = "http://todo-list-staging-api.eu-central-1.elb.amazonaws.com"
  }
}

dependency "database" {
  config_path = "../database"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    mongodb_uri_secret_arn = "arn:aws:secretsmanager:eu-central-1:000000000000:secret:todo-list/staging/database/MONGODB_URI"
  }
}

dependency "redis" {
  config_path = "../redis"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    redis_uri_secret_arn = "arn:aws:secretsmanager:eu-central-1:000000000000:secret:todo-list/staging/redis/REDIS_URI"
  }
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-ecs-service"
}

inputs = {
  service            = "ingestion"
  cluster_arn        = dependency.ecs_cluster.outputs.cluster_arn
  cluster_name       = dependency.ecs_cluster.outputs.cluster_name
  image              = format("%s:bootstrap", dependency.ecr.outputs.repository_urls["todo-ingestion"])
  cpu                = local.service.cpu
  memory             = local.service.memory
  container_port     = null
  desired_count      = local.service.desired_count
  subnet_ids         = dependency.network.outputs.private_subnet_ids
  security_group_ids = [dependency.network.outputs.security_group_ids.ingestion]
  execution_role_arn = dependency.ecs_cluster.outputs.execution_role_arns.ingestion
  task_role_arn      = dependency.ecs_cluster.outputs.task_role_arns.ingestion
  task_role_name     = dependency.ecs_cluster.outputs.task_role_names.ingestion
  log_group_name     = dependency.ecs_cluster.outputs.log_group_names.ingestion
  service_mode       = "service"

  environment_variables = {
    NODE_ENV          = local.env.environment == "prod" ? "production" : "development"
    API_URL           = dependency.alb.outputs.api_url
    TELEMETRY_ENABLED = "true"
  }

  secret_arns = {
    MONGODB_URI = dependency.database.outputs.mongodb_uri_secret_arn
    REDIS_URI   = dependency.redis.outputs.redis_uri_secret_arn
  }

  managed_secret_names = [
    "BLOCKCHAIN_RPC_URL",
    "BLOCKCHAIN_PRIVATE_KEY",
  ]

  autoscaling_enabled      = local.service.max_capacity > local.service.min_capacity
  autoscaling_min_capacity = local.service.min_capacity
  autoscaling_max_capacity = local.service.max_capacity
}
