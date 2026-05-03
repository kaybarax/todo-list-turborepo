#!/bin/bash

# Package Build and Deployment Validation Script
# This script validates that both UI packages can be built and used correctly

set -euo pipefail

echo "🔍 Validating UI Packages Build and Deployment..."

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists pnpm; then
    print_error "pnpm is required but not installed"
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is required but not installed"
    exit 1
fi

print_success "Prerequisites check passed"

# Clean previous builds
print_status "Cleaning previous builds..."
pnpm run clean
print_success "Clean completed"

# Install dependencies
print_status "Installing dependencies..."
pnpm install
print_success "Dependencies installed"

# Validate TypeScript configurations
print_status "Validating TypeScript configurations..."

cd packages/ui-web
if ! pnpm run typecheck; then
    print_error "TypeScript validation failed for ui-web package"
    exit 1
fi
print_success "ui-web TypeScript validation passed"

cd ../ui-mobile
if ! pnpm run typecheck; then
    print_error "TypeScript validation failed for ui-mobile package"
    exit 1
fi
print_success "ui-mobile TypeScript validation passed"

cd ../..

# Build packages
print_status "Building UI packages..."

cd packages/ui-web
if ! pnpm run build; then
    print_error "Build failed for ui-web package"
    exit 1
fi
print_success "ui-web package built successfully"

cd ../ui-mobile
if ! pnpm run build; then
    print_error "Build failed for ui-mobile package"
    exit 1
fi
print_success "ui-mobile package built successfully"

cd ../..

# Validate build outputs
print_status "Validating build outputs..."

# Check ui-web build outputs
if [ ! -f "packages/ui-web/dist/index.js" ]; then
    print_error "ui-web: Missing main entry point (index.js)"
    exit 1
fi

if [ ! -f "packages/ui-web/dist/index.d.ts" ]; then
    print_error "ui-web: Missing TypeScript declarations (index.d.ts)"
    exit 1
fi

if [ ! -f "packages/ui-web/dist/style.css" ]; then
    print_warning "ui-web: Missing CSS file (style.css) - this may be expected"
fi

print_success "ui-web build outputs validated"

# Check ui-mobile build outputs
if [ ! -f "packages/ui-mobile/dist/index.js" ]; then
    print_error "ui-mobile: Missing main entry point (index.js)"
    exit 1
fi

if [ ! -f "packages/ui-mobile/dist/index.d.ts" ]; then
    print_error "ui-mobile: Missing TypeScript declarations (index.d.ts)"
    exit 1
fi

print_success "ui-mobile build outputs validated"

# Test package imports
print_status "Testing package imports..."

# Create temporary test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

# Initialize a test project
npm init -y > /dev/null 2>&1

# Install the built packages
npm install "file:$(pwd)/../packages/ui-web" > /dev/null 2>&1
npm install "file:$(pwd)/../packages/ui-mobile" > /dev/null 2>&1

# Test ui-web import
cat > test-web.js << 'EOF'
try {
  const uiWeb = require('@todo/ui-web');
  console.log('✅ ui-web package imported successfully');
  console.log('Available exports:', Object.keys(uiWeb));
} catch (error) {
  console.error('❌ Failed to import ui-web package:', error.message);
  process.exit(1);
}
EOF

if ! node test-web.js; then
    print_error "ui-web package import test failed"
    cd - > /dev/null
    rm -rf "$TEST_DIR"
    exit 1
fi

# Test ui-mobile import
cat > test-mobile.js << 'EOF'
try {
  const uiMobile = require('@todo/ui-mobile');
  console.log('✅ ui-mobile package imported successfully');
  console.log('Available exports:', Object.keys(uiMobile));
} catch (error) {
  console.error('❌ Failed to import ui-mobile package:', error.message);
  process.exit(1);
}
EOF

if ! node test-mobile.js; then
    print_error "ui-mobile package import test failed"
    cd - > /dev/null
    rm -rf "$TEST_DIR"
    exit 1
fi

# Clean up test directory
cd - > /dev/null
rm -rf "$TEST_DIR"

print_success "Package import tests passed"

# Test showcase applications
print_status "Testing showcase applications..."

# Test web showcase
cd packages/ui-web
if ! pnpm run showcase:build; then
    print_error "Web showcase build failed"
    exit 1
fi
print_success "Web showcase built successfully"

# Test mobile showcase
cd ../ui-mobile
if ! pnpm run showcase:build; then
    print_error "Mobile showcase build failed"
    exit 1
fi
print_success "Mobile showcase built successfully"

cd ../..

# Run tests
print_status "Running package tests..."

cd packages/ui-web
if ! pnpm run test; then
    print_error "ui-web tests failed"
    exit 1
fi
print_success "ui-web tests passed"

cd ../ui-mobile
if ! pnpm run test; then
    print_error "ui-mobile tests failed"
    exit 1
fi
print_success "ui-mobile tests passed"

cd ../..

# Validate package.json configurations
print_status "Validating package.json configurations..."

# Check ui-web package.json
WEB_MAIN=$(node -p "require('./packages/ui-web/package.json').main")
WEB_TYPES=$(node -p "require('./packages/ui-web/package.json').types")
# shellcheck disable=SC2034
WEB_MODULE=$(node -p "require('./packages/ui-web/package.json').module")

if [ "$WEB_MAIN" != "./dist/index.js" ]; then
    print_error "ui-web: Incorrect main entry point in package.json"
    exit 1
fi

if [ "$WEB_TYPES" != "./dist/index.d.ts" ]; then
    print_error "ui-web: Incorrect types entry point in package.json"
    exit 1
fi

print_success "ui-web package.json configuration validated"

# Check ui-mobile package.json
MOBILE_MAIN=$(node -p "require('./packages/ui-mobile/package.json').main")
MOBILE_TYPES=$(node -p "require('./packages/ui-mobile/package.json').types")

if [ "$MOBILE_MAIN" != "dist/index.js" ]; then
    print_error "ui-mobile: Incorrect main entry point in package.json"
    exit 1
fi

if [ "$MOBILE_TYPES" != "dist/index.d.ts" ]; then
    print_error "ui-mobile: Incorrect types entry point in package.json"
    exit 1
fi

print_success "ui-mobile package.json configuration validated"

# Final validation summary
print_status "Validation Summary:"
echo "  ✅ TypeScript configurations"
echo "  ✅ Package builds"
echo "  ✅ Build outputs"
echo "  ✅ Package imports"
echo "  ✅ Showcase applications"
echo "  ✅ Package tests"
echo "  ✅ Package.json configurations"

print_success "🎉 All validations passed! Packages are ready for deployment."

echo ""
echo "📦 Package Information:"
echo "  • @todo/ui-web: $(node -p "require('./packages/ui-web/package.json').version")"
echo "  • @todo/ui-mobile: $(node -p "require('./packages/ui-mobile/package.json').version")"
echo ""
echo "🚀 Next steps:"
echo "  • Run 'pnpm changeset' to create a changeset for versioning"
echo "  • Run 'pnpm version-packages' to bump versions"
echo "  • Run 'pnpm release' to publish packages"