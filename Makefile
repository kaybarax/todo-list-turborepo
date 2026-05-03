COLIMA_DEPLOY ?= /Users/kevin/workspace/scripts/colima-build-push-deploy.sh
REGISTRY ?= localhost:5050
NAMESPACE ?= $(shell ns=$$(kubectl config view --minify --output 'jsonpath={..namespace}' 2>/dev/null); printf '%s' "$${ns:-default}")
TAG ?= dev
TERRAFORM_MODULE_DIRS := $(shell find infra/terraform -type f -name '*.tf' -exec dirname {} \; 2>/dev/null | sort -u)

.PHONY: help colima-deploy colima-deploy-web colima-deploy-api colima-deploy-mobile-web colima-registry colima-urls terraform-fmt terraform-validate terragrunt-hclfmt tflint infra-iac-fmt infra-iac-check

help:
	@echo "Colima targets:"
	@echo "  make colima-deploy-web         Build, push, and deploy the Next.js web app"
	@echo "  make colima-deploy-api         Build, push, and deploy the NestJS API"
	@echo "  make colima-deploy-mobile-web  Build, push, and deploy the Expo web export"
	@echo "  make colima-registry           Show local registry catalog"
	@echo ""
	@echo "Common overrides:"
	@echo "  TAG=dev|sha  NAMESPACE=colima-demo  REGISTRY=localhost:5050"
	@echo ""
	@echo "IaC targets:"
	@echo "  make terraform-fmt             Run terraform fmt recursively under infra/terraform"
	@echo "  make terraform-validate        Initialize and validate Terraform modules"
	@echo "  make terragrunt-hclfmt         Format Terragrunt HCL under infra/terragrunt"
	@echo "  make tflint                    Run TFLint recursively under infra/terraform"
	@echo "  make infra-iac-check           Run Terraform validate and TFLint"

colima-deploy: colima-deploy-web

colima-deploy-web:
	APP=todo-web \
	TAG=$(TAG) \
	REGISTRY=$(REGISTRY) \
	NAMESPACE=$(NAMESPACE) \
	CONTEXT=. \
	DOCKERFILE=apps/web/Dockerfile \
	PORT=3000 \
	INGRESS_HOST=todo-web.localhost \
	$(COLIMA_DEPLOY)

colima-deploy-api:
	APP=todo-api \
	TAG=$(TAG) \
	REGISTRY=$(REGISTRY) \
	NAMESPACE=$(NAMESPACE) \
	CONTEXT=. \
	DOCKERFILE=apps/api/Dockerfile \
	PORT=3001 \
	INGRESS_HOST=todo-api.localhost \
	$(COLIMA_DEPLOY)

colima-deploy-mobile-web:
	APP=todo-mobile-web \
	TAG=$(TAG) \
	REGISTRY=$(REGISTRY) \
	NAMESPACE=$(NAMESPACE) \
	CONTEXT=. \
	DOCKERFILE=apps/mobile/Dockerfile \
	BUILD_TARGET=web-production \
	PORT=80 \
	INGRESS_HOST=todo-mobile.localhost \
	$(COLIMA_DEPLOY)

colima-registry:
	curl -fsS http://$(REGISTRY)/v2/_catalog

colima-urls:
	@echo "web:        https://todo-web.localhost:30443/"
	@echo "api:        https://todo-api.localhost:30443/"
	@echo "mobile web: https://todo-mobile.localhost:30443/"

terraform-fmt:
	@if ! command -v terraform >/dev/null 2>&1; then echo "terraform is not installed"; exit 1; fi
	terraform fmt -recursive infra/terraform

terraform-validate:
	@if ! command -v terraform >/dev/null 2>&1; then echo "terraform is not installed"; exit 1; fi
	@for dir in $(TERRAFORM_MODULE_DIRS); do \
		echo "terraform validate $$dir"; \
		terraform -chdir=$$dir init -backend=false -input=false >/dev/null; \
		terraform -chdir=$$dir validate; \
	done

terragrunt-hclfmt:
	@if ! command -v terragrunt >/dev/null 2>&1; then echo "terragrunt is not installed"; exit 1; fi
	cd infra/terragrunt && terragrunt hclfmt

tflint:
	@if ! command -v tflint >/dev/null 2>&1; then echo "tflint is not installed"; exit 1; fi
	cd infra/terraform && tflint --recursive

infra-iac-fmt: terraform-fmt terragrunt-hclfmt

infra-iac-check: terraform-validate tflint
