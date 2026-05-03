# Terraform Modules

This directory contains reusable Terraform modules. Keep modules provider-specific and environment-agnostic:

- `aws-*` modules own AWS resources only.
- `github-*` modules own GitHub resources only.
- Environment names, account IDs, repository names, regions, CIDRs, and secrets stay in `infra/terragrunt`.
- Modules should expose typed inputs and outputs instead of reading environment-specific files directly.

The current module files are intentionally minimal scaffolds for the IaC layout. Add resources inside the matching provider-specific module as each infrastructure layer is implemented.
