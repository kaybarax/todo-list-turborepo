#!/bin/bash

# Package Publishing Script
# This script handles the publishing of UI packages to npm

set -euo pipefail

echo "📦 Publishing UI Packages..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Parse command line arguments
DRY_RUN=false
SKIP_VALIDATION=false
REGISTRY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run           Perform a dry run without actually publishing"
            echo "  --skip-validation   Skip package validation before publishing"
            echo "  --registry URL      Use custom npm registry"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if user is logged in to npm
if [ "$DRY_RUN" = false ]; then
    print_status "Checking npm authentication..."
    if ! npm whoami > /dev/null 2>&1; then
        print_error "You are not logged in to npm. Please run 'npm login' first."
        exit 1
    fi
    print_success "npm authentication verified"
fi

# Run validation unless skipped
if [ "$SKIP_VALIDATION" = false ]; then
    print_status "Running package validation..."
    if ! ./scripts/validate-packages.sh; then
        print_error "Package validation failed. Fix issues before publishing."
        exit 1
    fi
    print_success "Package validation passed"
else
    print_warning "Skipping package validation"
fi

# Set registry if provided
if [ -n "$REGISTRY" ]; then
    print_status "Using custom registry: $REGISTRY"
    NPM_REGISTRY_ARG="--registry $REGISTRY"
else
    NPM_REGISTRY_ARG=""
fi

# Function to publish a package
publish_package() {
    local package_dir
    package_dir=$1
    local package_name
    package_name=$2
    
    print_status "Publishing $package_name..."
    
    cd "$package_dir"
    
    # Get current version
    local current_version
    current_version=$(node -p "require('./package.json').version")
    print_status "Current version: $current_version"
    
    # Check if version already exists on npm
    if [ "$DRY_RUN" = false ]; then
        if npm view "$package_name@$current_version" version > /dev/null 2>&1; then
            print_warning "$package_name@$current_version already exists on npm. Skipping..."
            cd - > /dev/null
            return 0
        fi
    fi
    
    # Perform dry run or actual publish
    if [ "$DRY_RUN" = true ]; then
        print_status "Dry run: Would publish $package_name@$current_version"
        # shellcheck disable=SC2086
        if npm publish --dry-run $NPM_REGISTRY_ARG; then
            print_success "Dry run successful for $package_name"
        else
            print_error "Dry run failed for $package_name"
            cd - > /dev/null
            return 1
        fi
    else
        print_status "Publishing $package_name@$current_version to npm..."
        # shellcheck disable=SC2086
        if npm publish $NPM_REGISTRY_ARG; then
            print_success "Successfully published $package_name@$current_version"
        else
            print_error "Failed to publish $package_name"
            cd - > /dev/null
            return 1
        fi
    fi
    
    cd - > /dev/null
    return 0
}

# Publish ui-web package
if ! publish_package "packages/ui-web" "@todo/ui-web"; then
    print_error "Failed to publish ui-web package"
    exit 1
fi

# Publish ui-mobile package
if ! publish_package "packages/ui-mobile" "@todo/ui-mobile"; then
    print_error "Failed to publish ui-mobile package"
    exit 1
fi

# Success message
if [ "$DRY_RUN" = true ]; then
    print_success "🎉 Dry run completed successfully! All packages are ready for publishing."
    echo ""
    echo "To actually publish the packages, run:"
    echo "  ./scripts/publish-packages.sh"
else
    print_success "🎉 All packages published successfully!"
    echo ""
    echo "📦 Published packages:"
    echo "  • @todo/ui-web@$(node -p "require('./packages/ui-web/package.json').version")"
    echo "  • @todo/ui-mobile@$(node -p "require('./packages/ui-mobile/package.json').version")"
    echo ""
    echo "🔗 You can now install these packages in other projects:"
    echo "  npm install @todo/ui-web"
    echo "  npm install @todo/ui-mobile"
fi