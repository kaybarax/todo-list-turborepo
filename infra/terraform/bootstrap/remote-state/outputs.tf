output "state_bucket_name" {
  description = "S3 bucket name for Terraform remote state."
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_arn" {
  description = "S3 bucket ARN for Terraform remote state."
  value       = aws_s3_bucket.state.arn
}

output "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  value       = aws_dynamodb_table.locks.name
}

output "lock_table_arn" {
  description = "DynamoDB table ARN for Terraform state locking."
  value       = aws_dynamodb_table.locks.arn
}

output "kms_key_arn" {
  description = "KMS key ARN used to encrypt Terraform state."
  value       = aws_kms_key.state.arn
}

output "kms_key_alias" {
  description = "KMS alias used to encrypt Terraform state."
  value       = aws_kms_alias.state.name
}

output "state_access_policy_arn" {
  description = "IAM policy ARN to attach to GitHub Actions OIDC roles and trusted operator roles."
  value       = aws_iam_policy.state_access.arn
}
