# Terraform Modules

This directory contains reusable Terraform modules. Keep modules provider-specific and environment-agnostic:

- `aws-*` modules own AWS resources only.
- `github-*` modules own GitHub resources only.
- `bootstrap/remote-state` is a standalone Terraform root used once per state account before Terragrunt-managed infrastructure.
- Environment names, account IDs, repository names, regions, CIDRs, and secrets stay in `infra/terragrunt`.
- Modules should expose typed inputs and outputs instead of reading environment-specific files directly.

The current module files are intentionally minimal scaffolds for the IaC layout. Add resources inside the matching provider-specific module as each infrastructure layer is implemented.

## Providers

Terragrunt generates provider configuration from `infra/terragrunt/root.hcl` for live infrastructure:

- `hashicorp/aws` pinned to `~> 6.43.0`.
- `integrations/github` pinned to `~> 6.12.0`.

The remote-state bootstrap root pins its own AWS provider because it must run before Terragrunt can use the remote backend.

## Tags And Labels

Every Terraform-managed resource should receive this standard metadata through Terragrunt inputs or provider default tags:

- `app = "todo-list"`
- `service = "web" | "api" | "ingestion" | "mobile" | "shared"`
- `environment = "dev" | "staging" | "prod"`
- `managed_by = "terraform"`

Use `service = "shared"` for cross-service infrastructure such as networking, ECR, state, IAM, and observability unless a module is explicitly service-specific.

## Module Docs

Generate module README tables with:

```sh
make terraform-docs
```

The command uses `.terraform-docs.yml` and the version pinned in `.terraform-docs-version`, then injects requirements, providers, resources, inputs, and outputs into each Terraform directory.
