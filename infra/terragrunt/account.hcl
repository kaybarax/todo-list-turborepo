locals {
  account_name      = "todo-list"
  github_owner      = get_env("GITHUB_OWNER", "todo-org")
  github_repository = get_env("GITHUB_REPOSITORY_NAME", "todo-list-turborepo")
}
