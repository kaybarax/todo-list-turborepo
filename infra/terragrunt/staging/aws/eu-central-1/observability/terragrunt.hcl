include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "alb" {
  config_path = "../alb"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    alb_arn_suffix              = "app/todo-list-staging-api/0000000000000000"
    api_target_group_arn_suffix = "targetgroup/todo-list-staging-api/0000000000000000"
  }
}

dependency "ecs_cluster" {
  config_path = "../ecs-cluster"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    cluster_name = "todo-list-staging-ecs"
  }
}

dependency "api_service" {
  config_path = "../api-service"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    service_name = "todo-list-staging-api"
  }
}

dependency "ingestion_service" {
  config_path = "../ingestion-service"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    service_name = "todo-list-staging-ingestion"
  }
}

dependency "database" {
  config_path = "../database"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    cluster_identifier = "todo-list-staging-docdb"
  }
}

dependency "redis" {
  config_path = "../redis"

  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
  mock_outputs = {
    replication_group_id = "todo-list-staging-redis"
  }
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-observability"
}

inputs = {
  ecs_cluster_name  = dependency.ecs_cluster.outputs.cluster_name
  ecs_service_names = [dependency.api_service.outputs.service_name, dependency.ingestion_service.outputs.service_name]
  ecs_service_min_running_tasks = {
    (dependency.api_service.outputs.service_name)       = 1
    (dependency.ingestion_service.outputs.service_name) = 1
  }
  alb_arn_suffix                = dependency.alb.outputs.alb_arn_suffix
  api_target_group_arn_suffix   = dependency.alb.outputs.api_target_group_arn_suffix
  documentdb_cluster_identifier = dependency.database.outputs.cluster_identifier
  redis_replication_group_id    = dependency.redis.outputs.replication_group_id
}
