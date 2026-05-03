include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infra/terraform/modules/github-actions-secrets"
}

inputs = {
  secret_names = [
    "AWS_REGION",
    "AWS_ROLE_ARN",
  ]
}
