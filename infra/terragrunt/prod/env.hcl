locals {
  environment        = "prod"
  github_environment = "production"
  aws_region         = "eu-central-1"
  aws_account_id     = get_env("AWS_ACCOUNT_ID_PROD", "")

  tags = {
    service = "shared"
  }
}
