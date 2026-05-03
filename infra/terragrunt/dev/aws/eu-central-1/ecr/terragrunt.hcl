include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/aws-ecr-repository"
}

inputs = {
  repositories = [
    "todo-api",
    "todo-ingestion",
  ]
}
