#!/bin/bash

# Comprehensive Blockchain Development Help System
# Provides unified help, troubleshooting, and guidance for all blockchain development scripts

set -euo pipefail

# Source the interactive help system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/interactive-help.sh" ]]; then
# shellcheck disable=SC1091
source "$SCRIPT_DIR/interactive-help.sh"
else
    echo "Error: Interactive help system not found at $SCRIPT_DIR/interactive-help.sh"
    exit 1
fi

# Initialize help system
init_help_system "$(basename "$0")"

# Show main help menu
show_main_help() {
    cat << EOF
$(echo -e "${CYAN}=== Blockchain Development Help System ===${NC}")

$(echo -e "${YELLOW}DESCRIPTION:${NC}")
  Comprehensive help and troubleshooting system for blockchain development.
  Provides unified access to help for all blockchain development scripts,
  interactive troubleshooting, and environment diagnosis.

$(echo -e "${YELLOW}USAGE:${NC}")
  $0 [COMMAND] [OPTIONS]

$(echo -e "${YELLOW}COMMANDS:${NC}")
  help [SCRIPT]         Show help for specific script
  diagnose [NETWORK]    Diagnose development environment
  troubleshoot [TYPE]   Interactive troubleshooting guide
  scripts               List all available blockchain scripts
  quick-start           Quick start guide for new developers
  examples              Show common usage examples

$(echo -e "${YELLOW}SCRIPTS:${NC}")
  deps-check            Blockchain dependency checker
  install-tools         Automated tools installer
  build-contracts       Multi-network contract builder
  interactive-help      Interactive troubleshooting system

$(echo -e "${YELLOW}OPTIONS:${NC}")
  --verbose             Enable verbose output
  --non-interactive     Disable interactive prompts
  --network=NETWORK     Target specific network

$(echo -e "${YELLOW}EXAMPLES:${NC}")
  $0 help deps-check              # Help for dependency checker
  $0 diagnose solana              # Diagnose Solana environment
  $0 troubleshoot build-failure   # Interactive build troubleshooting
  $0 quick-start                  # New developer guide
  $0 scripts                      # List all scripts

$(echo -e "${YELLOW}QUICK TROUBLESHOOTING:${NC}")
  • Build failures: $0 troubleshoot build-failure
  • Missing tools: $0 troubleshoot dependency-missing
  • Environment issues: $0 diagnose
  • New setup: $0 quick-start

EOF
}

# Show help for specific script
show_script_help() {
    local script_name
    script_name="$1"
    
    case "$script_name" in
        "deps-check"|"blockchain-deps-check")
            if [[ -f "$SCRIPT_DIR/blockchain-deps-check.sh" ]]; then
                "$SCRIPT_DIR/blockchain-deps-check.sh" --help
            else
                log_error "Script not found: blockchain-deps-check.sh"
            fi
            ;;
        "install-tools"|"install-blockchain-tools")
            if [[ -f "$SCRIPT_DIR/install-blockchain-tools.sh" ]]; then
                "$SCRIPT_DIR/install-blockchain-tools.sh" --help
            else
                log_error "Script not found: install-blockchain-tools.sh"
            fi
            ;;
        "build-contracts"|"build")
            if [[ -f "$SCRIPT_DIR/build-contracts.sh" ]]; then
                "$SCRIPT_DIR/build-contracts.sh" --help
            else
                log_error "Script not found: build-contracts.sh"
            fi
            ;;
        "interactive-help"|"interactive")
            if [[ -f "$SCRIPT_DIR/interactive-help.sh" ]]; then
                "$SCRIPT_DIR/interactive-help.sh" --help
            else
                log_error "Script not found: interactive-help.sh"
            fi
            ;;
        *)
            log_error "Unknown script: $script_name"
            log_info "Available scripts: deps-check, install-tools, build-contracts, interactive-help"
            return 1
            ;;
    esac
}

# List all available scripts
list_scripts() {
    log_section "Available Blockchain Development Scripts"
    
    local scripts
    scripts=(
        "blockchain-deps-check.sh:Comprehensive dependency checker and validator"
        "install-blockchain-tools.sh:Automated installation of blockchain development tools"
        "build-contracts.sh:Multi-network smart contract compilation and testing"
        "interactive-help.sh:Interactive troubleshooting and guidance system"
        "blockchain-help.sh:Unified help system (this script)"
    )
    
    for script_info in "${scripts[@]}"; do
        local script_name
        script_name="${script_info%%:*}"
        local description
        description="${script_info#*:}"
        
        if [[ -f "$SCRIPT_DIR/$script_name" ]]; then
            log_success "$script_name - $description"
        else
            log_warning "$script_name - $description (NOT FOUND)"
        fi
    done
    
    echo ""
    log_info "Usage examples:"
    echo "  ./scripts/blockchain-deps-check.sh --help"
    echo "  ./scripts/install-blockchain-tools.sh --all"
    echo "  ./scripts/build-contracts.sh --network=solana"
    echo "  ./scripts/blockchain-help.sh troubleshoot"
}

# Show quick start guide
show_quick_start() {
    cat << EOF
$(echo -e "${CYAN}=== Blockchain Development Quick Start Guide ===${NC}")

$(echo -e "${YELLOW}STEP 1: Environment Setup${NC}")
  First, check your development environment:
  
  $(echo -e "${GREEN}./scripts/blockchain-deps-check.sh${NC}")
  
  This will verify all required tools are installed.

$(echo -e "${YELLOW}STEP 2: Install Missing Dependencies${NC}")
  If any tools are missing, install them automatically:
  
  $(echo -e "${GREEN}./scripts/install-blockchain-tools.sh --all${NC}")
  
  Or install specific tools:
  $(echo -e "${GREEN}./scripts/install-blockchain-tools.sh --tool=rust${NC}")
  $(echo -e "${GREEN}./scripts/install-blockchain-tools.sh --tool=solana${NC}")

$(echo -e "${YELLOW}STEP 3: Verify Installation${NC}")
  Re-run the dependency checker to confirm everything is working:
  
  $(echo -e "${GREEN}./scripts/blockchain-deps-check.sh --verbose${NC}")

$(echo -e "${YELLOW}STEP 4: Build Contracts${NC}")
  Try building contracts for all networks:
  
  $(echo -e "${GREEN}./scripts/build-contracts.sh${NC}")
  
  Or build for specific networks:
  $(echo -e "${GREEN}./scripts/build-contracts.sh --network=polygon${NC}")
  $(echo -e "${GREEN}./scripts/build-contracts.sh --network=solana${NC}")

$(echo -e "${YELLOW}TROUBLESHOOTING${NC}")
  If you encounter issues at any step:
  
  • Interactive help: $(echo -e "${GREEN}./scripts/blockchain-help.sh troubleshoot${NC}")
  • Environment diagnosis: $(echo -e "${GREEN}./scripts/blockchain-help.sh diagnose${NC}")
  • Verbose output: Add $(echo -e "${GREEN}--verbose${NC}") to any command
  • Specific help: $(echo -e "${GREEN}./scripts/blockchain-help.sh help <script-name>${NC}")

$(echo -e "${YELLOW}NETWORK-SPECIFIC REQUIREMENTS${NC}")

$(echo -e "${CYAN}Polygon Development:${NC}")
  • Node.js 20+
  • pnpm package manager
  • Hardhat framework

$(echo -e "${CYAN}Solana Development:${NC}")
  • Rust 1.70+
  • Solana CLI 1.16+
  • Anchor CLI 0.28+

$(echo -e "${CYAN}Polkadot Development:${NC}")
  • Rust 1.70+
  • WebAssembly target
  • cargo-contract
  • Protocol Buffers compiler

$(echo -e "${YELLOW}NEXT STEPS${NC}")
  Once your environment is set up:
  1. Explore the contract code in apps/smart-contracts/
  2. Run tests: $(echo -e "${GREEN}./scripts/build-contracts.sh --network=<network>${NC}")
  3. Deploy to testnets (see deployment documentation)
  4. Integrate with frontend applications

$(echo -e "${YELLOW}GETTING HELP${NC}")
  • Documentation: Check docs/ directory
  • Interactive troubleshooting: $(echo -e "${GREEN}./scripts/blockchain-help.sh troubleshoot${NC}")
  • Script-specific help: $(echo -e "${GREEN}<script> --help${NC}")
  • Environment diagnosis: $(echo -e "${GREEN}./scripts/blockchain-help.sh diagnose${NC}")

EOF
}

# Show common usage examples
show_examples() {
    cat << EOF
$(echo -e "${CYAN}=== Common Usage Examples ===${NC}")

$(echo -e "${YELLOW}ENVIRONMENT SETUP${NC}")
  # Check all dependencies
  ./scripts/blockchain-deps-check.sh
  
  # Check specific network dependencies
  ./scripts/blockchain-deps-check.sh --network=solana
  
  # Check with verbose output
  ./scripts/blockchain-deps-check.sh --verbose
  
  # Interactive dependency troubleshooting
  ./scripts/blockchain-deps-check.sh --interactive

$(echo -e "${YELLOW}TOOL INSTALLATION${NC}")
  # Install all blockchain tools
  ./scripts/install-blockchain-tools.sh --all
  
  # Install specific tool
  ./scripts/install-blockchain-tools.sh --tool=rust
  ./scripts/install-blockchain-tools.sh --tool=anchor
  
  # Force reinstallation
  ./scripts/install-blockchain-tools.sh --all --force
  
  # Interactive installation guidance
  ./scripts/install-blockchain-tools.sh --interactive

$(echo -e "${YELLOW}CONTRACT BUILDING${NC}")
  # Build all networks
  ./scripts/build-contracts.sh
  
  # Build specific network
  ./scripts/build-contracts.sh --network=polygon
  ./scripts/build-contracts.sh --network=solana
  
  # Build without tests
  ./scripts/build-contracts.sh --skip-tests
  
  # Build with documentation generation
  ./scripts/build-contracts.sh --generate-docs
  
  # Verbose build with troubleshooting
  ./scripts/build-contracts.sh --verbose --interactive

$(echo -e "${YELLOW}TROUBLESHOOTING${NC}")
  # Comprehensive environment diagnosis
  ./scripts/blockchain-help.sh diagnose
  
  # Network-specific diagnosis
  ./scripts/blockchain-help.sh diagnose solana
  
  # Interactive build troubleshooting
  ./scripts/blockchain-help.sh troubleshoot build-failure
  
  # Interactive dependency troubleshooting
  ./scripts/blockchain-help.sh troubleshoot dependency-missing

$(echo -e "${YELLOW}GETTING HELP${NC}")
  # Show help for specific script
  ./scripts/blockchain-help.sh help deps-check
  ./scripts/blockchain-help.sh help build-contracts
  
  # List all available scripts
  ./scripts/blockchain-help.sh scripts
  
  # Quick start guide
  ./scripts/blockchain-help.sh quick-start

$(echo -e "${YELLOW}WORKFLOW EXAMPLES${NC}")
  # New developer setup
  ./scripts/blockchain-help.sh quick-start
  ./scripts/blockchain-deps-check.sh
  ./scripts/install-blockchain-tools.sh --all
  ./scripts/build-contracts.sh
  
  # Troubleshooting build issues
  ./scripts/build-contracts.sh --verbose
  ./scripts/blockchain-help.sh troubleshoot build-failure
  ./scripts/blockchain-help.sh diagnose
  
  # Network-specific development
  ./scripts/blockchain-deps-check.sh --network=solana
  ./scripts/build-contracts.sh --network=solana --verbose

EOF
}

# Main command handler
main() {
    local command
    command="${1:-help}"
    
    case "$command" in
        "help")
            if [[ -n "${2:-}" ]]; then
                show_script_help "$2"
            else
                show_main_help
            fi
            ;;
        "diagnose")
            diagnose_environment "${2:-all}"
            ;;
        "troubleshoot")
            interactive_troubleshooting "${2:-general}"
            ;;
        "scripts")
            list_scripts
            ;;
        "quick-start")
            show_quick_start
            ;;
        "examples")
            show_examples
            ;;
        "--help"|"-h")
            show_main_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_main_help
            return 1
            ;;
    esac
}

# Parse command line arguments
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
NETWORK_FILTER="${1#*=}"
            shift
            ;;
        --help|-h)
            show_main_help
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Run main function
main "$@"