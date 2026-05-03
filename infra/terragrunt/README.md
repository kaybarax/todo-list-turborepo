# Terragrunt Live Configuration

Terragrunt owns environment-specific values and points each live unit at a reusable module in `infra/terraform/modules`.

## Prerequisites

- Install the pinned versions in `.terraform-version` and `.terragrunt-version`.
- Authenticate to AWS and GitHub with the account/environment you intend to manage.
- Export the environment account ID before planning or applying:

```sh
export AWS_ACCOUNT_ID_DEV=123456789012
export AWS_ACCOUNT_ID_STAGING=234567890123
export AWS_ACCOUNT_ID_PROD=345678901234
export GITHUB_OWNER=your-org
export GITHUB_REPOSITORY_NAME=todo-list-turborepo
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
