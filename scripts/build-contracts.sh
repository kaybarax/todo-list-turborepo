#!/bin/bash

# Blockchain contracts build script
# Compiles and tests smart contracts for all supported networks
# Enhanced with dependency management, automatic installation, and comprehensive logging

set -euo pipefail

# Source the logging system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
    source "$SCRIPT_DIR/build-logger.sh"

# Initialize logging
init_logging

# Legacy function compatibility (redirect to new logging system)
print_status() {
    log_info "$1"
}

print_success() {
    log_success "$1"
}

print_warning() {
    log_warn "$1"
}

print_error() {
    log_error "$1"
}

# Source interactive help system
if [[ -f "$SCRIPT_DIR/interactive-help.sh" ]]; then
# shellcheck disable=SC1091
source "$SCRIPT_DIR/interactive-help.sh"
fi

# Configuration
NETWORK="${NETWORK:-all}"
RUN_TESTS="${RUN_TESTS:-true}"
GENERATE_DOCS="${GENERATE_DOCS:-false}"
VERIFY_CONTRACTS="${VERIFY_CONTRACTS:-false}"
AUTO_INSTALL="${AUTO_INSTALL:-true}"
SKIP_DEPS_CHECK="${SKIP_DEPS_CHECK:-false}"
VERBOSE_MODE=false
INTERACTIVE_MODE=false
DIAGNOSE_MODE=false

# Version comparison function
version_compare() {
    local version1
    version1=$1
    local version2
    version2=$2
    
    # Remove 'v' prefix if present
    version1=${version1#v}
    version2=${version2#v}
    
    # Split versions into arrays
    IFS='.' read -ra V1 <<< "$version1"
    IFS='.' read -ra V2 <<< "$version2"
    
    # Compare each part
    for i in {0..2}; do
        local v1_part
        v1_part=${V1[i]:-0}
        local v2_part
        v2_part=${V2[i]:-0}
        
        if (( v1_part > v2_part )); then
            return 0  # version1 > version2
        elif (( v1_part < v2_part )); then
            return 1  # version1 < version2
        fi
    done
    
    return 0  # versions are equal
}

# Show comprehensive usage information
show_usage() {
    cat << EOF
$(echo -e "${CYAN}=== Blockchain Contracts Build System ===${NC}")

$(echo -e "${YELLOW}DESCRIPTION:${NC}")
  Comprehensive build system for multi-network blockchain smart contracts.
  Supports Polygon, Solana, Polkadot with automatic dependency management,
  testing, documentation generation, and contract verification.

$(echo -e "${YELLOW}USAGE:${NC}")
  $0 [OPTIONS]

$(echo -e "${YELLOW}OPTIONS:${NC}")
  --network=NETWORK     Build contracts for specific network
                        (polygon|solana|polkadot|moonbeam|base|all)
  --skip-tests          Skip running contract tests
  --skip-deps           Skip dependency checking
  --no-auto-install     Disable automatic dependency installation
  --generate-docs       Generate contract documentation
  --verify              Verify contracts on block explorers (requires API keys)
  --verbose             Enable verbose output and debugging
  --interactive         Enable interactive troubleshooting prompts
  --diagnose            Run comprehensive environment diagnosis
  --help, -h            Show this help message

$(echo -e "${YELLOW}NETWORKS:${NC}")
  polygon               Polygon/Hardhat smart contracts (Solidity)
  solana                Solana/Anchor programs (Rust)
  polkadot              Polkadot/Substrate pallets (Rust)
  moonbeam              Moonbeam (Ethereum-compatible on Polkadot)
  base                  Base L2 (Ethereum-compatible)
  all                   All supported networks (default)

$(echo -e "${YELLOW}EXAMPLES:${NC}")
  $0                              # Build all networks with tests
  $0 --network=solana             # Build only Solana programs
  $0 --network=polygon --verify   # Build and verify Polygon contracts
  $0 --skip-tests --generate-docs # Build without tests, generate docs
  $0 --verbose --interactive      # Verbose build with interactive help
  $0 --diagnose                   # Diagnose build environment

$(echo -e "${YELLOW}ENVIRONMENT VARIABLES:${NC}")
  NETWORK               Target network (polygon|solana|polkadot|all)
  RUN_TESTS             Run tests after compilation (true|false)
  GENERATE_DOCS         Generate documentation (true|false)
  VERIFY_CONTRACTS      Verify contracts on explorers (true|false)
  AUTO_INSTALL          Attempt automatic dependency installation (true|false)
  SKIP_DEPS_CHECK       Skip dependency validation (true|false)
  ETHERSCAN_API_KEY     API key for Polygon contract verification
  CI                    Automatically detected - disables interactive features

$(echo -e "${YELLOW}BUILD PROCESS:${NC}")
  1. Environment validation and dependency checking
  2. Automatic installation of missing dependencies (if enabled)
  3. Network-specific contract compilation
  4. Test execution (if enabled)
  5. Documentation generation (if enabled)
  6. Contract verification (if enabled and configured)
  7. Build report generation with success/failure status

$(echo -e "${YELLOW}DEPENDENCY MANAGEMENT:${NC}")
  The build system automatically:
  • Checks for required tools before compilation
  • Attempts to install missing dependencies
  • Provides detailed error messages and troubleshooting guidance
  • Validates build environment for each network

$(echo -e "${YELLOW}NETWORK-SPECIFIC DETAILS:${NC}")

$(echo -e "${CYAN}Polygon/Hardhat:${NC}")
  • Requires: Node.js 20+, pnpm, Hardhat
  • Compiles: Solidity contracts with TypeScript generation
  • Tests: Hardhat test framework with Waffle/Ethers
  • Verification: Etherscan/Polygonscan (requires API key)

$(echo -e "${CYAN}Solana/Anchor:${NC}")
  • Requires: Rust 1.70+, Solana CLI 1.16+, Anchor CLI 0.28+
  • Compiles: Rust programs with IDL generation
  • Tests: Anchor test framework with TypeScript client
  • Deployment: Local validator or devnet

$(echo -e "${CYAN}Polkadot/Substrate:${NC}")
  • Requires: Rust 1.70+, cargo-contract, WebAssembly target
  • Compiles: Substrate pallets and runtime
  • Tests: Rust unit tests and integration tests
  • Deployment: Local Substrate node

$(echo -e "${YELLOW}TROUBLESHOOTING:${NC}")
  If builds fail:
  • Use --verbose for detailed error information
  • Use --interactive for step-by-step troubleshooting
  • Use --diagnose for comprehensive environment analysis
  • Check dependency status: scripts/blockchain-deps-check.sh
  • Install missing tools: scripts/install-blockchain-tools.sh

$(echo -e "${YELLOW}EXIT CODES:${NC}")
  0    All builds completed successfully
  1    Some builds failed
  2    Invalid command line arguments
  3    Environment validation failed
  4    Dependency installation failed

$(echo -e "${YELLOW}RELATED SCRIPTS:${NC}")
  scripts/blockchain-deps-check.sh    Verify build dependencies
  scripts/install-blockchain-tools.sh Automated dependency installation
  scripts/interactive-help.sh         Interactive troubleshooting system

$(echo -e "${YELLOW}LOGGING AND REPORTS:${NC}")
  Build logs and reports are generated in:
  • Console output with color-coded status indicators
  • Structured logging with different levels (INFO, WARN, ERROR)
  • Build summary with success/failure status per network
  • Detailed error messages with actionable recommendations

EOF
}

# Enhanced help function
show_help() {
    show_usage
}

# Interactive troubleshooting wrapper for build issues
run_interactive_build_troubleshooting() {
    if command -v interactive_troubleshooting >/dev/null 2>&1; then
        log_info "Starting interactive build troubleshooting..."
        interactive_troubleshooting "build-failure"
    else
        log_error "Interactive help system not available"
        log_info "Please check that scripts/interactive-help.sh exists"
        return 1
    fi
}

# Environment diagnosis wrapper
run_build_environment_diagnosis() {
    if command -v diagnose_environment >/dev/null 2>&1; then
        log_info "Running comprehensive build environment diagnosis..."
        diagnose_environment "${NETWORK:-all}"
    else
        log_error "Environment diagnosis not available"
        log_info "Please check that scripts/interactive-help.sh exists"
        return 1
    fi
}

# Dependency management configuration
DEPS_CHECK_SCRIPT="./scripts/blockchain-deps-check.sh"
INSTALL_SCRIPT="./scripts/install-blockchain-tools.sh"

# Dependency management functions
check_dependencies() {
    local network
    network="$1"
    
    if [ "$SKIP_DEPS_CHECK" = "true" ]; then
        print_status "Skipping dependency check (SKIP_DEPS_CHECK=true)"
        return 0
    fi
    
    print_status "Checking dependencies for network: $network"
    
    # Check if dependency checker script exists
    if [ ! -f "$DEPS_CHECK_SCRIPT" ]; then
        print_error "Dependency checker script not found: $DEPS_CHECK_SCRIPT"
        print_warning "Proceeding without dependency validation"
        return 0
    fi
    
    # Run dependency check for specific network
    local check_args
    check_args=""
    if [ "$network" != "all" ]; then
        check_args="--network=$network"
    fi
    
    # shellcheck disable=SC2086
    if "$DEPS_CHECK_SCRIPT" $check_args --verbose; then
        print_success "All dependencies verified for $network"
        return 0
    else
        print_warning "Dependency check failed for $network"
        return 1
    fi
}

attempt_auto_install() {
    local network
    network="$1"
    
    if [ "$AUTO_INSTALL" != "true" ]; then
        print_status "Auto-install disabled (AUTO_INSTALL=false)"
        return 1
    fi
    
    print_status "Attempting automatic installation of missing dependencies for $network"
    
    # Check if installer script exists
    if [ ! -f "$INSTALL_SCRIPT" ]; then
        print_error "Installer script not found: $INSTALL_SCRIPT"
        return 1
    fi
    
    # Determine which tools to install based on network
    local tools_to_install
    tools_to_install=()
    case "$network" in
        "polygon"|"moonbeam"|"base")
            tools_to_install=("node")
            ;;
        "solana")
            tools_to_install=("rust" "solana" "anchor")
            ;;
        "polkadot")
            tools_to_install=("rust" "substrate")
            ;;
        "all")
            tools_to_install=("node" "rust" "solana" "anchor" "substrate")
            ;;
        *)
            print_error "Unknown network for dependency installation: $network"
            return 1
            ;;
    esac
    
    # Attempt to install each required tool
    local install_failed
    install_failed=false
    for tool in "${tools_to_install[@]}"; do
        print_status "Installing $tool..."
        if ! "$INSTALL_SCRIPT" --tool="$tool"; then
            print_error "Failed to install $tool"
            install_failed=true
        else
            print_success "$tool installed successfully"
        fi
    done
    
    if [ "$install_failed" = "true" ]; then
        print_error "Some tools failed to install automatically"
        return 1
    fi
    
    print_success "All required tools installed successfully"
    return 0
}

validate_environment() {
    local network
    network="$1"
    
    print_status "Validating build environment for $network"
    
    # Use network-specific validation functions
    case "$network" in
        "polygon")
            if ! validate_polygon_dependencies; then
                return 1
            fi
            ;;
        "solana")
            if ! validate_solana_dependencies; then
                return 1
            fi
            ;;
        "polkadot")
            if ! validate_polkadot_dependencies; then
                return 1
            fi
            ;;
        "moonbeam")
            if ! validate_polygon_dependencies; then
                return 1
            fi
            ;;
        "base")
            if ! validate_polygon_dependencies; then
                return 1
            fi
            ;;
        "all")
            # For 'all', we'll do a basic check but let individual builds handle detailed validation
            if ! check_dependencies "$network"; then
                print_warning "Some dependencies missing for $network"
                
                # Attempt automatic installation
                if attempt_auto_install "$network"; then
                    print_success "Dependencies installed, re-validating environment"
                    
                    # Re-check dependencies after installation
                    if ! check_dependencies "$network"; then
                        print_error "Environment validation failed even after installation attempt"
                        provide_manual_guidance "$network"
                        return 1
                    fi
                else
                    print_error "Automatic installation failed"
                    provide_manual_guidance "$network"
                    return 1
                fi
            fi
            ;;
        *)
            print_error "Unknown network for validation: $network"
            return 1
            ;;
    esac
    
    print_success "Environment validation passed for $network"
    return 0
}

provide_manual_guidance() {
    local network
    network="$1"
    
    print_error "Build environment validation failed for $network"
    print_status "Manual installation guidance:"
    echo ""
    
    case "$network" in
        "polygon"|"moonbeam"|"base")
            echo "For $network development, you need:"
            echo "  - Node.js 20+ (https://nodejs.org/)"
            echo "  - pnpm package manager (npm install -g pnpm)"
            echo "  - Hardhat dependencies (pnpm install in project root)"
            ;;
        "solana")
            echo "For Solana development, you need:"
            echo "  - Rust 1.70+ (https://rustup.rs/)"
            echo "  - Solana CLI 1.16+ (https://docs.solana.com/cli/install-solana-cli-tools)"
            echo "  - Anchor CLI 0.28+ (cargo install --git https://github.com/coral-xyz/anchor avm)"
            ;;
        "polkadot")
            echo "For Polkadot development, you need:"
            echo "  - Rust 1.70+ (https://rustup.rs/)"
            echo "  - WebAssembly target (rustup target add wasm32-unknown-unknown)"
            echo "  - cargo-contract (cargo install cargo-contract)"
            echo "  - Protocol Buffers compiler (system package manager)"
            ;;
        "all")
            echo "For full blockchain development, install all of the above tools."
            ;;
    esac
    
    echo ""
    echo "After manual installation, you can:"
    echo "  - Run dependency check: $DEPS_CHECK_SCRIPT --network=$network"
    echo "  - Retry build: $0 --network=$network"
    echo "  - Skip dependency check: SKIP_DEPS_CHECK=true $0 --network=$network"
    echo ""
}

# This will be printed later in main_build function

# Network-specific dependency validation functions
validate_polygon_dependencies() {
    local validation_failed
    validation_failed=false
    
    print_status "Validating Polygon/Hardhat dependencies..."
    
    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version 2>/dev/null | sed 's/v//')
        if ! version_compare "$node_version" "20.0.0"; then
            print_error "Node.js version $node_version is too old (Required: 20+)"
            validation_failed=true
        fi
    else
        print_error "Node.js not found (Required for Hardhat compilation)"
        validation_failed=true
    fi
    
    # Check pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        print_error "pnpm not found (Required for dependency management)"
        validation_failed=true
    fi
    
    # Check if we're in the correct directory structure
    if [ ! -f "apps/smart-contracts/polygon/package.json" ]; then
        print_error "Polygon package.json not found"
        validation_failed=true
    fi
    
    # Check for Hardhat configuration
    if [ ! -f "apps/smart-contracts/polygon/hardhat.config.js" ]; then
        print_error "Hardhat configuration file not found"
        validation_failed=true
    fi
    
    if [ "$validation_failed" = "true" ]; then
        print_error "Polygon dependency validation failed"
        provide_polygon_guidance
        return 1
    fi
    
    return 0
}

validate_solana_dependencies() {
    local validation_failed
    validation_failed=false
    
    print_status "Validating Solana/Anchor dependencies..."
    
    # Check Rust installation
    if command -v rustc >/dev/null 2>&1; then
        local rust_version
        rust_version=$(rustc --version 2>/dev/null | awk '{print $2}')
        if ! version_compare "$rust_version" "1.70.0"; then
            print_error "Rust version $rust_version is too old (Required: 1.70+)"
            validation_failed=true
        fi
    else
        print_error "Rust not found (Required for Solana program compilation)"
        validation_failed=true
    fi
    
    # Check Solana CLI
    if command -v solana >/dev/null 2>&1; then
        local solana_version
        solana_version=$(solana --version 2>/dev/null | awk '{print $2}')
        if ! version_compare "$solana_version" "1.16.0"; then
            print_error "Solana CLI version $solana_version is too old (Required: 1.16+)"
            validation_failed=true
        fi
    else
        print_error "Solana CLI not found (Required for program deployment)"
        validation_failed=true
    fi
    
    # Check Anchor CLI
    if command -v anchor >/dev/null 2>&1; then
        local anchor_version
        anchor_version=$(anchor --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        if [[ -z "$anchor_version" ]] || ! version_compare "$anchor_version" "0.28.0"; then
            print_error "Anchor CLI version $anchor_version is too old (Required: 0.28+)"
            validation_failed=true
        fi
    else
        print_error "Anchor CLI not found (Required for Solana program development)"
        validation_failed=true
    fi
    
    # Check Anchor.toml configuration
    if [ ! -f "apps/smart-contracts/solana/Anchor.toml" ]; then
        print_error "Anchor.toml configuration file not found"
        validation_failed=true
    fi
    
    # Check Cargo.toml
    if [ ! -f "apps/smart-contracts/solana/Cargo.toml" ]; then
        print_error "Cargo.toml file not found"
        validation_failed=true
    fi
    
    if [ "$validation_failed" = "true" ]; then
        print_error "Solana dependency validation failed"
        provide_solana_guidance
        return 1
    fi
    
    return 0
}

validate_polkadot_dependencies() {
    local validation_failed
    validation_failed=false
    
    print_status "Validating Polkadot/Substrate dependencies..."
    
    # Check Rust installation
    if command -v rustc >/dev/null 2>&1; then
        local rust_version
        rust_version=$(rustc --version 2>/dev/null | awk '{print $2}')
        if ! version_compare "$rust_version" "1.70.0"; then
            print_error "Rust version $rust_version is too old (Required: 1.70+)"
            validation_failed=true
        fi
    else
        print_error "Rust not found (Required for Substrate pallet compilation)"
        validation_failed=true
    fi
    
    # Check for wasm32-unknown-unknown target
    if command -v rustup >/dev/null 2>&1; then
        if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
            print_error "WebAssembly target not installed (Required for Substrate runtime)"
            print_status "Install with: rustup target add wasm32-unknown-unknown"
            validation_failed=true
        fi
    else
        print_warning "rustup not found - cannot verify WebAssembly target"
    fi
    
    # Check cargo-contract
    if ! command -v cargo-contract >/dev/null 2>&1; then
        print_error "cargo-contract not found (Required for ink! contract development)"
        print_status "Install with: cargo install cargo-contract"
        validation_failed=true
    fi
    
    # Check Substrate pallet structure
    if [ ! -f "apps/smart-contracts/polkadot/pallet-todo/Cargo.toml" ]; then
        print_error "Substrate pallet Cargo.toml not found"
        validation_failed=true
    fi
    
    # Check runtime structure
    if [ ! -f "apps/smart-contracts/polkadot/runtime/Cargo.toml" ]; then
        print_error "Substrate runtime Cargo.toml not found"
        validation_failed=true
    fi
    
    if [ "$validation_failed" = "true" ]; then
        print_error "Polkadot dependency validation failed"
        provide_polkadot_guidance
        return 1
    fi
    
    return 0
}

# Network-specific guidance functions
provide_polygon_guidance() {
    echo ""
    print_error "Polygon/Hardhat Build Environment Issues Detected"
    echo ""
    echo "Required Dependencies:"
    echo "  • Node.js 20+ (https://nodejs.org/)"
    echo "  • pnpm package manager (npm install -g pnpm)"
    echo ""
    echo "Common Issues and Solutions:"
    echo "  1. Node.js version too old:"
    echo "     - Update Node.js to version 20 or higher"
    echo "     - Use nvm: nvm install 20 && nvm use 20"
    echo ""
    echo "  2. Missing dependencies:"
    echo "     - Run: cd apps/smart-contracts/polygon && pnpm install"
    echo ""
    echo "  3. Hardhat compilation errors:"
    echo "     - Check Solidity version compatibility in hardhat.config.js"
    echo "     - Verify OpenZeppelin contracts version"
    echo "     - Run: pnpm compile --verbose for detailed errors"
    echo ""
    echo "  4. Network configuration issues:"
    echo "     - Verify RPC URLs in hardhat.config.js"
    echo "     - Check environment variables in .env file"
    echo ""
    echo "Troubleshooting Commands:"
    echo "  • Check Hardhat: cd apps/smart-contracts/polygon && npx hardhat --version"
    echo "  • Clean build: cd apps/smart-contracts/polygon && npx hardhat clean"
    echo "  • Verbose compile: cd apps/smart-contracts/polygon && npx hardhat compile --verbose"
    echo ""
}

provide_solana_guidance() {
    echo ""
    print_error "Solana/Anchor Build Environment Issues Detected"
    echo ""
    echo "Required Dependencies:"
    echo "  • Rust 1.70+ (https://rustup.rs/)"
    echo "  • Solana CLI 1.16+ (https://docs.solana.com/cli/install-solana-cli-tools)"
    echo "  • Anchor CLI 0.28+ (cargo install --git https://github.com/coral-xyz/anchor avm)"
    echo ""
    echo "Common Issues and Solutions:"
    echo "  1. Rust version too old:"
    echo "     - Update Rust: rustup update"
    echo "     - Install specific version: rustup install 1.70.0"
    echo ""
    echo "  2. Solana CLI issues:"
    echo "     - Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    echo "     - Add to PATH: export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
    echo "     - Configure: solana config set --url devnet"
    echo ""
    echo "  3. Anchor CLI issues:"
    echo "     - Install AVM: cargo install --git https://github.com/coral-xyz/anchor avm"
    echo "     - Install Anchor: avm install latest && avm use latest"
    echo ""
    echo "  4. Build failures:"
    echo "     - Check Anchor.toml configuration"
    echo "     - Verify program dependencies in Cargo.toml"
    echo "     - Run: anchor build --verbose for detailed errors"
    echo ""
    echo "  5. Test failures:"
    echo "     - Start local validator: solana-test-validator"
    echo "     - Check wallet configuration: solana address"
    echo "     - Verify test cluster: anchor test --skip-local-validator"
    echo ""
    echo "Troubleshooting Commands:"
    echo "  • Check versions: anchor --version && solana --version && rustc --version"
    echo "  • Clean build: cd apps/smart-contracts/solana && anchor clean"
    echo "  • Verbose build: cd apps/smart-contracts/solana && anchor build --verbose"
    echo ""
}

provide_polkadot_guidance() {
    echo ""
    print_error "Polkadot/Substrate Build Environment Issues Detected"
    echo ""
    echo "Required Dependencies:"
    echo "  • Rust 1.70+ (https://rustup.rs/)"
    echo "  • WebAssembly target (rustup target add wasm32-unknown-unknown)"
    echo "  • cargo-contract (cargo install cargo-contract)"
    echo "  • Protocol Buffers compiler (system package manager)"
    echo ""
    echo "Common Issues and Solutions:"
    echo "  1. Rust version too old:"
    echo "     - Update Rust: rustup update"
    echo "     - Install specific version: rustup install 1.70.0"
    echo ""
    echo "  2. Missing WebAssembly target:"
    echo "     - Install: rustup target add wasm32-unknown-unknown"
    echo "     - Add rust-src: rustup component add rust-src"
    echo ""
    echo "  3. cargo-contract missing:"
    echo "     - Install: cargo install cargo-contract"
    echo "     - Update: cargo install --force cargo-contract"
    echo ""
    echo "  4. Protocol Buffers issues:"
    echo "     - macOS: brew install protobuf"
    echo "     - Ubuntu: sudo apt install protobuf-compiler"
    echo "     - Arch: sudo pacman -S protobuf"
    echo ""
    echo "  5. Substrate compilation errors:"
    echo "     - Check pallet dependencies in Cargo.toml"
    echo "     - Verify Substrate version compatibility"
    echo "     - Run: cargo build --verbose for detailed errors"
    echo ""
    echo "  6. Runtime build failures:"
    echo "     - Check feature flags in Cargo.toml"
    echo "     - Verify pallet integration in runtime/lib.rs"
    echo "     - Build with: cargo build --release --features runtime-benchmarks"
    echo ""
    echo "Troubleshooting Commands:"
    echo "  • Check versions: rustc --version && cargo --version"
    echo "  • Check targets: rustup target list --installed"
    echo "  • Clean build: cd apps/smart-contracts/polkadot && cargo clean"
    echo "  • Verbose build: cd apps/smart-contracts/polkadot && cargo build --verbose"
    echo ""
}

# Enhanced build validation functions
validate_polygon_build() {
    local build_dir
    build_dir="${1:-apps/smart-contracts/polygon}"
    
    print_status "Validating build artifacts for $build_dir..."
    
    # Check if artifacts directory exists and contains contracts
    if [ ! -d "$build_dir/artifacts" ]; then
        print_error "Artifacts directory not found: $build_dir/artifacts"
        return 1
    fi
    
    # Check for compiled contract artifacts
    local contract_count
    contract_count=$(find "$build_dir/artifacts" -name "*.json" -not -path "*/build-info/*" | wc -l)
    
    if [ "$contract_count" -eq 0 ]; then
        print_error "No compiled contract artifacts found"
        return 1
    fi
    
    print_success "Found $contract_count compiled contract artifacts"
    
    # Check for TypeChain types if TypeChain is configured
    if [ -d "$build_dir/typechain-types" ]; then
        local types_count
        types_count=$(find "$build_dir/typechain-types" -name "*.ts" | wc -l)
        print_success "Found $types_count TypeScript type definitions"
    fi
    
    return 0
}

validate_solana_build() {
    local build_dir
    build_dir="apps/smart-contracts/solana"
    
    print_status "Validating Solana build artifacts..."
    
    # Check if target directory exists
    if [ ! -d "$build_dir/target" ]; then
        print_error "Solana target directory not found"
        return 1
    fi
    
    # Check for compiled programs (.so files)
    local program_count
    program_count=$(find "$build_dir/target/deploy" -name "*.so" 2>/dev/null | wc -l)
    
    if [ "$program_count" -eq 0 ]; then
        print_error "No compiled Solana programs (.so files) found"
        return 1
    fi
    
    print_success "Found $program_count compiled Solana programs"
    
    # Check for IDL files
    if [ -d "$build_dir/target/idl" ]; then
        local idl_count
        idl_count=$(find "$build_dir/target/idl" -name "*.json" | wc -l)
        print_success "Found $idl_count IDL files"
    fi
    
    # Check for TypeScript types
    if [ -d "$build_dir/target/types" ]; then
        local types_count
        types_count=$(find "$build_dir/target/types" -name "*.ts" | wc -l)
        print_success "Found $types_count TypeScript type definitions"
    fi
    
    return 0
}

validate_polkadot_build() {
    local build_dir
    build_dir="apps/smart-contracts/polkadot"
    
    print_status "Validating Polkadot build artifacts..."
    
    # Check if target directory exists
    if [ ! -d "$build_dir/target" ]; then
        print_error "Polkadot target directory not found"
        return 1
    fi
    
    # Check for compiled pallet
    if [ -d "$build_dir/target/release" ]; then
        print_success "Release build artifacts found"
    elif [ -d "$build_dir/target/debug" ]; then
        print_success "Debug build artifacts found"
    else
        print_error "No build artifacts found in target directory"
        return 1
    fi
    
    # Check for WASM runtime if it should be built
    local wasm_count
    wasm_count=$(find "$build_dir/target" -name "*.wasm" 2>/dev/null | wc -l)
    
    if [ "$wasm_count" -gt 0 ]; then
        print_success "Found $wasm_count WebAssembly runtime files"
    fi
    
    return 0
}

# Function to build Polygon contracts with enhanced validation
build_polygon() {
    local network
    network="polygon"
    init_network_report "$network"
    
    if [ ! -d "apps/smart-contracts/polygon" ]; then
        log_warn "Polygon contracts directory not found, skipping..."
        update_network_status "$network" "skipped"
        return 0
    fi
    
    log_info "Starting Polygon contract build process..."
    show_progress "Initializing Polygon build environment" 2
    
    # Enhanced dependency validation
    if ! validate_polygon_dependencies; then
        add_network_error "$network" "Polygon dependency validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    
    log_info "Building Polygon contracts..."
    cd apps/smart-contracts/polygon
    
    # Install dependencies with error handling
    if [ ! -d "node_modules" ]; then
        show_progress "Installing Polygon contract dependencies" 3
        if ! pnpm install; then
            add_network_error "$network" "Failed to install Polygon dependencies"
            update_network_status "$network" "failed"
            cd ../../..
            return 1
        fi
        log_success "Polygon dependencies installed successfully"
    fi
    
    # Clean previous build artifacts
    log_info "Cleaning previous build artifacts..."
    npx hardhat clean 2>/dev/null || true
    
    # Compile contracts with detailed error handling
    log_info "Compiling Solidity contracts..."
    show_progress "Compiling contracts" 5
    
    if ! npx hardhat --config hardhat.config.js compile; then
        add_network_error "$network" "Polygon contract compilation failed"
        log_error "Polygon contract compilation failed"
        echo ""
        log_info "Common compilation issues:"
        echo "  • Check Solidity version compatibility"
        echo "  • Verify import paths in contracts"
        echo "  • Check for syntax errors in .sol files"
        echo "  • OpenZeppelin version compatibility issues"
        echo "  • Run 'npx hardhat compile --verbose' for detailed errors"
        echo ""
        log_info "OpenZeppelin 4.9+ specific issues:"
        echo "  • Ownable constructor changed: use Ownable(initialOwner) instead of Ownable()"
        echo "  • Counters library deprecated: use manual counter or alternative"
        echo "  • Check contract documentation syntax"
        update_network_status "$network" "failed"
        cd ../../..
        return 1
    fi
    
    # Count and report compiled contracts
    if [ -d "artifacts/contracts" ]; then
        local contract_files
        contract_files=$(find artifacts/contracts -name "*.json" -not -path "*/build-info/*" | wc -l)
        log_success "Compiled $contract_files Solidity contracts"
        
        # Add compiled contracts to report
        find artifacts/contracts -name "*.json" -not -path "*/build-info/*" | while read -r contract_file; do
            local contract_name
            contract_name=$(basename "$contract_file" .json)
            add_compiled_artifact "$network" "contracts_compiled" "$contract_name"
        done
    fi
    
    # Validate build artifacts
    cd ../../..
    if ! validate_polygon_build; then
        add_network_error "$network" "Polygon build validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    cd apps/smart-contracts/polygon
    
    # Run tests if requested
    if [ "$RUN_TESTS" = "true" ]; then
        log_info "Running Polygon contract tests..."
        show_progress "Executing test suite" 10
        
        if ! pnpm test; then
            add_network_error "$network" "Polygon contract tests failed"
            log_error "Polygon contract tests failed"
            log_info "Test troubleshooting:"
            echo "  • Check test file syntax and imports"
            echo "  • Verify contract deployment in tests"
            echo "  • Run 'npx hardhat test --verbose' for detailed output"
            update_network_status "$network" "failed"
            cd ../../..
            return 1
        fi
        log_success "All Polygon contract tests passed"
    fi
    
    # Generate documentation if requested
    if [ "$GENERATE_DOCS" = "true" ]; then
        log_info "Generating Polygon contract documentation..."
        if ! pnpm docgen; then
            add_network_warning "$network" "Documentation generation failed"
        else
            log_success "Documentation generated successfully"
        fi
    fi
    
    # Verify contracts if requested
    if [ "$VERIFY_CONTRACTS" = "true" ] && [ -n "$ETHERSCAN_API_KEY" ]; then
        log_info "Verifying Polygon contracts..."
        if ! pnpm verify; then
            add_network_warning "$network" "Contract verification failed"
        else
            log_success "Contracts verified successfully"
        fi
    fi
    
    cd ../../..
    update_network_status "$network" "success"
    log_success "Polygon contracts built successfully"
}

# Function to build Solana programs with enhanced validation
build_solana() {
    local network
    network="solana"
    init_network_report "$network"
    
    if [ ! -d "apps/smart-contracts/solana" ]; then
        log_warn "Solana programs directory not found, skipping..."
        update_network_status "$network" "skipped"
        return 0
    fi
    
    log_info "Starting Solana program build process..."
    show_progress "Initializing Solana build environment" 2
    
    # Enhanced dependency validation
    if ! validate_solana_dependencies; then
        add_network_error "$network" "Solana dependency validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    
    log_info "Building Solana programs..."
    cd apps/smart-contracts/solana
    
    # Check Solana configuration
    log_info "Checking Solana configuration..."
    if ! solana config get >/dev/null 2>&1; then
        log_warn "Solana CLI not configured, setting to devnet"
        solana config set --url devnet
        add_network_warning "$network" "Solana CLI was not configured, set to devnet"
    fi
    
    # Clean previous build artifacts
    log_info "Cleaning previous build artifacts..."
    anchor clean 2>/dev/null || true
    
    # Build programs with detailed error handling
    log_info "Building Solana programs with Anchor..."
    show_progress "Compiling Rust programs" 15
    
    if ! anchor build; then
        add_network_error "$network" "Solana program compilation failed"
        log_error "Solana program compilation failed"
        echo ""
        log_info "Common compilation issues:"
        echo "  • Check Rust version compatibility (requires 1.70+)"
        echo "  • Verify Anchor.toml configuration"
        echo "  • Check program dependencies in Cargo.toml"
        echo "  • Ensure all required Solana programs are available"
        echo "  • Run 'anchor build --verbose' for detailed errors"
        echo ""
        log_info "Anchor troubleshooting:"
        echo "  • Update Anchor: avm install latest && avm use latest"
        echo "  • Check program ID: anchor keys list"
        echo "  • Verify workspace configuration in Anchor.toml"
        update_network_status "$network" "failed"
        cd ../../..
        return 1
    fi
    
    # Count and report compiled programs
    if [ -d "target/deploy" ]; then
        local program_files
        program_files=$(find target/deploy -name "*.so" | wc -l)
        log_success "Compiled $program_files Solana programs"
        
        # Add compiled programs to report
        find target/deploy -name "*.so" | while read -r program_file; do
            local program_name
            program_name=$(basename "$program_file" .so)
            add_compiled_artifact "$network" "programs_built" "$program_name"
        done
    fi
    
    # Validate build artifacts
    cd ../../..
    if ! validate_solana_build; then
        print_error "Solana build validation failed"
        return 1
    fi
    cd apps/smart-contracts/solana
    
    # Run tests if requested
    if [ "$RUN_TESTS" = "true" ]; then
        print_status "Running Solana program tests..."
        
        # Check if local validator is needed
        if ! solana cluster-version >/dev/null 2>&1; then
            print_status "Starting local test validator for tests..."
            # Start validator in background and give it time to start
            solana-test-validator --reset --quiet &
            local validator_pid
            validator_pid=$!
            sleep 5
            
            # Run tests
            if ! anchor test --skip-local-validator; then
                print_error "Solana program tests failed"
                print_status "Test troubleshooting:"
                echo "  • Check test file syntax and imports"
                echo "  • Verify program deployment in tests"
                echo "  • Ensure test accounts have sufficient SOL"
                echo "  • Run 'anchor test --verbose' for detailed output"
                
                # Clean up validator
                kill $validator_pid 2>/dev/null || true
                cd ../../..
                return 1
            fi
            
            # Clean up validator
            kill $validator_pid 2>/dev/null || true
        else
            # Use existing cluster
            if ! anchor test --skip-local-validator; then
                print_error "Solana program tests failed"
                print_status "Test troubleshooting:"
                echo "  • Check network connectivity to configured cluster"
                echo "  • Verify wallet has sufficient SOL for tests"
                echo "  • Check program deployment status"
                cd ../../..
                return 1
            fi
        fi
    fi
    
    # Generate IDL and types
    print_status "Generating Solana program IDL and types..."
    
    # Create target directories if they don't exist
    mkdir -p ../../../packages/services/src/blockchain/solana
    
    # Copy IDL files
    if [ -d "target/idl" ]; then
        for idl_file in target/idl/*.json; do
            if [ -f "$idl_file" ]; then
                local idl_name
                idl_name=$(basename "$idl_file")
                cp "$idl_file" "../../../packages/services/src/blockchain/solana/$idl_name"
                print_success "Generated IDL: $idl_name"
            fi
        done
    else
        print_warning "No IDL files found - this may indicate build issues"
    fi
    
    # Generate TypeScript types if available
    if [ -d "target/types" ]; then
        mkdir -p ../../../packages/services/src/blockchain/solana/types
        cp -r target/types/* ../../../packages/services/src/blockchain/solana/types/ 2>/dev/null || true
        print_success "Generated TypeScript types"
    fi
    
    cd ../../..
    update_network_status "$network" "success"
    log_success "Solana programs built successfully"
}

# Function to build Polkadot pallets with enhanced validation
build_polkadot() {
    local network
    network="polkadot"
    init_network_report "$network"
    
    if [ ! -d "apps/smart-contracts/polkadot" ]; then
        log_warn "Polkadot pallets directory not found, skipping..."
        update_network_status "$network" "skipped"
        return 0
    fi
    
    log_info "Starting Polkadot pallet build process..."
    show_progress "Initializing Polkadot build environment" 2
    
    # Enhanced dependency validation
    if ! validate_polkadot_dependencies; then
        add_network_error "$network" "Polkadot dependency validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    
    log_info "Building Polkadot pallets..."
    cd apps/smart-contracts/polkadot
    
    # Install Substrate dependencies with error handling
    log_info "Installing Substrate dependencies..."
    show_progress "Setting up WebAssembly target" 3
    
    if ! rustup target add wasm32-unknown-unknown; then
        add_network_error "$network" "Failed to add WebAssembly target"
        update_network_status "$network" "failed"
        cd ../../..
        return 1
    fi
    
    if ! rustup component add rust-src; then
        add_network_warning "$network" "Failed to add rust-src component"
        log_warn "rust-src component not added - may affect some builds"
    fi
    
    # Clean previous build artifacts
    log_info "Cleaning previous build artifacts..."
    cargo clean 2>/dev/null || true
    
    # Build pallets with detailed error handling
    log_info "Building Polkadot pallets..."
    show_progress "Compiling Substrate pallets" 20
    
    if ! cargo build --release; then
        add_network_error "$network" "Polkadot pallet compilation failed"
        log_error "Polkadot pallet compilation failed"
        echo ""
        log_info "Common compilation issues:"
        echo "  • Check Rust version compatibility (requires 1.70+)"
        echo "  • Verify Substrate dependencies in Cargo.toml"
        echo "  • Check pallet implementation for syntax errors"
        echo "  • Ensure all required Substrate crates are available"
        echo "  • Run 'cargo build --verbose' for detailed errors"
        echo ""
        log_info "Substrate troubleshooting:"
        echo "  • Update Rust: rustup update"
        echo "  • Check targets: rustup target list --installed"
        echo "  • Verify cargo-contract: cargo install --force cargo-contract"
        update_network_status "$network" "failed"
        cd ../../..
        return 1
    fi
    
    # Count and report compiled pallets
    if [ -d "target/release" ]; then
        log_success "Polkadot pallets compiled successfully"
        add_compiled_artifact "$network" "pallets_compiled" "pallet-todo"
    fi
    
    # Validate build artifacts
    cd ../../..
    if ! validate_polkadot_build; then
        add_network_error "$network" "Polkadot build validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    cd apps/smart-contracts/polkadot
    
    # Run tests if requested
    if [ "$RUN_TESTS" = "true" ]; then
        log_info "Running Polkadot pallet tests..."
        show_progress "Executing pallet tests" 8
        
        if ! cargo test; then
            add_network_error "$network" "Polkadot pallet tests failed"
            log_error "Polkadot pallet tests failed"
            log_info "Test troubleshooting:"
            echo "  • Check test module syntax and imports"
            echo "  • Verify mock runtime configuration"
            echo "  • Ensure test dependencies are properly configured"
            echo "  • Run 'cargo test --verbose' for detailed output"
            update_network_status "$network" "failed"
            cd ../../..
            return 1
        fi
        log_success "All Polkadot pallet tests passed"
    fi
    
    # Build WASM runtime with error handling
    log_info "Building WASM runtime..."
    show_progress "Compiling runtime" 12
    
    if ! cargo build --release --features runtime-benchmarks; then
        add_network_error "$network" "WASM runtime build failed"
        log_error "WASM runtime build failed"
        log_info "Runtime build troubleshooting:"
        echo "  • Check runtime configuration in runtime/Cargo.toml"
        echo "  • Verify all pallets are properly integrated"
        echo "  • Ensure feature flags are correctly configured"
        echo "  • Check for missing dependencies in runtime"
        update_network_status "$network" "failed"
        cd ../../..
        return 1
    fi
    
    # Additional validation for runtime artifacts
    if [ -f "target/release/wbuild/todo-runtime/todo_runtime.wasm" ]; then
        log_success "WASM runtime built successfully"
        add_compiled_artifact "$network" "pallets_compiled" "todo-runtime.wasm"
    elif [ -f "target/release/wbuild/*/runtime.wasm" ]; then
        log_success "WASM runtime built successfully"
        add_compiled_artifact "$network" "pallets_compiled" "runtime.wasm"
    else
        add_network_warning "$network" "WASM runtime file not found - build may have issues"
    fi
    
    cd ../../..
    update_network_status "$network" "success"
    log_success "Polkadot pallets built successfully"
}

# Function to build Moonbeam contracts with enhanced validation
build_moonbeam() {
    local network
    network="moonbeam"
    init_network_report "$network"
    
    if [ ! -d "apps/smart-contracts/moonbeam" ]; then
        log_warn "Moonbeam contracts directory not found, skipping..."
        update_network_status "$network" "skipped"
        return 0
    fi
    
    log_info "Starting Moonbeam contract build process..."
    show_progress "Initializing Moonbeam build environment" 2
    
    # Enhanced dependency validation (same as Polygon since it uses Hardhat)
    if ! validate_polygon_dependencies; then
        add_network_error "$network" "Moonbeam dependency validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    
    log_info "Building Moonbeam contracts..."
    cd apps/smart-contracts/moonbeam
    
    # Install dependencies with error handling
    if [ ! -d "node_modules" ]; then
        print_status "Installing Moonbeam contract dependencies..."
        if ! pnpm install; then
            print_error "Failed to install Moonbeam dependencies"
            cd ../../..
            return 1
        fi
    fi
    
    # Clean previous build artifacts
    print_status "Cleaning previous build artifacts..."
    npx hardhat clean 2>/dev/null || true
    
    # Compile Solidity contracts with detailed error handling
    print_status "Compiling Moonbeam Solidity contracts..."
    if ! npx hardhat --config hardhat.config.js compile; then
        print_error "Moonbeam contract compilation failed"
        echo ""
        print_status "Common Moonbeam compilation issues:"
        echo "  • Check Solidity version compatibility with Moonbeam"
        echo "  • Verify Moonbeam-specific imports and dependencies"
        echo "  • Check for Polkadot API integration issues"
        echo "  • Ensure @moonbeam-network packages are properly installed"
        echo "  • OpenZeppelin version compatibility (same as Polygon)"
        echo "  • Run 'npx hardhat compile --verbose' for detailed errors"
        cd ../../..
        return 1
    fi
    
    # Validate build artifacts (reuse Polygon validation since structure is similar)
    cd ../../..
    if ! validate_polygon_build "apps/smart-contracts/moonbeam"; then
        print_error "Moonbeam build validation failed"
        return 1
    fi
    cd apps/smart-contracts/moonbeam
    
    # Run tests if requested
    if [ "$RUN_TESTS" = "true" ]; then
        print_status "Running Moonbeam contract tests..."
        if ! pnpm test; then
            print_error "Moonbeam contract tests failed"
            print_status "Moonbeam test troubleshooting:"
            echo "  • Check Moonbeam network configuration in hardhat.config.js"
            echo "  • Verify test accounts and funding"
            echo "  • Ensure Moonbeam-specific test setup is correct"
            echo "  • Check for parachain-specific testing requirements"
            cd ../../..
            return 1
        fi
    fi
    
    # Generate documentation if requested
    if [ "$GENERATE_DOCS" = "true" ]; then
        print_status "Generating Moonbeam contract documentation..."
        pnpm docgen || print_warning "Documentation generation failed"
    fi
    
    # Verify contracts if requested
    if [ "$VERIFY_CONTRACTS" = "true" ] && [ -n "$MOONBEAM_API_KEY" ]; then
        print_status "Verifying Moonbeam contracts..."
        pnpm verify || print_warning "Contract verification failed"
    fi
    
    cd ../../..
    print_success "Moonbeam contracts built successfully"
}

# Function to build Base contracts with enhanced validation
build_base() {
    local network
    network="base"
    init_network_report "$network"
    
    if [ ! -d "apps/smart-contracts/base" ]; then
        log_warn "Base contracts directory not found, skipping..."
        update_network_status "$network" "skipped"
        return 0
    fi
    
    log_info "Starting Base contract build process..."
    show_progress "Initializing Base build environment" 2
    
    # Enhanced dependency validation (same as Polygon since it uses Hardhat)
    if ! validate_polygon_dependencies; then
        add_network_error "$network" "Base dependency validation failed"
        update_network_status "$network" "failed"
        return 1
    fi
    
    log_info "Building Base contracts..."
    cd apps/smart-contracts/base
    
    # Install dependencies with error handling
    if [ ! -d "node_modules" ]; then
        print_status "Installing Base contract dependencies..."
        if ! pnpm install; then
            print_error "Failed to install Base dependencies"
            cd ../../..
            return 1
        fi
    fi
    
    # Clean previous build artifacts
    print_status "Cleaning previous build artifacts..."
    npx hardhat clean 2>/dev/null || true
    
    # Compile Solidity contracts with detailed error handling
    print_status "Compiling Base Solidity contracts..."
    if ! npx hardhat --config hardhat.config.js compile; then
        print_error "Base contract compilation failed"
        echo ""
        print_status "Common Base compilation issues:"
        echo "  • Check Solidity version compatibility with Base"
        echo "  • Verify Base-specific imports and dependencies"
        echo "  • Check for Optimism/Base L2 integration issues"
        echo "  • Ensure @eth-optimism packages are properly installed"
        echo "  • OpenZeppelin version compatibility (same as Polygon)"
        echo "  • Run 'npx hardhat compile --verbose' for detailed errors"
        cd ../../..
        return 1
    fi
    
    # Validate build artifacts (reuse Polygon validation since structure is similar)
    cd ../../..
    if ! validate_polygon_build "apps/smart-contracts/base"; then
        print_error "Base build validation failed"
        return 1
    fi
    cd apps/smart-contracts/base
    
    # Run tests if requested
    if [ "$RUN_TESTS" = "true" ]; then
        print_status "Running Base contract tests..."
        if ! pnpm test; then
            print_error "Base contract tests failed"
            print_status "Base test troubleshooting:"
            echo "  • Check Base network configuration in hardhat.config.js"
            echo "  • Verify test accounts and ETH funding"
            echo "  • Ensure Base-specific test setup is correct"
            echo "  • Check for L2-specific testing requirements"
            echo "  • Verify Optimism/Base bridge functionality if used"
            cd ../../..
            return 1
        fi
    fi
    
    # Generate documentation if requested
    if [ "$GENERATE_DOCS" = "true" ]; then
        print_status "Generating Base contract documentation..."
        pnpm docgen || print_warning "Documentation generation failed"
    fi
    
    # Verify contracts if requested
    if [ "$VERIFY_CONTRACTS" = "true" ] && [ -n "$BASESCAN_API_KEY" ]; then
        print_status "Verifying Base contracts..."
        pnpm verify || print_warning "Contract verification failed"
    fi
    
    cd ../../..
    print_success "Base contracts built successfully"
}

# Function to generate contract artifacts
generate_artifacts() {
    print_status "Generating contract artifacts..."
    
    # Create artifacts directory
    mkdir -p build/contracts
    
    local artifacts_copied
    artifacts_copied=false
    
    # Copy Polygon artifacts
    if [ -d "apps/smart-contracts/polygon/artifacts" ]; then
        mkdir -p build/contracts/polygon
        cp -r apps/smart-contracts/polygon/artifacts/* build/contracts/polygon/ 2>/dev/null || true
        print_status "Polygon artifacts copied"
        artifacts_copied=true
    fi
    
    # Copy Solana artifacts
    if [ -d "apps/smart-contracts/solana/target/deploy" ]; then
        mkdir -p build/contracts/solana
        cp -r apps/smart-contracts/solana/target/deploy build/contracts/solana/ 2>/dev/null || true
        artifacts_copied=true
    fi
    if [ -d "apps/smart-contracts/solana/target/idl" ]; then
        mkdir -p build/contracts/solana
        cp -r apps/smart-contracts/solana/target/idl build/contracts/solana/ 2>/dev/null || true
        print_status "Solana artifacts copied"
    fi
    
    # Copy Polkadot artifacts
    if [ -d "apps/smart-contracts/polkadot/target/release" ]; then
        mkdir -p build/contracts/polkadot
        cp -r apps/smart-contracts/polkadot/target/release build/contracts/polkadot/ 2>/dev/null || true
        print_status "Polkadot artifacts copied"
        artifacts_copied=true
    fi
    
    # Copy Moonbeam artifacts
    if [ -d "apps/smart-contracts/moonbeam/artifacts" ]; then
        mkdir -p build/contracts/moonbeam
        cp -r apps/smart-contracts/moonbeam/artifacts/* build/contracts/moonbeam/ 2>/dev/null || true
        print_status "Moonbeam artifacts copied"
        artifacts_copied=true
    fi
    
    # Copy Base artifacts
    if [ -d "apps/smart-contracts/base/artifacts" ]; then
        mkdir -p build/contracts/base
        cp -r apps/smart-contracts/base/artifacts/* build/contracts/base/ 2>/dev/null || true
        print_status "Base artifacts copied"
        artifacts_copied=true
    fi
    
    if [ "$artifacts_copied" = "true" ]; then
        print_success "Contract artifacts generated in build/contracts/"
    else
        print_warning "No contract artifacts found to copy"
    fi
}

# Function to validate contract builds based on successful builds
validate_builds() {
    local build_results
    build_results=("$@")
    
    if [ ${#build_results[@]} -eq 0 ]; then
        print_warning "No build results to validate"
        return 0
    fi
    
    print_status "Validating contract builds..."
    
    local validation_failed
    validation_failed=false
    
    for result in "${build_results[@]}"; do
        local network
        network="${result%:*}"
        local status
        status="${result#*:}"
        
        # Only validate successful builds
        if [ "$status" = "success" ]; then
            case "$network" in
                "polygon")
                    if [ -d "apps/smart-contracts/polygon/artifacts" ]; then
                        print_success "Polygon artifacts validated"
                    else
                        print_warning "Polygon build succeeded but no artifacts found"
                    fi
                    ;;
                "solana")
                    if [ -d "apps/smart-contracts/solana/target" ]; then
                        print_success "Solana artifacts validated"
                    else
                        print_warning "Solana build succeeded but no artifacts found"
                    fi
                    ;;
                "polkadot")
                    if [ -d "apps/smart-contracts/polkadot/target" ]; then
                        print_success "Polkadot artifacts validated"
                    else
                        print_warning "Polkadot build succeeded but no artifacts found"
                    fi
                    ;;
                "moonbeam")
                    if [ -d "apps/smart-contracts/moonbeam/artifacts" ]; then
                        print_success "Moonbeam artifacts validated"
                    else
                        print_warning "Moonbeam build succeeded but no artifacts found"
                    fi
                    ;;
                "base")
                    if [ -d "apps/smart-contracts/base/artifacts" ]; then
                        print_success "Base artifacts validated"
                    else
                        print_warning "Base build succeeded but no artifacts found"
                    fi
                    ;;
            esac
        fi
    done
    
    if [ "$validation_failed" = "true" ]; then
        print_error "Contract build validation failed"
        return 1
    fi
    
    print_success "Contract build validation completed"
    return 0
}

# Function to show build summary with results
# shellcheck disable=SC2120
show_build_summary_with_results() {
    local results
    results=("$@")
    
    print_status "Contract Build Summary:"
    echo "  Network: $NETWORK"
    echo "  Tests: $([ "$RUN_TESTS" = "true" ] && echo "Enabled" || echo "Skipped")"
    echo "  Documentation: $([ "$GENERATE_DOCS" = "true" ] && echo "Generated" || echo "Skipped")"
    echo "  Verification: $([ "$VERIFY_CONTRACTS" = "true" ] && echo "Attempted" || echo "Skipped")"
    echo "  Auto-install: $([ "$AUTO_INSTALL" = "true" ] && echo "Enabled" || echo "Disabled")"
    echo "  Deps check: $([ "$SKIP_DEPS_CHECK" = "true" ] && echo "Skipped" || echo "Enabled")"
    echo ""
    
    # Show build results
    if [ ${#results[@]} -gt 0 ]; then
        echo "Build Results:"
        for result in "${results[@]}"; do
            local network
            network="${result%:*}"
            local status
            status="${result#*:}"
            if [ "$status" = "success" ]; then
                echo -e "  ${GREEN}✓${NC} $network: Build successful"
            else
                echo -e "  ${RED}✗${NC} $network: Build failed"
            fi
        done
        echo ""
    fi
    
    if [ -d "build/contracts" ]; then
        echo "Contract Artifacts:"
        find build/contracts -name "*.json" -o -name "*.so" -o -name "node-template" | head -10
        echo ""
    fi
    
    echo "Deployment Commands:"
    for result in "${results[@]}"; do
        local network
        network="${result%:*}"
        local status
        status="${result#*:}"
        if [ "$status" = "success" ]; then
            case "$network" in
                "polygon")
                    echo "  Polygon: cd apps/smart-contracts/polygon && pnpm deploy:local"
                    ;;
                "solana")
                    echo "  Solana: cd apps/smart-contracts/solana && anchor deploy"
                    ;;
                "polkadot")
                    echo "  Polkadot: cd apps/smart-contracts/polkadot && ./target/release/node-template --dev"
                    ;;
                "moonbeam")
                    echo "  Moonbeam: cd apps/smart-contracts/moonbeam && pnpm deploy:local"
                    ;;
                "base")
                    echo "  Base: cd apps/smart-contracts/base && pnpm deploy:local"
                    ;;
            esac
        fi
    done
    
    # Show troubleshooting info for failed builds
    local has_failures
    has_failures=false
    for result in "${results[@]}"; do
        local status
        status="${result#*:}"
        if [ "$status" = "failed" ]; then
            has_failures=true
            break
        fi
    done
    
    if [ "$has_failures" = "true" ]; then
        echo ""
        echo "Troubleshooting Failed Builds:"
        echo "  - Check dependency installation: $DEPS_CHECK_SCRIPT --verbose"
        echo "  - Install missing tools: $INSTALL_SCRIPT --all"
        echo "  - Skip dependency check: SKIP_DEPS_CHECK=true $0"
        echo "  - Disable auto-install: AUTO_INSTALL=false $0"
        echo "  - Build specific network: $0 --network=<network>"
    fi
}

# Function to show build summary (legacy compatibility)
show_build_summary() {
    # shellcheck disable=SC2119
    show_build_summary_with_results
}

# Remove old show_help function - using enhanced version defined earlier

# Main build function with enhanced error handling and comprehensive reporting
main_build() {
    local overall_success
    overall_success=true
    
    log_info "=== BLOCKCHAIN CONTRACT BUILD STARTED ==="
    log_info "Network: $NETWORK"
    log_info "Run tests: $RUN_TESTS"
    log_info "Auto-install: $AUTO_INSTALL"
    log_info "Skip deps check: $SKIP_DEPS_CHECK"
    log_info "Log level: $LOG_LEVEL"
    echo ""
    
    # Set environment check status
    # shellcheck disable=SC2034
BUILD_REPORT_ENVIRONMENT_CHECK="success"
    
    # Pre-build validation for all networks if building all
    if [ "$NETWORK" = "all" ] && [ "$SKIP_DEPS_CHECK" != "true" ]; then
        log_info "Running pre-build validation for all networks..."
        show_progress "Validating build environment" 3
        
        if ! validate_environment "all"; then
            # shellcheck disable=SC2034
BUILD_REPORT_ENVIRONMENT_CHECK="failed"
            log_error "Pre-build validation failed. Some networks may not build successfully."
            log_info "Continuing with individual network validation..."
        else
            log_success "Pre-build validation completed successfully"
        fi
    fi
    
    case $NETWORK in
        polygon)
            log_info "Building Polygon network contracts..."
            if ! build_polygon; then
                overall_success=false
            fi
            ;;
        solana)
            log_info "Building Solana network programs..."
            if ! build_solana; then
                overall_success=false
            fi
            ;;
        polkadot)
            log_info "Building Polkadot network pallets..."
            if ! build_polkadot; then
                overall_success=false
            fi
            ;;
        moonbeam)
            log_info "Building Moonbeam network contracts..."
            if ! build_moonbeam; then
                overall_success=false
            fi
            ;;
        base)
            log_info "Building Base network contracts..."
            if ! build_base; then
                overall_success=false
            fi
            ;;
        all)
            log_info "Building contracts for all supported networks..."
            
            # Build each network individually and track results
            log_info "=== Building Polygon Contracts ==="
            if ! build_polygon; then
                overall_success=false
            fi
            
            log_info "=== Building Solana Programs ==="
            if ! build_solana; then
                overall_success=false
            fi
            
            log_info "=== Building Polkadot Pallets ==="
            if ! build_polkadot; then
                overall_success=false
            fi
            
            log_info "=== Building Moonbeam Contracts ==="
            if ! build_moonbeam; then
                overall_success=false
            fi
            
            log_info "=== Building Base Contracts ==="
            if ! build_base; then
                overall_success=false
            fi
            ;;
        *)
            log_error "Unknown network: $NETWORK"
            show_help
            exit 1
            ;;
    esac
    
    # Generate artifacts for successful builds
    log_info "Generating build artifacts and documentation..."
    if command -v generate_artifacts >/dev/null 2>&1; then
        generate_artifacts
    fi
    
    # Cleanup and generate final reports
    cleanup_logging
    
    if [ "$overall_success" = "true" ]; then
        log_success "=== CONTRACT BUILD COMPLETED SUCCESSFULLY ==="
        return 0
    else
        log_error "=== CONTRACT BUILD COMPLETED WITH FAILURES ==="
        log_info "Check the build summary and report files for details"
        return 1
    fi
}

# Parse command line arguments
parse_build_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --network=*)
                NETWORK="${1#*=}"
                shift
                ;;
            --network)
                NETWORK="$2"
                shift 2
                ;;
            --skip-tests)
                RUN_TESTS="false"
                shift
                ;;
            --generate-docs)
                GENERATE_DOCS="true"
                shift
                ;;
            --verify)
                VERIFY_CONTRACTS="true"
                shift
                ;;
            --no-auto-install)
                AUTO_INSTALL="false"
                shift
                ;;
            --skip-deps|--skip-deps-check)
                SKIP_DEPS_CHECK="true"
                shift
                ;;
            --verbose)
                VERBOSE_MODE=true
                shift
                ;;
            --interactive)
                INTERACTIVE_MODE=true
                shift
                ;;
            --diagnose)
                DIAGNOSE_MODE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 2
                ;;
        esac
    done
    
    # Validate network argument
    case "$NETWORK" in
        polygon|solana|polkadot|moonbeam|base|all)
            ;;
        *)
            print_error "Invalid network: $NETWORK"
            print_error "Supported networks: polygon, solana, polkadot, moonbeam, base, all"
            exit 2
            ;;
    esac
}

# Initialize and execute build
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Initialize help system if available
    if command -v init_help_system >/dev/null 2>&1; then
        init_help_system "$(basename "$0")"
    fi
    
    # Parse command line arguments
    parse_build_arguments "$@"
    
    # Handle special modes first
    if [[ "$DIAGNOSE_MODE" == true ]]; then
        run_build_environment_diagnosis
        exit $?
    fi
    
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        run_interactive_build_troubleshooting
        exit $?
    fi
    
    # Set verbose mode if requested
    if [[ "$VERBOSE_MODE" == true ]]; then
        set -x  # Enable bash debugging
    fi
    
    # Execute main build with proper exit code handling
    if main_build; then
        exit 0
    else
        # If build failed and not in interactive mode, offer help
        if [[ "$INTERACTIVE_MODE" != true ]] && [[ -t 0 ]] && [[ -z "${CI:-}" ]]; then
            echo ""
            log_info "Build failed. For troubleshooting assistance:"
            echo "  • Run: $0 --interactive"
            echo "  • Run: $0 --diagnose"
            echo "  • Run: $0 --verbose (for detailed output)"
            echo "  • Check build logs and error messages above"
        fi
        exit 1
    fi
fi