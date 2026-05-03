#!/bin/bash

# Package Installation Test Script
# This script tests that the built packages can be installed and used in external projects

set -euo pipefail

echo "🧪 Testing Package Installation in External Projects..."

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

# Create temporary test directory
TEST_DIR=$(mktemp -d)
print_status "Created test directory: $TEST_DIR"

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up test directory..."
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Test Web Package Installation
test_web_package() {
    print_status "Testing @todo/ui-web package installation..."
    
    local web_test_dir
    web_test_dir="$TEST_DIR/web-test"
    mkdir -p "$web_test_dir"
    cd "$web_test_dir"
    
    # Initialize React project
    print_status "Creating React test project..."
    cat > package.json << 'EOF'
{
  "name": "ui-web-test",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
EOF
    
    npm install > /dev/null 2>&1
    
    # Install the ui-web package from local build
    print_status "Installing @todo/ui-web from local build..."
    npm install "file:$(pwd)/../../packages/ui-web" > /dev/null 2>&1
    
    # Create test React component
    cat > test-component.tsx << 'EOF'
import React from 'react';
import { Button, Card, Input, Badge } from '@todo/ui-web';

const TestComponent: React.FC = () => {
  return (
    <div>
      <Card>
        <h1>UI Web Package Test</h1>
        <Input placeholder="Test input" />
        <Button>Test Button</Button>
        <Badge variant="default">Test Badge</Badge>
      </Card>
    </div>
  );
};

export default TestComponent;
EOF
    
    # Test TypeScript compilation
    print_status "Testing TypeScript compilation..."
    if ! npx tsc --noEmit --jsx react-jsx test-component.tsx; then
        print_error "TypeScript compilation failed for ui-web package"
        return 1
    fi
    
    # Test import resolution
    cat > test-import.js << 'EOF'
try {
  const uiWeb = require('@todo/ui-web');
  console.log('✅ @todo/ui-web imported successfully');
  
  // Check for expected exports
  const expectedExports = ['Button', 'Card', 'Input', 'Badge'];
  const availableExports = Object.keys(uiWeb);
  
  for (const expectedExport of expectedExports) {
    if (!availableExports.includes(expectedExport)) {
      console.error(`❌ Missing export: ${expectedExport}`);
      process.exit(1);
    }
  }
  
  console.log('✅ All expected exports are available');
  console.log('Available exports:', availableExports.join(', '));
} catch (error) {
  console.error('❌ Failed to import @todo/ui-web:', error.message);
  process.exit(1);
}
EOF
    
    if ! node test-import.js; then
        print_error "Import test failed for ui-web package"
        return 1
    fi
    
    print_success "@todo/ui-web package installation test passed"
    cd - > /dev/null
    return 0
}

# Test Mobile Package Installation
test_mobile_package() {
    print_status "Testing @todo/ui-mobile package installation..."
    
    local mobile_test_dir
    mobile_test_dir="$TEST_DIR/mobile-test"
    mkdir -p "$mobile_test_dir"
    cd "$mobile_test_dir"
    
    # Initialize React Native project structure
    print_status "Creating React Native test project..."
    cat > package.json << 'EOF'
{
  "name": "ui-mobile-test",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@ui-kitten/components": "^5.3.1",
    "@eva-design/eva": "^2.2.0",
    "react-native-vector-icons": "^10.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.14",
    "@types/react-native": "~0.72.6",
    "typescript": "^5.0.0"
  }
}
EOF
    
    npm install > /dev/null 2>&1
    
    # Install the ui-mobile package from local build
    print_status "Installing @todo/ui-mobile from local build..."
    npm install "file:$(pwd)/../../packages/ui-mobile" > /dev/null 2>&1
    
    # Create test React Native component
    cat > test-component.tsx << 'EOF'
import React from 'react';
import { View } from 'react-native';
import { Button, Card, Input, Badge, Avatar, Switch } from '@todo/ui-mobile';

const TestComponent: React.FC = () => {
  return (
    <View>
      <Card title="UI Mobile Package Test">
        <Input placeholder="Test input" />
        <Button title="Test Button" onPress={() => {}} />
        <Badge text="Test Badge" />
        <Avatar initials="TU" />
        <Switch checked={false} onChange={() => {}} />
      </Card>
    </View>
  );
};

export default TestComponent;
EOF
    
    # Test TypeScript compilation
    print_status "Testing TypeScript compilation..."
    if ! npx tsc --noEmit --jsx react-native test-component.tsx; then
        print_error "TypeScript compilation failed for ui-mobile package"
        return 1
    fi
    
    # Test import resolution
    cat > test-import.js << 'EOF'
try {
  const uiMobile = require('@todo/ui-mobile');
  console.log('✅ @todo/ui-mobile imported successfully');
  
  // Check for expected exports
  const expectedExports = ['Button', 'Card', 'Input', 'Badge', 'Avatar', 'Switch'];
  const availableExports = Object.keys(uiMobile);
  
  for (const expectedExport of expectedExports) {
    if (!availableExports.includes(expectedExport)) {
      console.error(`❌ Missing export: ${expectedExport}`);
      process.exit(1);
    }
  }
  
  console.log('✅ All expected exports are available');
  console.log('Available exports:', availableExports.join(', '));
} catch (error) {
  console.error('❌ Failed to import @todo/ui-mobile:', error.message);
  process.exit(1);
}
EOF
    
    if ! node test-import.js; then
        print_error "Import test failed for ui-mobile package"
        return 1
    fi
    
    print_success "@todo/ui-mobile package installation test passed"
    cd - > /dev/null
    return 0
}

# Test Showcase Applications
test_showcase_builds() {
    print_status "Testing showcase application builds..."
    
    # Test web showcase
    print_status "Testing web showcase build..."
    cd packages/ui-web
    if ! npm run showcase:build > /dev/null 2>&1; then
        print_error "Web showcase build failed"
        cd - > /dev/null
        return 1
    fi
    
    # Check if build output exists
    if [ ! -d "showcase/dist" ]; then
        print_error "Web showcase build output not found"
        cd - > /dev/null
        return 1
    fi
    
    print_success "Web showcase build successful"
    cd - > /dev/null
    
    # Test mobile showcase
    print_status "Testing mobile showcase build..."
    cd packages/ui-mobile
    if ! npm run showcase:build > /dev/null 2>&1; then
        print_error "Mobile showcase build failed"
        cd - > /dev/null
        return 1
    fi
    
    print_success "Mobile showcase build successful"
    cd - > /dev/null
    
    return 0
}

# Run all tests
print_status "Starting package installation tests..."

# Ensure packages are built first
print_status "Building packages..."
if ! pnpm run build:packages > /dev/null 2>&1; then
    print_error "Failed to build packages"
    exit 1
fi

# Run tests
if ! test_web_package; then
    print_error "Web package installation test failed"
    exit 1
fi

if ! test_mobile_package; then
    print_error "Mobile package installation test failed"
    exit 1
fi

if ! test_showcase_builds; then
    print_error "Showcase build tests failed"
    exit 1
fi

# Success summary
print_success "🎉 All package installation tests passed!"
echo ""
echo "✅ Test Results:"
echo "  • @todo/ui-web package installation and usage"
echo "  • @todo/ui-mobile package installation and usage"
echo "  • TypeScript compilation with both packages"
echo "  • Import resolution and export validation"
echo "  • Showcase application builds"
echo ""
echo "📦 Packages are ready for external use!"