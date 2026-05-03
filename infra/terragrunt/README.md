# Terragrunt Live Configuration

Terragrunt owns environment-specific values and points each live unit at a reusable module in `infra/terraform/modules`.

## Prerequisites

- Install the pinned versions in `.terraform-version`, `.terragrunt-version`, and `.terraform-docs-version`.
- Authenticate to AWS and GitHub with the account/environment you intend to manage.
- Export the environment account ID before planning or applying:

```sh
export AWS_ACCOUNT_ID_DEV=123456789012
export AWS_ACCOUNT_ID_STAGING=234567890123
export AWS_ACCOUNT_ID_PROD=345678901234
export ROUTE53_ZONE_ID_DEV=Z000000000000000000DEV
export ROUTE53_ZONE_ID_STAGING=Z00000000000000STAGING
export ROUTE53_ZONE_ID_PROD=Z00000000000000000PROD
export API_DOMAIN_NAME_DEV=api.dev.todo.example.com
export API_DOMAIN_NAME_STAGING=api.staging.todo.example.com
export API_DOMAIN_NAME_PROD=api.todo.example.com
export GITHUB_OWNER=your-org
export GITHUB_REPOSITORY_NAME=todo-list-turborepo
```

## AWS Environment Assumptions

- Region is `eu-central-1` for all live environments unless `env.hcl` is changed.
- `dev`, `staging`, and `prod` are modeled as separate AWS accounts through `AWS_ACCOUNT_ID_DEV`, `AWS_ACCOUNT_ID_STAGING`, and `AWS_ACCOUNT_ID_PROD`.
- Each environment has a named workload identity in `env.hcl`: `todo-list-dev-github-actions`, `todo-list-staging-github-actions`, and `todo-list-prod-github-actions`.
- If a Route 53 hosted zone ID and API domain name are set, the ALB module creates DNS records and a DNS-validated ACM certificate. If `ACM_CERTIFICATE_ARN_*` is set, that existing certificate is used instead.
- ECR is intentionally created as `todo-api` and `todo-ingestion`; using separate AWS accounts avoids repository name conflicts between environments.
- API and ingestion ECS services reference a `bootstrap` image tag initially. Push that tag after ECR is applied, then deploy workflows should move services to immutable image digests.
- API service secrets such as `JWT_SECRET`, `CORS_ORIGIN`, and blockchain credentials are created as empty Secrets Manager entries by Terraform; set their values before starting ECS services.

## Database Restore Runbook

1. Identify the DocumentDB cluster snapshot to restore from in the AWS console or with `aws docdb describe-db-cluster-snapshots`.
2. Restore the snapshot into a new cluster in the same VPC database subnet group and database security group.
3. Validate application compatibility against the restored cluster from a one-off ECS task in private subnets.
4. Update the `todo-list/<env>/database/MONGODB_URI` Secrets Manager value to point at the restored endpoint.
5. Force a new deployment of the API and ingestion ECS services so tasks reload the secret.
6. Keep the previous cluster until smoke tests and ingestion checks pass, then remove it through a reviewed Terraform change or documented break-glass cleanup.

Bootstrap the remote state backend first, then export its outputs before running any Terragrunt command:

```sh
cd infra/terraform/bootstrap/remote-state
terraform init
terraform apply

export TG_STATE_BUCKET="$(terraform output -raw state_bucket_name)"
export TG_STATE_LOCK_TABLE="$(terraform output -raw lock_table_name)"
export TG_STATE_KMS_KEY_ID="$(terraform output -raw kms_key_arn)"
```

## Plan

Run plans from the live directory for the environment and provider you are changing.

```sh
cd infra/terragrunt/dev/aws/eu-central-1
terragrunt run-all plan
```

```sh
cd infra/terragrunt/dev/github
terragrunt run-all plan
```

Repeat the same pattern for staging or production:

```sh
cd infra/terragrunt/staging/aws/eu-central-1
terragrunt run-all plan
```

```sh
cd infra/terragrunt/prod/github
terragrunt run-all plan
```

## Apply

Apply only after reviewing the matching plan output. Apply one environment and provider area at a time.

```sh
cd infra/terragrunt/dev/aws/eu-central-1
terragrunt run-all apply
```

```sh
cd infra/terragrunt/dev/github
terragrunt run-all apply
```

For production, use the same commands under `infra/terragrunt/prod/...` after the production approval gate has passed.

## Promotion

Promote changes in this order:

1. Merge the Terraform module change and the `dev` Terragrunt input change in the same pull request.
2. Run and review `terragrunt run-all plan` for `dev`.
3. Apply `dev`.
4. Copy the reviewed input change from `infra/terragrunt/dev/env.hcl` or the relevant dev live unit into `infra/terragrunt/staging`.
5. Run and review the staging plan, then apply staging.
6. Copy the same reviewed input change into `infra/terragrunt/prod`.
7. Run and review the production plan.
8. Apply production only after the required production approval.

Do not promote by editing reusable Terraform modules differently per environment. If behavior differs by environment, expose it as a typed module input and set the value in the matching Terragrunt live configuration.
