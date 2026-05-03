#!/bin/bash

# Interactive Help and Guidance System
# Provides comprehensive help, troubleshooting, and environment diagnosis
# for blockchain development environment setup

set -euo pipefail

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Status indicators
CHECK_MARK="✓"
CROSS_MARK="✗"
WARNING_MARK="⚠"
INFO_MARK="ℹ"
QUESTION_MARK="?"

# Global variables
VERBOSE=false
INTERACTIVE=true
SCRIPT_NAME=""

# Initialize help system
init_help_system() {
    # shellcheck disable=SC2034
    SCRIPT_NAME="$1"
    
    # Check if running in CI or non-interactive environment
    if [[ -n "${CI:-}" ]] || [[ ! -t 0 ]]; then
        # shellcheck disable=SC2034
INTERACTIVE=false
    fi
}

# Logging functions with enhanced formatting
log_info() {
    echo -e "${BLUE}${INFO_MARK}${NC} $1"
}

log_success() {
    echo -e "${GREEN}${CHECK_MARK}${NC} $1"
}

log_error() {
    echo -e "${RED}${CROSS_MARK}${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}${WARNING_MARK}${NC} $1"
}

log_question() {
    echo -e "${CYAN}${QUESTION_MARK}${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${MAGENTA}[DEBUG]${NC} $1"
    fi
}

log_section() {
    echo ""
    echo -e "${CYAN}=== $1 ===${NC}"
    echo ""
}

# Interactive prompt function
prompt_user() {
    local question
    question="$1"
    local default_answer
    default_answer="${2:-}"
    local response
    
    if [[ "$INTERACTIVE" == false ]]; then
        if [[ -n "$default_answer" ]]; then
            echo "$default_answer"
            return 0
        else
            return 1
        fi
    fi
    
    if [[ -n "$default_answer" ]]; then
        read -r -p "$(echo -e "${CYAN}${QUESTION_MARK}${NC} $question [${default_answer}]: ")" response
        response="${response:-$default_answer}"
    else
        read -r -p "$(echo -e "${CYAN}${QUESTION_MARK}${NC} $question: ")" response
    fi
    
    echo "$response"
}

# Yes/No prompt function
prompt_yes_no() {
    local question
    question="$1"
    local default
    default="${2:-n}"
    local response
    
    if [[ "$INTERACTIVE" == false ]]; then
        [[ "$default" == "y" ]] && return 0 || return 1
    fi
    
    while true; do
        if [[ "$default" == "y" ]]; then
            response=$(prompt_user "$question (y/N)" "y")
        else
            response=$(prompt_user "$question (y/N)" "n")
        fi
        
        case "${response,,}" in
            y|yes) return 0 ;;
            n|no) return 1 ;;
            *) log_warning "Please answer 'y' or 'n'" ;;
        esac
    done
}

# Multi-choice prompt function
prompt_choice() {
    local question
    question="$1"
    shift
    local choices
    choices=("$@")
    local response
    
    if [[ "$INTERACTIVE" == false ]]; then
        echo "${choices[0]}"
        return 0
    fi
    
    echo -e "${CYAN}${QUESTION_MARK}${NC} $question"
    for i in "${!choices[@]}"; do
        echo "  $((i+1)). ${choices[i]}"
    done
    
    while true; do
        read -r -p "Enter choice (1-${#choices[@]}): " response
        
        if [[ "$response" =~ ^[0-9]+$ ]] && [[ "$response" -ge 1 ]] && [[ "$response" -le "${#choices[@]}" ]]; then
            echo "${choices[$((response-1))]}"
            return 0
        else
            log_warning "Please enter a number between 1 and ${#choices[@]}"
        fi
    done
}

# Environment diagnosis function
diagnose_environment() {
    local network
    network="${1:-all}"
    
    log_section "Environment Diagnosis"
    
    log_info "Diagnosing blockchain development environment for: $network"
    log_info "Platform: $(uname -s) $(uname -m)"
    log_info "Shell: ${SHELL:-unknown}"
    echo ""
    
    # Diagnose core dependencies
    diagnose_core_dependencies
    
    # Network-specific diagnosis
    case "$network" in
        "polygon"|"moonbeam"|"base")
            diagnose_polygon_environment
            ;;
        "solana")
            diagnose_solana_environment
            ;;
        "polkadot")
            diagnose_polkadot_environment
            ;;
        "all")
            diagnose_polygon_environment
            diagnose_solana_environment
            diagnose_polkadot_environment
            ;;
        *)
            log_error "Unknown network for diagnosis: $network"
            return 1
            ;;
    esac
    
    # Provide recommendations
    provide_environment_recommendations "$network"
}

# Diagnose core dependencies
diagnose_core_dependencies() {
    log_section "Core Dependencies Diagnosis"
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version 2>/dev/null)
        log_success "Node.js: $node_version"
        
        # Check if version meets requirements
        local version_number
        # shellcheck disable=SC2001
        version_number=$(echo "$node_version" | sed 's/v//')
        if version_compare "$version_number" "20.0.0"; then
            log_verbose "Node.js version meets requirements (20+)"
        else
            log_warning "Node.js version may be too old (required: 20+)"
        fi
    else
        log_error "Node.js: Not found"
    fi
    
    # Check pnpm
    if command -v pnpm >/dev/null 2>&1; then
        local pnpm_version
        pnpm_version=$(pnpm --version 2>/dev/null)
        log_success "pnpm: $pnpm_version"
    else
        log_error "pnpm: Not found"
    fi
    
    # Check npm (fallback)
    if command -v npm >/dev/null 2>&1; then
        local npm_version
        npm_version=$(npm --version 2>/dev/null)
        log_success "npm: $npm_version"
    else
        log_warning "npm: Not found"
    fi
    
    # Check Git
    if command -v git >/dev/null 2>&1; then
        local git_version
        git_version=$(git --version 2>/dev/null)
        log_success "Git: $git_version"
    else
        log_warning "Git: Not found"
    fi
}

# Diagnose Polygon environment
diagnose_polygon_environment() {
    log_section "Polygon/Hardhat Environment Diagnosis"
    
    # Check project structure
    if [[ -f "apps/smart-contracts/polygon/package.json" ]]; then
        log_success "Polygon project structure: Found"
        
        # Check Hardhat configuration
        if [[ -f "apps/smart-contracts/polygon/hardhat.config.js" ]]; then
            log_success "Hardhat configuration: Found"
        else
            log_error "Hardhat configuration: Missing"
        fi
        
        # Check for contracts
        if [[ -d "apps/smart-contracts/polygon/contracts" ]]; then
            local contract_count
            contract_count=$(find apps/smart-contracts/polygon/contracts -name "*.sol" | wc -l)
            log_success "Solidity contracts: $contract_count found"
        else
            log_warning "Contracts directory: Not found"
        fi
        
        # Check dependencies
        if [[ -d "apps/smart-contracts/polygon/node_modules" ]]; then
            log_success "Node modules: Installed"
        else
            log_warning "Node modules: Not installed"
        fi
    else
        log_error "Polygon project structure: Not found"
    fi
}

# Diagnose Solana environment
diagnose_solana_environment() {
    log_section "Solana/Anchor Environment Diagnosis"
    
    # Check Rust
    if command -v rustc >/dev/null 2>&1; then
        local rust_version
        rust_version=$(rustc --version 2>/dev/null)
        log_success "Rust: $rust_version"
        
        # Check Cargo
        if command -v cargo >/dev/null 2>&1; then
            local cargo_version
            cargo_version=$(cargo --version 2>/dev/null)
            log_success "Cargo: $cargo_version"
        else
            log_error "Cargo: Not found"
        fi
    else
        log_error "Rust: Not found"
    fi
    
    # Check Solana CLI
    if command -v solana >/dev/null 2>&1; then
        local solana_version
        solana_version=$(solana --version 2>/dev/null)
        log_success "Solana CLI: $solana_version"
        
        # Check Solana configuration
        if solana config get >/dev/null 2>&1; then
            local rpc_url
            rpc_url=$(solana config get | grep "RPC URL" | awk '{print $3}')
            log_success "Solana RPC URL: $rpc_url"
        else
            log_warning "Solana CLI: Not configured"
        fi
    else
        log_error "Solana CLI: Not found"
    fi
    
    # Check Anchor CLI
    if command -v anchor >/dev/null 2>&1; then
        local anchor_version
        anchor_version=$(anchor --version 2>/dev/null)
        log_success "Anchor CLI: $anchor_version"
    else
        log_error "Anchor CLI: Not found"
    fi
    
    # Check project structure
    if [[ -f "apps/smart-contracts/solana/Anchor.toml" ]]; then
        log_success "Anchor project structure: Found"
        
        # Check for programs
        if [[ -d "apps/smart-contracts/solana/programs" ]]; then
            local program_count
            program_count=$(find apps/smart-contracts/solana/programs -name "lib.rs" | wc -l)
            log_success "Solana programs: $program_count found"
        else
            log_warning "Programs directory: Not found"
        fi
    else
        log_error "Anchor project structure: Not found"
    fi
}

# Diagnose Polkadot environment
diagnose_polkadot_environment() {
    log_section "Polkadot/Substrate Environment Diagnosis"
    
    # Check Rust (already checked in Solana, but verify WASM target)
    if command -v rustup >/dev/null 2>&1; then
        if rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
            log_success "WebAssembly target: Installed"
        else
            log_error "WebAssembly target: Not installed"
        fi
    else
        log_warning "rustup: Not found (cannot verify WASM target)"
    fi
    
    # Check cargo-contract
    if command -v cargo-contract >/dev/null 2>&1; then
        local contract_version
        contract_version=$(cargo-contract --version 2>/dev/null)
        log_success "cargo-contract: $contract_version"
    else
        log_error "cargo-contract: Not found"
    fi
    
    # Check substrate-contracts-node
    if command -v substrate-contracts-node >/dev/null 2>&1; then
        log_success "substrate-contracts-node: Available"
    else
        log_warning "substrate-contracts-node: Not found (optional)"
    fi
    
    # Check project structure
    if [[ -f "apps/smart-contracts/polkadot/pallet-todo/Cargo.toml" ]]; then
        log_success "Substrate pallet structure: Found"
    else
        log_error "Substrate pallet structure: Not found"
    fi
    
    if [[ -f "apps/smart-contracts/polkadot/runtime/Cargo.toml" ]]; then
        log_success "Substrate runtime structure: Found"
    else
        log_error "Substrate runtime structure: Not found"
    fi
}

# Provide environment recommendations
provide_environment_recommendations() {
    local network
    network="$1"
    
    log_section "Environment Recommendations"
    
    local recommendations
    recommendations=()
    
    # Check for common issues and provide recommendations
    if ! command -v node >/dev/null 2>&1; then
        recommendations+=("Install Node.js 20+ from https://nodejs.org/")
    fi
    
    if ! command -v pnpm >/dev/null 2>&1; then
        recommendations+=("Install pnpm: npm install -g pnpm")
    fi
    
    case "$network" in
        "polygon"|"moonbeam"|"base"|"all")
            if [[ ! -d "apps/smart-contracts/polygon/node_modules" ]]; then
                recommendations+=("Install Polygon dependencies: cd apps/smart-contracts/polygon && pnpm install")
            fi
            ;;
    esac
    
    case "$network" in
        "solana"|"all")
            if ! command -v rustc >/dev/null 2>&1; then
                recommendations+=("Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh")
            fi
            
            if ! command -v solana >/dev/null 2>&1; then
                recommendations+=("Install Solana CLI: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\"")
            fi
            
            if ! command -v anchor >/dev/null 2>&1; then
                recommendations+=("Install Anchor CLI: cargo install --git https://github.com/coral-xyz/anchor avm")
            fi
            ;;
    esac
    
    case "$network" in
        "polkadot"|"all")
            if command -v rustup >/dev/null 2>&1 && ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
                recommendations+=("Install WASM target: rustup target add wasm32-unknown-unknown")
            fi
            
            if ! command -v cargo-contract >/dev/null 2>&1; then
                recommendations+=("Install cargo-contract: cargo install cargo-contract")
            fi
            ;;
    esac
    
    if [[ ${#recommendations[@]} -eq 0 ]]; then
        log_success "Environment looks good! No immediate recommendations."
    else
        log_info "Recommended actions:"
        for i in "${!recommendations[@]}"; do
            echo "  $((i+1)). ${recommendations[i]}"
        done
    fi
}

# Interactive troubleshooting guide
interactive_troubleshooting() {
    local issue_type
    issue_type="$1"
    
    log_section "Interactive Troubleshooting Guide"
    
    case "$issue_type" in
        "build-failure")
            troubleshoot_build_failure
            ;;
        "dependency-missing")
            troubleshoot_missing_dependencies
            ;;
        "network-specific")
            troubleshoot_network_specific
            ;;
        "general")
            troubleshoot_general_issues
            ;;
        *)
            log_info "Available troubleshooting categories:"
            echo "  • build-failure: Contract compilation issues"
            echo "  • dependency-missing: Missing tools or dependencies"
            echo "  • network-specific: Network-specific problems"
            echo "  • general: General environment issues"
            ;;
    esac
}

# Troubleshoot build failures
troubleshoot_build_failure() {
    log_info "Let's troubleshoot your build failure step by step."
    echo ""
    
    # Determine which network is failing
    local network
    network=$(prompt_choice "Which network is experiencing build failures?" \
        "Polygon/Hardhat" \
        "Solana/Anchor" \
        "Polkadot/Substrate" \
        "All networks")
    
    case "$network" in
        "Polygon/Hardhat")
            troubleshoot_polygon_build
            ;;
        "Solana/Anchor")
            troubleshoot_solana_build
            ;;
        "Polkadot/Substrate")
            troubleshoot_polkadot_build
            ;;
        "All networks")
            log_info "This suggests a core dependency issue."
            troubleshoot_core_dependencies
            ;;
    esac
}

# Troubleshoot Polygon build issues
troubleshoot_polygon_build() {
    log_info "Troubleshooting Polygon/Hardhat build issues..."
    echo ""
    
    # Check common Polygon issues
    local issue
    issue=$(prompt_choice "What type of error are you seeing?" \
        "Compilation errors in Solidity contracts" \
        "Missing dependencies or modules" \
        "Hardhat configuration issues" \
        "OpenZeppelin compatibility issues" \
        "Network connection problems")
    
    case "$issue" in
        "Compilation errors in Solidity contracts")
            log_info "Common Solidity compilation fixes:"
            echo "  • Check pragma solidity version in contracts"
            echo "  • Verify import paths are correct"
            echo "  • Ensure all dependencies are installed"
            echo "  • Run: npx hardhat compile --verbose"
            echo ""
            
            if prompt_yes_no "Would you like to run a verbose compilation now?"; then
                log_info "Running verbose compilation..."
                cd apps/smart-contracts/polygon 2>/dev/null || {
                    log_error "Cannot find Polygon contracts directory"
                    return 1
                }
                npx hardhat compile --verbose || true
                cd ../../..
            fi
            ;;
        "Missing dependencies or modules")
            log_info "Fixing missing dependencies:"
            echo "  • Run: cd apps/smart-contracts/polygon && pnpm install"
            echo "  • Check package.json for correct versions"
            echo "  • Clear node_modules and reinstall if needed"
            echo ""
            
            if prompt_yes_no "Would you like to reinstall dependencies now?"; then
                log_info "Reinstalling Polygon dependencies..."
                cd apps/smart-contracts/polygon 2>/dev/null || {
                    log_error "Cannot find Polygon contracts directory"
                    return 1
                }
                rm -rf node_modules package-lock.json 2>/dev/null || true
                pnpm install || true
                cd ../../..
            fi
            ;;
        "OpenZeppelin compatibility issues")
            log_info "OpenZeppelin v4.9+ breaking changes:"
            echo "  • Ownable constructor: use Ownable(initialOwner)"
            echo "  • Counters library deprecated"
            echo "  • AccessControl changes"
            echo "  • Check migration guide: https://docs.openzeppelin.com/contracts/4.x/upgrades"
            ;;
    esac
}

# Troubleshoot Solana build issues
troubleshoot_solana_build() {
    log_info "Troubleshooting Solana/Anchor build issues..."
    echo ""
    
    local issue
    issue=$(prompt_choice "What type of error are you seeing?" \
        "Rust compilation errors" \
        "Anchor CLI not found or outdated" \
        "Solana CLI configuration issues" \
        "Program deployment failures" \
        "Test failures")
    
    case "$issue" in
        "Rust compilation errors")
            log_info "Common Rust compilation fixes:"
            echo "  • Update Rust: rustup update"
            echo "  • Check Rust version: rustc --version (need 1.70+)"
            echo "  • Clean build: anchor clean && anchor build"
            echo "  • Check Cargo.toml dependencies"
            echo ""
            
            if prompt_yes_no "Would you like to update Rust now?"; then
                log_info "Updating Rust..."
                rustup update || true
            fi
            ;;
        "Anchor CLI not found or outdated")
            log_info "Fixing Anchor CLI issues:"
            echo "  • Install AVM: cargo install --git https://github.com/coral-xyz/anchor avm"
            echo "  • Install latest Anchor: avm install latest && avm use latest"
            echo "  • Verify installation: anchor --version"
            echo ""
            
            if prompt_yes_no "Would you like to install/update Anchor now?"; then
                log_info "Installing Anchor CLI..."
                cargo install --git https://github.com/coral-xyz/anchor avm --locked --force || true
                avm install latest || true
                avm use latest || true
            fi
            ;;
        "Solana CLI configuration issues")
            log_info "Fixing Solana CLI configuration:"
            echo "  • Set cluster: solana config set --url devnet"
            echo "  • Check config: solana config get"
            echo "  • Generate keypair: solana-keygen new"
            echo ""
            
            if prompt_yes_no "Would you like to configure Solana CLI now?"; then
                log_info "Configuring Solana CLI..."
                solana config set --url devnet || true
                solana config get || true
            fi
            ;;
    esac
}

# Troubleshoot Polkadot build issues
troubleshoot_polkadot_build() {
    log_info "Troubleshooting Polkadot/Substrate build issues..."
    echo ""
    
    local issue
    issue=$(prompt_choice "What type of error are you seeing?" \
        "Rust compilation errors" \
        "Missing WebAssembly target" \
        "cargo-contract not found" \
        "Protocol Buffers compiler missing" \
        "Substrate runtime build failures")
    
    case "$issue" in
        "Missing WebAssembly target")
            log_info "Installing WebAssembly target:"
            echo "  • Add WASM target: rustup target add wasm32-unknown-unknown"
            echo "  • Add rust-src: rustup component add rust-src"
            echo ""
            
            if prompt_yes_no "Would you like to install WASM target now?"; then
                log_info "Installing WebAssembly target..."
                rustup target add wasm32-unknown-unknown || true
                rustup component add rust-src || true
            fi
            ;;
        "cargo-contract not found")
            log_info "Installing cargo-contract:"
            echo "  • Install: cargo install cargo-contract"
            echo "  • Update: cargo install --force cargo-contract"
            echo ""
            
            if prompt_yes_no "Would you like to install cargo-contract now?"; then
                log_info "Installing cargo-contract..."
                cargo install cargo-contract --force || true
            fi
            ;;
        "Protocol Buffers compiler missing")
            log_info "Installing Protocol Buffers compiler:"
            local platform
            platform=$(uname -s)
            case "$platform" in
                "Darwin")
                    echo "  • macOS: brew install protobuf"
                    if command -v brew >/dev/null 2>&1 && prompt_yes_no "Install protobuf via Homebrew?"; then
                        brew install protobuf || true
                    fi
                    ;;
                "Linux")
                    echo "  • Ubuntu/Debian: sudo apt install protobuf-compiler"
                    echo "  • Fedora: sudo dnf install protobuf-compiler"
                    echo "  • Arch: sudo pacman -S protobuf"
                    ;;
            esac
            ;;
    esac
}

# Troubleshoot core dependencies
troubleshoot_core_dependencies() {
    log_info "Troubleshooting core dependencies..."
    echo ""
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is not installed"
        if prompt_yes_no "Would you like guidance on installing Node.js?"; then
            log_info "Node.js installation options:"
            echo "  • Official installer: https://nodejs.org/"
            echo "  • Using nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
            echo "  • Using package manager (macOS): brew install node"
        fi
    fi
    
    # Check pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        log_error "pnpm is not installed"
        if prompt_yes_no "Would you like to install pnpm now?"; then
            log_info "Installing pnpm..."
            npm install -g pnpm || true
        fi
    fi
}

# Version comparison helper
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

# Show comprehensive help
show_comprehensive_help() {
    local script_name
    script_name="$1"
    
    cat << EOF
$(echo -e "${CYAN}=== Blockchain Development Environment Help ===${NC}")

$(echo -e "${GREEN}SCRIPT:${NC} $script_name")

$(echo -e "${YELLOW}DESCRIPTION:${NC}")
  Interactive help and guidance system for blockchain development environment setup.
  Provides comprehensive troubleshooting, environment diagnosis, and step-by-step
  assistance for resolving common issues.

$(echo -e "${YELLOW}USAGE:${NC}")
  $script_name [OPTIONS] [COMMAND]

$(echo -e "${YELLOW}COMMANDS:${NC}")
  diagnose [NETWORK]     Diagnose environment for specific network or all
  troubleshoot [TYPE]    Interactive troubleshooting guide
  help                   Show this help message

$(echo -e "${YELLOW}OPTIONS:${NC}")
  --verbose             Enable verbose output and debugging information
  --non-interactive     Disable interactive prompts (for CI/CD)
  --network=NETWORK     Target specific network (polygon|solana|polkadot|all)

$(echo -e "${YELLOW}NETWORKS:${NC}")
  polygon               Polygon/Hardhat smart contracts
  solana                Solana/Anchor programs
  polkadot              Polkadot/Substrate pallets
  moonbeam              Moonbeam (Ethereum-compatible on Polkadot)
  base                  Base (Ethereum L2)
  all                   All supported networks (default)

$(echo -e "${YELLOW}TROUBLESHOOTING TYPES:${NC}")
  build-failure         Contract compilation issues
  dependency-missing    Missing tools or dependencies
  network-specific      Network-specific problems
  general               General environment issues

$(echo -e "${YELLOW}EXAMPLES:${NC}")
  $script_name diagnose                    # Diagnose all networks
  $script_name diagnose solana             # Diagnose Solana environment
  $script_name troubleshoot build-failure  # Interactive build troubleshooting
  $script_name --verbose diagnose          # Verbose environment diagnosis

$(echo -e "${YELLOW}ENVIRONMENT VARIABLES:${NC}")
  CI                    Set to disable interactive prompts
  VERBOSE               Set to 'true' to enable verbose output

$(echo -e "${YELLOW}COMMON ISSUES AND SOLUTIONS:${NC}")

$(echo -e "${CYAN}Node.js Issues:${NC}")
  • Version too old: Update to Node.js 20+ from https://nodejs.org/
  • Not found: Install via package manager or official installer
  • Permission errors: Use nvm for user-level installation

$(echo -e "${CYAN}Rust Issues:${NC}")
  • Not installed: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  • Version too old: rustup update
  • Missing components: rustup component add rust-src

$(echo -e "${CYAN}Solana Issues:${NC}")
  • CLI not found: sh -c "\$(curl -sSfL https://release.solana.com/stable/install)"
  • Not configured: solana config set --url devnet
  • Anchor missing: cargo install --git https://github.com/coral-xyz/anchor avm

$(echo -e "${CYAN}Polygon Issues:${NC}")
  • Dependencies missing: cd apps/smart-contracts/polygon && pnpm install
  • Hardhat errors: npx hardhat compile --verbose
  • OpenZeppelin v4.9+: Check constructor changes

$(echo -e "${CYAN}Polkadot Issues:${NC}")
  • WASM target missing: rustup target add wasm32-unknown-unknown
  • cargo-contract missing: cargo install cargo-contract
  • protobuf missing: Install via system package manager

$(echo -e "${YELLOW}GETTING HELP:${NC}")
  • Run interactive diagnosis: $script_name diagnose
  • Use troubleshooting guide: $script_name troubleshoot
  • Check verbose output: $script_name --verbose diagnose
  • Review documentation in docs/ directory

$(echo -e "${YELLOW}RELATED SCRIPTS:${NC}")
  • scripts/blockchain-deps-check.sh    - Dependency verification
  • scripts/install-blockchain-tools.sh - Automated installation
  • scripts/build-contracts.sh          - Contract compilation

EOF
}

# Main help function that can be sourced by other scripts
main_help() {
    local command
    command="${1:-help}"
    local network
    network="${2:-all}"
    
    case "$command" in
        "diagnose")
            diagnose_environment "$network"
            ;;
        "troubleshoot")
            interactive_troubleshooting "${2:-general}"
            ;;
        "help"|"--help"|"-h")
            show_comprehensive_help "$(basename "${BASH_SOURCE[0]}")"
            ;;
        *)
            log_error "Unknown command: $command"
            show_comprehensive_help "$(basename "${BASH_SOURCE[0]}")"
            return 1
            ;;
    esac
}

# If script is run directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Parse command line arguments
    VERBOSE=false
    INTERACTIVE=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                # shellcheck disable=SC2034
VERBOSE=true
                shift
                ;;
            --non-interactive)
                # shellcheck disable=SC2034
INTERACTIVE=false
                shift
                ;;
            --network=*)
                # shellcheck disable=SC2034
                NETWORK="${1#*=}"
                shift
                ;;
            --help|-h)
                show_comprehensive_help "$(basename "$0")"
                exit 0
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Initialize help system
    init_help_system "$(basename "$0")"
    
    # Run main help function
    main_help "$@"
fi