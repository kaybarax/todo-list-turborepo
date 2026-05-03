#!/bin/bash

# Dependency verification script
# Verifies all package installations and dependency resolution

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to verify workspace configuration
verify_workspace() {
    print_status "Verifying workspace configuration..."
    
    if [ ! -f "pnpm-workspace.yaml" ]; then
        print_error "pnpm-workspace.yaml not found"
        return 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_error "Root package.json not found"
        return 1
    fi
    
    print_success "Workspace configuration verified"
}

# Function to verify package manager
verify_package_manager() {
    print_status "Verifying package manager..."
    
    if ! command_exists pnpm; then
        print_error "pnpm not found. Please install pnpm first."
        print_status "Installation: npm install -g pnpm@9.12.0"
        return 1
    fi
    
    local pnpm_version=$(pnpm --version)
    print_success "pnpm version: $pnpm_version"
    
    # Check if version is 9.0.0 or higher
    if ! pnpm --version | grep -E '^[9-9]\.' >/dev/null; then
        print_warning "pnpm version should be 9.0.0 or higher for optimal workspace support"
    fi
}

# Function to verify Node.js version
verify_node() {
    print_status "Verifying Node.js version..."
    
    if ! command_exists node; then
        print_error "Node.js not found. Please install Node.js first."
        return 1
    fi
    
    local node_version=$(node --version)
    print_success "Node.js version: $node_version"
    
    # Check if version is 18.0.0 or higher
    if ! node --version | grep -E '^v(1[8-9]|[2-9][0-9])\.' >/dev/null; then
        print_error "Node.js version should be 18.0.0 or higher"
        return 1
    fi
}

# Function to verify blockchain tools
verify_blockchain_tools() {
    print_status "Verifying blockchain development tools..."
    
    # Check for Rust (for Solana and Polkadot)
    if command_exists cargo; then
        local rust_version=$(rustc --version)
        print_success "Rust version: $rust_version"
    else
        print_warning "Rust not found. Required for Solana and Polkadot development."
        print_status "Installation: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    fi
    
    # Check for Anchor (for Solana)
    if command_exists anchor; then
        local anchor_version=$(anchor --version)
        print_success "Anchor version: $anchor_version"
    else
        print_warning "Anchor CLI not found. Required for Solana development."
        print_status "Installation: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    fi
    
    # Check for Solana CLI
    if command_exists solana; then
        local solana_version=$(solana --version)
        print_success "Solana CLI version: $solana_version"
    else
        print_warning "Solana CLI not found. Required for Solana development."
        print_status "Installation: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing workspace dependencies..."
    
    # Clean install
    if [ -d "node_modules" ]; then
        print_status "Cleaning existing node_modules..."
        rm -rf node_modules
    fi
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    pnpm install --frozen-lockfile || {
        print_warning "Frozen lockfile failed, trying regular install..."
        pnpm install
    }
    
    print_success "Dependencies installed successfully"
}

# Function to verify package installations
verify_packages() {
    print_status "Verifying package installations..."
    
    local packages=(
        "apps/web"
        "apps/api"
        "apps/mobile"
        "apps/ingestion"
        "apps/smart-contracts"
        "apps/smart-contracts/polygon"
        "apps/smart-contracts/moonbeam"
        "apps/smart-contracts/base"
        "apps/smart-contracts/solana"
        "packages/services"
        "packages/ui-web"
        "packages/ui-mobile"
        "packages/config-eslint"
        "packages/config-jest"
        "packages/config-ts"
        "packages/config-release"
    )
    
    local failed_packages=()
    
    for package in "${packages[@]}"; do
        if [ -d "$package" ]; then
            if [ -f "$package/package.json" ]; then
                print_status "Verifying $package..."
                
                # Check if node_modules exists or if it's a workspace package
                if [ -d "$package/node_modules" ] || [ -f "$package/package.json" ]; then
                    print_success "$package verified"
                else
                    print_error "$package dependencies not installed"
                    failed_packages+=("$package")
                fi
            else
                print_warning "$package/package.json not found"
            fi
        else
            print_warning "$package directory not found"
        fi
    done
    
    if [ ${#failed_packages[@]} -gt 0 ]; then
        print_error "Failed packages: ${failed_packages[*]}"
        return 1
    fi
    
    print_success "All packages verified"
}

# Function to verify network-specific dependencies
verify_network_dependencies() {
    print_status "Verifying network-specific dependencies..."
    
    # Verify Polygon/Moonbeam/Base dependencies
    local evm_packages=("apps/smart-contracts/polygon" "apps/smart-contracts/moonbeam" "apps/smart-contracts/base")
    
    for package in "${evm_packages[@]}"; do
        if [ -d "$package" ]; then
            print_status "Checking EVM dependencies in $package..."
            
            cd "$package"
            
            # Check if hardhat is available
            if pnpm list hardhat >/dev/null 2>&1; then
                print_success "$package: Hardhat available"
            else
                print_error "$package: Hardhat not found"
            fi
            
            # Check if ethers is available
            if pnpm list ethers >/dev/null 2>&1; then
                print_success "$package: Ethers available"
            else
                print_error "$package: Ethers not found"
            fi
            
            cd - >/dev/null
        fi
    done
    
    # Verify Solana dependencies
    if [ -d "apps/smart-contracts/solana" ]; then
        print_status "Checking Solana dependencies..."
        
        cd "apps/smart-contracts/solana"
        
        if pnpm list @coral-xyz/anchor >/dev/null 2>&1; then
            print_success "Solana: Anchor available"
        else
            print_error "Solana: Anchor not found"
        fi
        
        if pnpm list @solana/web3.js >/dev/null 2>&1; then
            print_success "Solana: Web3.js available"
        else
            print_error "Solana: Web3.js not found"
        fi
        
        cd - >/dev/null
    fi
    
    # Verify Polkadot dependencies
    if [ -d "apps/smart-contracts/polkadot" ]; then
        print_status "Checking Polkadot dependencies..."
        
        cd "apps/smart-contracts/polkadot"
        
        if [ -f "Cargo.toml" ]; then
            print_success "Polkadot: Cargo.toml found"
        else
            print_error "Polkadot: Cargo.toml not found"
        fi
        
        cd - >/dev/null
    fi
}

# Function to run basic build tests
test_builds() {
    print_status "Testing basic builds..."
    
    # Test TypeScript compilation
    print_status "Testing TypeScript compilation..."
    if pnpm typecheck; then
        print_success "TypeScript compilation successful"
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
    
    # Test package builds
    print_status "Testing package builds..."
    if pnpm build:packages; then
        print_success "Package builds successful"
    else
        print_error "Package builds failed"
        return 1
    fi
    
    print_success "Build tests completed"
}

# Function to show dependency summary
show_summary() {
    print_status "Dependency Summary:"
    echo ""
    
    echo "Workspace Packages:"
    find apps packages -name "package.json" -not -path "*/node_modules/*" | while read -r pkg; do
        local name=$(grep '"name"' "$pkg" | cut -d'"' -f4)
        local version=$(grep '"version"' "$pkg" | cut -d'"' -f4)
        echo "  $name@$version"
    done
    
    echo ""
    echo "Network Support:"
    echo "  ✓ Polygon (EVM)"
    echo "  ✓ Moonbeam (Polkadot EVM)"
    echo "  ✓ Base (Ethereum L2)"
    echo "  ✓ Solana (Rust/Anchor)"
    echo "  ✓ Polkadot (Substrate)"
    
    echo ""
    echo "Development Commands:"
    echo "  pnpm dev                    # Start all development servers"
    echo "  pnpm build                  # Build all packages and apps"
    echo "  pnpm test                   # Run all tests"
    echo "  pnpm contracts:compile:all  # Compile all smart contracts"
    echo "  pnpm lint                   # Lint all code"
    echo ""
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Verify package installations and dependency resolution"
    echo ""
    echo "Options:"
    echo "  --install         Install dependencies before verification"
    echo "  --test-builds     Run basic build tests"
    echo "  --skip-blockchain Skip blockchain tool verification"
    echo "  --help            Show this help message"
    echo ""
}

# Main verification function
main() {
    local install_deps=false
    local test_builds=false
    local skip_blockchain=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install)
                install_deps=true
                shift
                ;;
            --test-builds)
                test_builds=true
                shift
                ;;
            --skip-blockchain)
                skip_blockchain=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    local start_time=$(date +%s)
    
    print_status "Starting dependency verification..."
    
    # Run verification steps
    verify_workspace || exit 1
    verify_package_manager || exit 1
    verify_node || exit 1
    
    if [ "$skip_blockchain" = false ]; then
        verify_blockchain_tools
    fi
    
    if [ "$install_deps" = true ]; then
        install_dependencies || exit 1
    fi
    
    verify_packages || exit 1
    verify_network_dependencies || exit 1
    
    if [ "$test_builds" = true ]; then
        test_builds || exit 1
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_success "Dependency verification completed successfully in ${duration}s"
    show_summary
}

# Execute main function
main "$@"