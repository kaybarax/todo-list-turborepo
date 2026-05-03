#!/bin/bash

# Production build script with optimizations and security checks
# This script is designed for CI/CD pipelines and production deployments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# shellcheck disable=SC2329
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration for production
export ENVIRONMENT="production"
export BUILD_DOCKER="false"
export BUILD_CONTRACTS="true"
export SKIP_TESTS="false"
export PARALLEL_BUILDS="true"
export CLEAN_BUILD="true"

# Security and optimization settings
export NODE_ENV="production"
export NODE_OPTIONS="--max-old-space-size=4096"

print_status "Starting production build process..."

# Validate environment
if [ -z "$VERSION" ]; then
    print_error "VERSION environment variable is required for production builds"
    exit 1
fi

if [ -z "$DOCKER_REGISTRY" ]; then
    print_warning "DOCKER_REGISTRY not set. Images will be built locally only."
fi

# Security checks
print_status "Running security checks..."

# Check for security vulnerabilities
if command -v pnpm &> /dev/null; then
    print_status "Checking for security vulnerabilities..."
    pnpm audit --audit-level moderate || {
        print_error "Security vulnerabilities found. Please fix before production build."
        exit 1
    }
fi

# Check for sensitive files
print_status "Checking for sensitive files..."
if find . -name "*.env" -not -path "./db/.env.example" -not -path "./.env.example" | grep -q .; then
    print_warning "Environment files found. Ensure they don't contain production secrets."
fi

# Lint check
print_status "Running lint checks..."
pnpm turbo run lint || {
    print_error "Lint checks failed. Please fix linting errors before production build."
    exit 1
}

# Type checking
print_status "Running type checks..."
pnpm turbo run typecheck || {
    print_error "Type checking failed. Please fix type errors before production build."
    exit 1
}

# Run the main build script with production settings
print_status "Running main build script..."
./scripts/build.sh \
    --environment production \
    --version "$VERSION" \
    --clean \
    ${DOCKER_REGISTRY:+--registry "$DOCKER_REGISTRY"} \
    ${PUSH_IMAGES:+--push}

# Additional production validations
print_status "Running production validations..."

# Check Docker image sizes
if [ "$BUILD_DOCKER" = "true" ]; then
    print_status "Checking Docker image sizes..."
    
    REGISTRY_PREFIX=""
    if [ -n "$DOCKER_REGISTRY" ]; then
        REGISTRY_PREFIX="$DOCKER_REGISTRY/"
    fi
    
    # Check if images are too large (warning threshold: 1GB)
    for image in "todo-api" "todo-web" "todo-ingestion"; do
        if docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep "${REGISTRY_PREFIX}${image}:${VERSION}" | grep -q "GB"; then
            size=$(docker images --format "{{.Size}}" "${REGISTRY_PREFIX}${image}:${VERSION}")
            print_warning "Large Docker image detected: ${image} (${size})"
        fi
    done
fi

# Verify build artifacts
print_status "Verifying build artifacts..."

# Check if all expected build outputs exist
expected_builds=(
    "apps/api/dist"
    "apps/web/.next"
    "apps/ingestion/dist"
    "packages/ui-web/dist"
    "packages/ui-mobile/dist"
    "packages/services/dist"
)

for build_dir in "${expected_builds[@]}"; do
    if [ ! -d "$build_dir" ]; then
        print_error "Expected build output not found: $build_dir"
        exit 1
    fi
done

# Generate production build manifest
print_status "Generating production build manifest..."
cat > production-build-manifest.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$VERSION",
  "environment": "production",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "pnpmVersion": "$(pnpm --version)",
  "buildHost": "$(hostname)",
  "buildUser": "$(whoami)",
  "dockerRegistry": "${DOCKER_REGISTRY:-local}",
  "images": {
    "api": "${REGISTRY_PREFIX}todo-api:${VERSION}",
    "web": "${REGISTRY_PREFIX}todo-web:${VERSION}",
    "ingestion": "${REGISTRY_PREFIX}todo-ingestion:${VERSION}"
  },
  "checksums": {
EOF

# Add checksums for critical files
if [ -f "apps/api/dist/main.js" ]; then
    echo "    \"api\": \"$(sha256sum apps/api/dist/main.js | cut -d' ' -f1)\"," >> production-build-manifest.json
fi

if [ -f "apps/web/.next/BUILD_ID" ]; then
    echo "    \"web\": \"$(cat apps/web/.next/BUILD_ID)\"," >> production-build-manifest.json
fi

if [ -f "apps/ingestion/dist/main.js" ]; then
    echo "    \"ingestion\": \"$(sha256sum apps/ingestion/dist/main.js | cut -d' ' -f1)\"" >> production-build-manifest.json
fi

cat >> production-build-manifest.json << EOF
  }
}
EOF

print_success "Production build manifest generated: production-build-manifest.json"

# Final security scan on built artifacts
if command -v docker &> /dev/null && [ "$BUILD_DOCKER" = "true" ]; then
    print_status "Running container security scan..."
    
    # Example using Trivy (if available)
    if command -v trivy &> /dev/null; then
        for image in "todo-api" "todo-web" "todo-ingestion"; do
            print_status "Scanning ${REGISTRY_PREFIX}${image}:${VERSION}..."
            trivy image --severity HIGH,CRITICAL "${REGISTRY_PREFIX}${image}:${VERSION}" || {
                print_warning "Security issues found in ${image} image"
            }
        done
    else
        print_warning "Trivy not available. Skipping container security scan."
    fi
fi

print_success "Production build completed successfully!"
print_status "Build artifacts are ready for deployment"

# Display deployment information
echo ""
echo "=== DEPLOYMENT INFORMATION ==="
echo "Version: $VERSION"
echo "Environment: production"
echo "Docker Registry: ${DOCKER_REGISTRY:-local}"
echo "Build Manifest: production-build-manifest.json"
echo ""
echo "Next steps:"
echo "1. Review build manifest and security scan results"
echo "2. Deploy using: ./scripts/deploy.sh --environment production --version $VERSION"
echo "3. Monitor deployment and run smoke tests"
echo "=============================="
