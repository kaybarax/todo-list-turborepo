#!/bin/bash

# Quick build script for development
# Skips Docker images, contracts, and tests for faster iteration

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Starting quick build for development..."

# Build only packages and applications
print_status "Building shared packages..."
pnpm turbo run build --filter="@todo/utils"
pnpm turbo run build --filter="./packages/*" --parallel

print_status "Building applications..."
pnpm turbo run build --filter="./apps/*" --parallel

print_success "Quick build completed successfully!"
print_status "To run full build with tests and Docker: ./scripts/build.sh"