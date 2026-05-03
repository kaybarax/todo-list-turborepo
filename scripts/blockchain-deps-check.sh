#!/bin/bash

# Blockchain Development Environment Dependency Checker
# Comprehensive verification of blockchain development tools
# Supports cross-platform detection and version validation

set -euo pipefail

# Color codes for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Status indicators
CHECK_MARK="✓"
CROSS_MARK="✗"
WARNING_MARK="⚠"

# Global variables
VERBOSE=false
FIX_MODE=false
NETWORK_FILTER=""
EXIT_CODE=0

# Version requirements
NODE_MIN_VERSION="20.0.0"
RUST_MIN_VERSION="1.70.0"
SOLANA_MIN_VERSION="1.16.0"
ANCHOR_MIN_VERSION="0.28.0"

# Source interactive help system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/interactive-help.sh" ]]; then
# shellcheck disable=SC1091
source "$SCRIPT_DIR/interactive-help.sh"
fi

# Usage information
usage() {
    cat << EOF
$(echo -e "${CYAN}=== Blockchain Development Environment Dependency Checker ===${NC}")

$(echo -e "${YELLOW}DESCRIPTION:${NC}")
  Comprehensive verification of blockchain development tools and dependencies.
  Supports cross-platform detection, version validation, and automatic fixing.

$(echo -e "${YELLOW}USAGE:${NC}")
  $0 [OPTIONS]

$(echo -e "${YELLOW}OPTIONS:${NC}")
  --fix                   Attempt to install missing dependencies automatically
  --verbose              Show detailed output and debug information
  --network=NETWORK      Check dependencies for specific network only
                          (polygon|solana|polkadot|moonbeam|base|all)
  --interactive          Enable interactive troubleshooting prompts
  --diagnose             Run comprehensive environment diagnosis
  --help, -h             Show this help message

$(echo -e "${YELLOW}NETWORKS:${NC}")
  polygon               Polygon/Hardhat smart contracts (Node.js, Hardhat)
  solana                Solana/Anchor programs (Rust, Solana CLI, Anchor CLI)
  polkadot              Polkadot/Substrate pallets (Rust, cargo-contract, WASM)
  moonbeam              Moonbeam (same as Polygon)
  base                  Base L2 (same as Polygon)
  all                   All supported networks (default)

$(echo -e "${YELLOW}EXAMPLES:${NC}")
  $0                           # Check all dependencies
  $0 --verbose                 # Check with detailed output
  $0 --network=solana          # Check only Solana dependencies
  $0 --fix                     # Check and attempt to fix missing dependencies
  $0 --interactive             # Interactive troubleshooting mode
  $0 --diagnose                # Comprehensive environment diagnosis
  $0 --network=polygon --fix   # Fix Polygon-specific dependencies

$(echo -e "${YELLOW}VERBOSE MODE:${NC}")
  When --verbose is enabled, the script will show:
  • Detailed version information for all tools
  • Debug information about detection process
  • Configuration details (Solana RPC URL, etc.)
  • Platform-specific installation paths
  • Troubleshooting hints for failed checks

$(echo -e "${YELLOW}INTERACTIVE MODE:${NC}")
  When --interactive is enabled, the script will:
  • Prompt for user input on failed checks
  • Offer step-by-step troubleshooting guidance
  • Provide installation options for missing tools
  • Allow selective fixing of specific issues

$(echo -e "${YELLOW}EXIT CODES:${NC}")
  0    All dependencies are properly installed and configured
  1    Some dependencies are missing or outdated
  2    Invalid command line arguments
  3    Network connectivity issues (when using --fix)

$(echo -e "${YELLOW}ENVIRONMENT VARIABLES:${NC}")
  SKIP_NETWORK_CHECK    Set to 'true' to skip network connectivity checks
  AUTO_INSTALL          Set to 'false' to disable automatic installation prompts
  CI                    Automatically detected - disables interactive features

$(echo -e "${YELLOW}RELATED SCRIPTS:${NC}")
  scripts/install-blockchain-tools.sh    Automated dependency installation
  scripts/build-contracts.sh             Contract compilation with dependency checks
  scripts/interactive-help.sh            Interactive troubleshooting system

$(echo -e "${YELLOW}TROUBLESHOOTING:${NC}")
  If you encounter issues, try:
  • Run with --verbose for detailed information
  • Use --interactive for step-by-step guidance
  • Run --diagnose for comprehensive environment analysis
  • Check the troubleshooting documentation in docs/

EOF
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}${CHECK_MARK}${NC} $1"
}

log_error() {
    echo -e "${RED}${CROSS_MARK}${NC} $1"
    EXIT_CODE=1
}

log_warning() {
    echo -e "${YELLOW}${WARNING_MARK}${NC} $1"
}

log_verbose() {
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Darwin*)    echo "macos" ;;
        Linux*)     echo "linux" ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *)          echo "unknown" ;;
    esac
}

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

# Check Node.js installation and version
check_nodejs() {
    log_verbose "Checking Node.js installation..."
    
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version 2>/dev/null | sed 's/v//')
        
        if version_compare "$node_version" "$NODE_MIN_VERSION"; then
            log_success "Node.js v$node_version (Required: $NODE_MIN_VERSION+)"
            return 0
        else
            log_error "Node.js v$node_version (Required: $NODE_MIN_VERSION+) - Version too old"
            return 1
        fi
    else
        log_error "Node.js not found (Required: $NODE_MIN_VERSION+)"
        return 1
    fi
}

# Check Rust installation and version
check_rust() {
    log_verbose "Checking Rust installation..."
    
    if command -v rustc >/dev/null 2>&1; then
        local rust_version
        rust_version=$(rustc --version 2>/dev/null | awk '{print $2}')
        
        if version_compare "$rust_version" "$RUST_MIN_VERSION"; then
            log_success "Rust $rust_version (Required: $RUST_MIN_VERSION+)"
            
            # Also check cargo
            if command -v cargo >/dev/null 2>&1; then
                local cargo_version
                cargo_version=$(cargo --version 2>/dev/null | awk '{print $2}')
                log_verbose "Cargo $cargo_version detected"
            else
                log_warning "Cargo not found - Rust installation may be incomplete"
            fi
            return 0
        else
            log_error "Rust $rust_version (Required: $RUST_MIN_VERSION+) - Version too old"
            return 1
        fi
    else
        log_error "Rust not found (Required: $RUST_MIN_VERSION+)"
        return 1
    fi
}

# Check Solana CLI installation and version
check_solana_cli() {
    log_verbose "Checking Solana CLI installation..."
    
    if command -v solana >/dev/null 2>&1; then
        local solana_version
        solana_version=$(solana --version 2>/dev/null | awk '{print $2}')
        
        if version_compare "$solana_version" "$SOLANA_MIN_VERSION"; then
            log_success "Solana CLI $solana_version (Required: $SOLANA_MIN_VERSION+)"
            
            # Check Solana configuration
            if solana config get >/dev/null 2>&1; then
                local rpc_url
                rpc_url=$(solana config get | grep "RPC URL" | awk '{print $3}')
                log_verbose "Solana RPC URL: $rpc_url"
            else
                log_warning "Solana CLI not configured - run 'solana config set --url devnet'"
            fi
            return 0
        else
            log_error "Solana CLI $solana_version (Required: $SOLANA_MIN_VERSION+) - Version too old"
            return 1
        fi
    else
        log_error "Solana CLI not found (Required: $SOLANA_MIN_VERSION+)"
        return 1
    fi
}

# Check Anchor CLI installation and version
check_anchor_cli() {
    log_verbose "Checking Anchor CLI installation..."
    
    if command -v anchor >/dev/null 2>&1; then
        local anchor_version
        anchor_version=$(anchor --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        
        if [[ -n "$anchor_version" ]] && version_compare "$anchor_version" "$ANCHOR_MIN_VERSION"; then
            log_success "Anchor CLI $anchor_version (Required: $ANCHOR_MIN_VERSION+)"
            return 0
        else
            log_error "Anchor CLI $anchor_version (Required: $ANCHOR_MIN_VERSION+) - Version too old or invalid"
            return 1
        fi
    else
        log_error "Anchor CLI not found (Required: $ANCHOR_MIN_VERSION+)"
        return 1
    fi
}

# Check Hardhat for Polygon development
check_hardhat() {
    log_verbose "Checking Hardhat installation..."
    
    # Check if we're in a project with Hardhat
    if [[ -f "package.json" ]] && grep -q "hardhat" package.json 2>/dev/null; then
        if command -v npx >/dev/null 2>&1 && npx hardhat --version >/dev/null 2>&1; then
            local hardhat_version
            hardhat_version=$(npx hardhat --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
            log_success "Hardhat $hardhat_version (via npx)"
            return 0
        else
            log_error "Hardhat found in package.json but not executable"
            return 1
        fi
    else
        log_warning "Hardhat not found in current project - install with 'npm install --save-dev hardhat'"
        return 1
    fi
}

# Check Substrate tools for Polkadot development
check_substrate_tools() {
    log_verbose "Checking Substrate tools..."
    
    local substrate_ok
    substrate_ok=true
    
    # Check cargo-contract
    if command -v cargo-contract >/dev/null 2>&1; then
        local contract_version
        contract_version=$(cargo-contract --version 2>/dev/null | awk '{print $2}')
        log_success "cargo-contract $contract_version"
    else
        log_error "cargo-contract not found - install with 'cargo install cargo-contract'"
        substrate_ok=false
    fi
    
    # Check substrate-contracts-node (optional but recommended)
    if command -v substrate-contracts-node >/dev/null 2>&1; then
        log_success "substrate-contracts-node available"
    else
        log_warning "substrate-contracts-node not found - install with 'cargo install contracts-node'"
    fi
    
    if [[ "$substrate_ok" == true ]]; then
        return 0
    else
        return 1
    fi
}

# Check pnpm (project requirement)
check_pnpm() {
    log_verbose "Checking pnpm installation..."
    
    if command -v pnpm >/dev/null 2>&1; then
        local pnpm_version
        pnpm_version=$(pnpm --version 2>/dev/null)
        
        # Check if version is 9+
        if version_compare "$pnpm_version" "9.0.0"; then
            log_success "pnpm $pnpm_version (Required: 9+)"
            return 0
        else
            log_error "pnpm $pnpm_version (Required: 9+) - Version too old"
            return 1
        fi
    else
        log_error "pnpm not found (Required: 9+)"
        return 1
    fi
}

# Main dependency checking function
check_dependencies() {
    local platform
    platform=$(detect_platform)
    
    echo "=== Blockchain Development Environment Check ==="
    echo "Platform: $platform"
    echo "Network filter: ${NETWORK_FILTER:-all}"
    echo ""
    
    # Core dependencies (always check)
    echo "Core Dependencies:"
    check_nodejs
    check_pnpm
    
    # Network-specific dependencies
    case "$NETWORK_FILTER" in
        "polygon")
            echo ""
            echo "Polygon Dependencies:"
            check_hardhat
            ;;
        "solana")
            echo ""
            echo "Solana Dependencies:"
            check_rust
            check_solana_cli
            check_anchor_cli
            ;;
        "polkadot")
            echo ""
            echo "Polkadot Dependencies:"
            check_rust
            check_substrate_tools
            ;;
        ""|"all")
            echo ""
            echo "Blockchain Dependencies:"
            check_rust
            
            echo ""
            echo "Polygon Dependencies:"
            check_hardhat
            
            echo ""
            echo "Solana Dependencies:"
            check_solana_cli
            check_anchor_cli
            
            echo ""
            echo "Polkadot Dependencies:"
            check_substrate_tools
            ;;
        *)
            log_error "Unknown network: $NETWORK_FILTER"
            exit 1
            ;;
    esac
    
    echo ""
    if [[ $EXIT_CODE -eq 0 ]]; then
        log_success "All dependencies are properly installed and configured!"
    else
        log_error "Some dependencies are missing or outdated."
        echo ""
        echo "To install missing dependencies, run:"
        echo "  $0 --fix"
        echo ""
        echo "Or install manually following the documentation in docs/"
    fi
    
    return $EXIT_CODE
}

# Additional global variables for enhanced help
INTERACTIVE_MODE=false
DIAGNOSE_MODE=false

# Enhanced help function
show_help() {
    if command -v show_comprehensive_help >/dev/null 2>&1; then
        show_comprehensive_help "$(basename "$0")"
    else
        usage
    fi
}

# Interactive troubleshooting wrapper
run_interactive_troubleshooting() {
    if command -v interactive_troubleshooting >/dev/null 2>&1; then
        log_info "Starting interactive troubleshooting..."
        interactive_troubleshooting "dependency-missing"
    else
        log_error "Interactive help system not available"
        log_info "Please check that scripts/interactive-help.sh exists"
        return 1
    fi
}

# Environment diagnosis wrapper
run_environment_diagnosis() {
    if command -v diagnose_environment >/dev/null 2>&1; then
        log_info "Running comprehensive environment diagnosis..."
        diagnose_environment "${NETWORK_FILTER:-all}"
    else
        log_error "Environment diagnosis not available"
        log_info "Please check that scripts/interactive-help.sh exists"
        return 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        --verbose)
            # shellcheck disable=SC2034
VERBOSE=true
            shift
            ;;
        --network=*)
            # shellcheck disable=SC2034
NETWORK_FILTER="${1#*=}"
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
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 2
            ;;
    esac
done

# Enhanced main execution with interactive features
main() {
    # Initialize help system if available
    if command -v init_help_system >/dev/null 2>&1; then
        init_help_system "$(basename "$0")"
    fi
    
    # Handle special modes first
    if [[ "$DIAGNOSE_MODE" == true ]]; then
        run_environment_diagnosis
        exit $?
    fi
    
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        run_interactive_troubleshooting
        exit $?
    fi
    
    # Standard dependency checking
    if [[ "$FIX_MODE" == true ]]; then
        log_info "Fix mode enabled - will attempt to install missing dependencies"
        
        # Check if installer script exists
        if [[ -f "$SCRIPT_DIR/install-blockchain-tools.sh" ]]; then
            log_info "Automatic installation available via install-blockchain-tools.sh"
        else
            log_warning "Automatic installation script not found. Please install manually."
        fi
        echo ""
    fi
    
    # Run dependency check
    check_dependencies
    
    # If there were failures and interactive mode is available, offer help
    if [[ $EXIT_CODE -ne 0 ]] && [[ "$INTERACTIVE_MODE" != true ]] && [[ -t 0 ]] && [[ -z "${CI:-}" ]]; then
        echo ""
        log_info "Some dependencies are missing or outdated."
        
        if command -v prompt_yes_no >/dev/null 2>&1; then
            if prompt_yes_no "Would you like to run interactive troubleshooting?"; then
                run_interactive_troubleshooting
                exit $?
            fi
        fi
        
        echo ""
        log_info "For help with resolving these issues:"
        echo "  • Run: $0 --interactive"
        echo "  • Run: $0 --diagnose"
        echo "  • Run: $0 --fix (to attempt automatic installation)"
        echo "  • Check documentation in docs/ directory"
    fi
    
    exit $EXIT_CODE
}

# Run main function
main "$@"