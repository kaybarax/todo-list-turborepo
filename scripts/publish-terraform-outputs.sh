#!/bin/bash

# Script to publish non-secret Terraform outputs to GitHub Variables
# Usage: terraform output -json | ./scripts/publish-terraform-outputs.sh [environment]

set -euo pipefail

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: $0 <environment>"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "Error: jq is required"
  exit 1
fi

if ! command -v gh &> /dev/null; then
  echo "Error: gh (GitHub CLI) is required"
  exit 1
fi

# Read JSON from stdin
JSON_INPUT=$(cat)

if [ -z "$JSON_INPUT" ] || [ "$JSON_INPUT" == "{}" ]; then
  echo "No Terraform outputs found or empty input."
  exit 0
fi

echo "Publishing Terraform outputs to GitHub Variables for environment: $ENVIRONMENT"

# Iterate over each output
# Note: We only publish outputs that are NOT marked as sensitive in Terraform
echo "$JSON_INPUT" | jq -r 'to_entries[] | select(.value.sensitive == false) | "\(.key)=\(.value.value)"' | while read -r line; do
  KEY=$(echo "$line" | cut -d'=' -f1)
  VALUE=$(echo "$line" | cut -d'=' -f2-)
  
  # Map Terraform output names to GitHub Variable names if needed
  # Example: api_ecr_repository_url -> API_ECR_REPOSITORY_URL
  VAR_NAME=$(echo "$KEY" | tr '[:lower:]' '[:upper:]')
  
  echo "  Setting $VAR_NAME..."
  
  # Set the variable in GitHub for the specific environment
  # If you want repository-wide variables, remove --env "$ENVIRONMENT"
  gh variable set "$VAR_NAME" --body "$VALUE" --env "$ENVIRONMENT"
done

echo "✅ Successfully published Terraform outputs to GitHub Variables."
