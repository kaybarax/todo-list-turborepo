include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  env_config = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  env        = local.env_config.locals
  service    = local.env.ecs_services.api
}

dependency "network" {
  config_path = "../network"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    private_subnet_ids = ["subnet-44444444444444444", "subnet-55555555555555555"]
    security_group_ids = {
      api = "sg-55555555555555555"
    }
  }
}

dependency "ecr" {
  config_path = "../ecr"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    repository_urls = {
      todo-api = "000000000000.dkr.ecr.eu-central-1.amazonaws.com/todo-api"
    }
  }
}

dependency "ecs_cluster" {
  config_path = "../ecs-cluster"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    cluster_arn  = "arn:aws:ecs:eu-central-1:000000000000:cluster/todo-list-dev-ecs"
    cluster_name = "todo-list-dev-ecs"
    log_group_names = {
      api = "/aws/ecs/todo-list-dev/api"
    }
    execution_role_arns = {
      api = "arn:aws:iam::000000000000:role/todo-list-dev-api-exec"
    }
    task_role_arns = {
      api = "arn:aws:iam::000000000000:role/todo-list-dev-api-task"
    }
    task_role_names = {
      api = "todo-list-dev-api-task"
    }
  }
}

dependency "alb" {
  config_path = "../alb"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    api_target_group_arn = "arn:aws:elasticloadbalancing:eu-central-1:000000000000:targetgroup/todo-list-dev-api/0000000000000000"
    api_url              = "http://todo-list-dev-api.eu-central-1.elb.amazonaws.com"
  }
}

dependency "database" {
  config_path = "../database"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    mongodb_uri_secret_arn = "arn:aws:secretsmanager:eu-central-1:000000000000:secret:todo-list/dev/database/MONGODB_URI"
  }
}

dependency "redis" {
  config_path = "../redis"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    redis_uri_secret_arn = "arn:aws:secretsmanager:eu-central-1:000000000000:secret:todo-list/dev/redis/REDIS_URI"
  }
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-ecs-service"
}

inputs = {
  service            = "api"
  cluster_arn        = dependency.ecs_cluster.outputs.cluster_arn
  cluster_name       = dependency.ecs_cluster.outputs.cluster_name
  image              = format("%s:bootstrap", dependency.ecr.outputs.repository_urls["todo-api"])
  cpu                = local.service.cpu
  memory             = local.service.memory
  container_port     = 3001
  desired_count      = local.service.desired_count
  subnet_ids         = dependency.network.outputs.private_subnet_ids
  security_group_ids = [dependency.network.outputs.security_group_ids.api]
  execution_role_arn = dependency.ecs_cluster.outputs.execution_role_arns.api
  task_role_arn      = dependency.ecs_cluster.outputs.task_role_arns.api
  task_role_name     = dependency.ecs_cluster.outputs.task_role_names.api
  log_group_name     = dependency.ecs_cluster.outputs.log_group_names.api
  target_group_arn   = dependency.alb.outputs.api_target_group_arn

  environment_variables = {
    NODE_ENV          = local.env.environment == "prod" ? "production" : "development"
    PORT              = "3001"
    TELEMETRY_ENABLED = "true"
  }

  secret_arns = {
    MONGODB_URI = dependency.database.outputs.mongodb_uri_secret_arn
    REDIS_URI   = dependency.redis.outputs.redis_uri_secret_arn
  }

  managed_secret_names = [
    "JWT_SECRET",
    "CORS_ORIGIN",
    "BLOCKCHAIN_RPC_URL",
    "BLOCKCHAIN_PRIVATE_KEY",
  ]

  autoscaling_enabled      = true
  autoscaling_min_capacity = local.service.min_capacity
  autoscaling_max_capacity = local.service.max_capacity
}
