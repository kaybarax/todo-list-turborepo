locals {
  environment        = "dev"
  github_environment = "dev"
  aws_region         = "eu-central-1"
  aws_account_id     = get_env("AWS_ACCOUNT_ID_DEV", "")

  tags = {
    service = "shared"
  }
}
