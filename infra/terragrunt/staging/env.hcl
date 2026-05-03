locals {
  environment        = "staging"
  github_environment = "staging"
  aws_region         = "eu-central-1"
  aws_account_id     = get_env("AWS_ACCOUNT_ID_STAGING", "")

  tags = {
    service = "shared"
  }
}
