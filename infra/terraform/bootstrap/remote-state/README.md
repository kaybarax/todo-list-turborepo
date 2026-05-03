# Terraform Remote State Bootstrap

This standalone Terraform root creates the AWS backend resources that Terragrunt uses before any app infrastructure is managed:

- S3 bucket for encrypted, versioned state.
- DynamoDB table for Terraform state locks.
- KMS key and alias for state encryption.
- Bucket policy and IAM policy scoped to GitHub Actions OIDC roles and trusted human operator roles.

Run this root with local state first, then export its outputs for Terragrunt.

```sh
cd infra/terraform/bootstrap/remote-state
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply
terraform output
```

Use the outputs with the live Terragrunt configuration:

```sh
export TG_STATE_BUCKET="$(terraform output -raw state_bucket_name)"
export TG_STATE_LOCK_TABLE="$(terraform output -raw lock_table_name)"
export TG_STATE_KMS_KEY_ID="$(terraform output -raw kms_key_arn)"
```

Attach `state_access_policy_arn` to the GitHub Actions OIDC roles and trusted operator roles listed in `state_access_principal_arns`.
