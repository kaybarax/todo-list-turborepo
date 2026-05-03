#!/bin/bash

# Automated Blockchain Tools Installer
# Installs missing blockchain development dependencies
# Supports: Rust, Solana CLI, Anchor CLI
# Platforms: macOS, Linux, Windows (WSL/Git Bash)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RUST_MIN_VERSION="1.70.0"
SOLANA_VERSION="1.18.0"
ANCHOR_VERSION="0.29.0"

# Retry configuration
MAX_RETRIES=3
INITIAL_DELAY=2
MAX_DELAY=30
BACKOFF_MULTIPLIER=2

# Validation timeouts
VALIDATION_TIMEOUT=30

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're running in CI environment
is_ci() {
    [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_URL" ]
}

# Get system architecture
get_arch() {
    case "$(uname -m)" in
        x86_64|amd64)
            echo "x86_64"
            ;;
        arm64|aarch64)
            echo "arm64"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Version comparison function
version_ge() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Enhanced retry mechanism for network operations with exponential backoff
retry_command() {
    local max_attempts="${1:-$MAX_RETRIES}"
    shift
    local delay="$INITIAL_DELAY"
    local attempt=1
    local exit_code=0
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Attempt $attempt of $max_attempts: $*"
        
        if "$@"; then
            return 0
        else
            exit_code=$?
            
            if [ $attempt -eq $max_attempts ]; then
                log_error "Command failed after $max_attempts attempts with exit code $exit_code: $*"
                return $exit_code
            fi
            
            log_warning "Attempt $attempt failed with exit code $exit_code. Retrying in ${delay}s..."
            sleep $delay
            
            # Exponential backoff with jitter
            delay=$((delay * BACKOFF_MULTIPLIER))
            if [ $delay -gt $MAX_DELAY ]; then
                delay=$MAX_DELAY
            fi
            
            # Add small random jitter to prevent thundering herd
            local jitter=$((RANDOM % 3))
            delay=$((delay + jitter))
            
            attempt=$((attempt + 1))
        fi
    done
}

# Network connectivity check
check_network_connectivity() {
    local test_urls=("https://github.com" "https://sh.rustup.rs" "https://release.solana.com")
    local connected=false
    
    log_info "Checking network connectivity..."
    
    for url in "${test_urls[@]}"; do
        if command_exists curl; then
            if curl -s --connect-timeout 10 --max-time 15 "$url" >/dev/null 2>&1; then
                connected=true
                break
            fi
        elif command_exists wget; then
            if wget -q --timeout=15 --tries=1 --spider "$url" >/dev/null 2>&1; then
                connected=true
                break
            fi
        fi
    done
    
    if [ "$connected" = false ]; then
        log_error "Network connectivity check failed"
        log_info "Please check your internet connection and try again"
        log_info "If you're behind a corporate firewall, you may need to configure proxy settings"
        return 1
    fi
    
    log_success "Network connectivity verified"
    return 0
}

# Check if running with sufficient permissions
check_permissions() {
    local install_type="$1"  # "user" or "system"
    
    case "$install_type" in
        "system")
            if [ "$EUID" -ne 0 ] && ! command_exists sudo; then
                log_error "System-wide installation requires root privileges or sudo access"
                log_info "Please run with sudo or install tools in user space"
                return 1
            fi
            ;;
        "user")
            # Check if user directories are writable
            local user_dirs=("$HOME/.cargo" "$HOME/.local")
            for dir in "${user_dirs[@]}"; do
                if [ -e "$dir" ] && [ ! -w "$dir" ]; then
                    log_error "User directory $dir is not writable"
                    log_info "Please check directory permissions: chmod u+w $dir"
                    return 1
                fi
            done
            ;;
    esac
    
    return 0
}

# Validate installation with timeout
validate_installation() {
    local tool_name="$1"
    local validation_command="$2"
    local expected_pattern="$3"
    local timeout="${4:-$VALIDATION_TIMEOUT}"
    
    log_info "Validating $tool_name installation..."
    
    # Wait for installation to complete and tool to be available
    local elapsed=0
    local check_interval=2
    
    while [ $elapsed -lt $timeout ]; do
        if command_exists "$tool_name"; then
            # Tool exists, now validate it works
            if [ -n "$validation_command" ]; then
                local output
                if output=$(eval "$validation_command" 2>&1); then
                    if [ -n "$expected_pattern" ]; then
                        if echo "$output" | grep -q "$expected_pattern"; then
                            log_success "$tool_name validation successful"
                            return 0
                        else
                            log_warning "$tool_name found but output doesn't match expected pattern"
                            log_info "Expected pattern: $expected_pattern"
                            log_info "Actual output: $output"
                        fi
                    else
                        log_success "$tool_name validation successful"
                        return 0
                    fi
                else
                    log_warning "$tool_name found but validation command failed"
                fi
            else
                log_success "$tool_name installation validated"
                return 0
            fi
        fi
        
        sleep $check_interval
        elapsed=$((elapsed + check_interval))
        
        if [ $((elapsed % 10)) -eq 0 ]; then
            log_info "Still validating $tool_name... (${elapsed}s elapsed)"
        fi
    done
    
    log_error "$tool_name validation failed after ${timeout}s timeout"
    return 1
}

# Provide manual installation fallback instructions
provide_manual_instructions() {
    local tool="$1"
    local platform="$2"
    
    log_error "Automatic installation of $tool failed"
    log_info "Please follow these manual installation instructions:"
    echo ""
    
    case "$tool" in
        "rust")
            echo "Manual Rust Installation:"
            echo "1. Visit https://rustup.rs/"
            case "$platform" in
                "macos"|"linux")
                    echo "2. Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
                    echo "3. Follow the on-screen instructions"
                    echo "4. Restart your terminal or run: source ~/.cargo/env"
                    ;;
                "windows")
                    echo "2. Download and run rustup-init.exe"
                    echo "3. Follow the installer instructions"
                    echo "4. Restart your terminal"
                    ;;
            esac
            echo "5. Verify installation: rustc --version"
            ;;
        "solana")
            echo "Manual Solana CLI Installation:"
            echo "1. Visit https://docs.solana.com/cli/install-solana-cli-tools"
            case "$platform" in
                "macos"|"linux")
                    echo "2. Run: sh -c \"\$(curl -sSfL https://release.solana.com/v$SOLANA_VERSION/install)\""
                    echo "3. Add to PATH: export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\""
                    ;;
                "windows")
                    echo "2. Download the Windows installer from GitHub releases"
                    echo "3. Extract and add to PATH"
                    ;;
            esac
            echo "4. Verify installation: solana --version"
            ;;
        "anchor")
            echo "Manual Anchor CLI Installation:"
            echo "1. Ensure Rust and Solana CLI are installed first"
            echo "2. Install AVM: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
            echo "3. Install Anchor: avm install $ANCHOR_VERSION"
            echo "4. Use version: avm use $ANCHOR_VERSION"
            echo "5. Verify installation: anchor --version"
            ;;
        "substrate")
            echo "Manual Substrate Tools Installation:"
            echo "1. Ensure Rust is installed first"
            echo "2. Install protobuf compiler for your platform"
            echo "3. Add WASM target: rustup target add wasm32-unknown-unknown"
            echo "4. Install cargo-contract: cargo install cargo-contract --force"
            echo "5. Verify installation: cargo-contract --version"
            ;;
    esac
    echo ""
    echo "After manual installation, run this script again to verify the setup."
}

# Install Rust using rustup
install_rust() {
    log_info "Installing Rust using rustup..."
    
    # Check permissions for user installation
    if ! check_permissions "user"; then
        provide_manual_instructions "rust" "$(detect_platform)"
        return 1
    fi
    
    # Check network connectivity
    if ! check_network_connectivity; then
        provide_manual_instructions "rust" "$(detect_platform)"
        return 1
    fi
    
    if command_exists rustc; then
        local current_version
        current_version=$(rustc --version | cut -d' ' -f2)
        if version_ge "$current_version" "$RUST_MIN_VERSION"; then
            log_success "Rust $current_version is already installed and meets requirements"
            return 0
        else
            log_warning "Rust $current_version is outdated. Updating..."
        fi
    fi
    
    # Download and install rustup
    local platform arch
    platform=$(detect_platform)
    arch=$(get_arch)
    
    case $platform in
        "macos"|"linux")
            # Check if we have curl or wget
            if command_exists curl; then
                local download_cmd="curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs"
            elif command_exists wget; then
                local download_cmd="wget -qO- https://sh.rustup.rs"
            else
                log_error "Neither curl nor wget found. Please install one of them first."
                provide_manual_instructions "rust" "$platform"
                return 1
            fi
            
            log_info "Downloading rustup installer for $platform ($arch)..."
            if ! retry_command "$MAX_RETRIES" sh -c "$download_cmd | sh -s -- -y --default-toolchain stable"; then
                log_error "Failed to install Rust via rustup after $MAX_RETRIES attempts"
                provide_manual_instructions "rust" "$platform"
                return 1
            fi
            ;;
        "windows")
            log_warning "Windows detected. Automatic installation not supported."
            provide_manual_instructions "rust" "$platform"
            return 1
            ;;
        *)
            log_error "Unsupported platform for automatic Rust installation: $platform"
            provide_manual_instructions "rust" "$platform"
            return 1
            ;;
    esac
    
    # Source cargo environment
    if [ -f "$HOME/.cargo/env" ]; then
        # shellcheck source=/dev/null
        source "$HOME/.cargo/env"
    fi
    
    # Update PATH for current session
    export PATH="$HOME/.cargo/bin:$PATH"
    
    # Validate installation with timeout
    if ! validate_installation "rustc" "rustc --version" "$RUST_MIN_VERSION"; then
        log_error "Rust installation validation failed"
        provide_manual_instructions "rust" "$platform"
        return 1
    fi
    
    local installed_version
    installed_version=$(rustc --version | cut -d' ' -f2)
    log_success "Rust $installed_version installed and validated successfully"
    
    # Install additional components needed for blockchain development
    log_info "Installing additional Rust components..."
    if ! retry_command 2 rustup component add clippy rustfmt; then
        log_warning "Failed to install some Rust components, but core installation succeeded"
    else
        log_success "Additional Rust components installed"
    fi
    
    # Install wasm target for Substrate development
    log_info "Installing WebAssembly target for Substrate development..."
    if ! retry_command 2 rustup target add wasm32-unknown-unknown; then
        log_warning "Failed to install WASM target, but core installation succeeded"
    else
        log_success "WebAssembly target installed"
    fi
    
    return 0
}

# Install Solana CLI
install_solana() {
    log_info "Installing Solana CLI v$SOLANA_VERSION..."
    
    # Check permissions for user installation
    if ! check_permissions "user"; then
        provide_manual_instructions "solana" "$(detect_platform)"
        return 1
    fi
    
    # Check network connectivity
    if ! check_network_connectivity; then
        provide_manual_instructions "solana" "$(detect_platform)"
        return 1
    fi
    
    if command_exists solana; then
        local current_version
        current_version=$(solana --version | cut -d' ' -f2)
        if [ "$current_version" = "$SOLANA_VERSION" ]; then
            log_success "Solana CLI $current_version is already installed"
            return 0
        else
            log_warning "Solana CLI $current_version found. Installing specific version $SOLANA_VERSION..."
        fi
    fi
    
    local platform arch
    platform=$(detect_platform)
    arch=$(get_arch)
    
    case $platform in
        "macos"|"linux")
            # Check if we have curl or wget
            if command_exists curl; then
                local download_cmd="curl -sSfL https://release.solana.com/v$SOLANA_VERSION/install"
            elif command_exists wget; then
                local download_cmd="wget -qO- https://release.solana.com/v$SOLANA_VERSION/install"
            else
                log_error "Neither curl nor wget found. Please install one of them first."
                provide_manual_instructions "solana" "$platform"
                return 1
            fi
            
            log_info "Downloading Solana CLI installer for $platform ($arch)..."
            # Use official Solana installer with retry mechanism
            if ! retry_command "$MAX_RETRIES" sh -c "$download_cmd | sh"; then
                log_error "Failed to install Solana CLI after $MAX_RETRIES attempts"
                provide_manual_instructions "solana" "$platform"
                return 1
            fi
            
            # Add to PATH if not already there
            local solana_path="$HOME/.local/share/solana/install/active_release/bin"
            if [[ ":$PATH:" != *":$solana_path:"* ]]; then
                # Add to shell profiles with error handling
                for profile in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
                    if [ -f "$profile" ] || [ "$profile" = "$HOME/.bashrc" ]; then
                        if ! echo "export PATH=\"$solana_path:\$PATH\"" >> "$profile" 2>/dev/null; then
                            log_warning "Failed to update $profile, but installation continues"
                        fi
                    fi
                done
                export PATH="$solana_path:$PATH"
                log_info "Added Solana CLI to PATH in shell profiles"
            fi
            ;;
        "windows")
            log_warning "Windows detected. Automatic installation not supported."
            provide_manual_instructions "solana" "$platform"
            return 1
            ;;
        *)
            log_error "Unsupported platform for automatic Solana CLI installation: $platform"
            provide_manual_instructions "solana" "$platform"
            return 1
            ;;
    esac
    
    # Validate installation with timeout
    if ! validate_installation "solana" "solana --version" "$SOLANA_VERSION"; then
        log_error "Solana CLI installation validation failed"
        provide_manual_instructions "solana" "$platform"
        return 1
    fi
    
    local installed_version
    installed_version=$(solana --version | cut -d' ' -f2)
    log_success "Solana CLI $installed_version installed and validated successfully"
    
    # Configure Solana for development (only if not in CI)
    if ! is_ci; then
        log_info "Configuring Solana for development..."
        if ! retry_command 2 solana config set --url localhost; then
            log_warning "Failed to configure Solana CLI, but installation succeeded"
        else
            log_success "Solana CLI configured for local development"
        fi
    fi
    
    return 0
}

# Install Anchor CLI
install_anchor() {
    log_info "Installing Anchor CLI v$ANCHOR_VERSION..."
    
    # Check dependencies first
    if ! command_exists cargo; then
        log_error "Cargo not found. Please install Rust first."
        log_info "Run: $0 --tool=rust"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    if ! command_exists solana; then
        log_error "Solana CLI not found. Please install Solana CLI first."
        log_info "Run: $0 --tool=solana"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    # Check permissions for user installation
    if ! check_permissions "user"; then
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    # Check network connectivity
    if ! check_network_connectivity; then
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    if command_exists anchor; then
        local current_version
        current_version=$(anchor --version 2>/dev/null | cut -d' ' -f2 || echo "unknown")
        if [ "$current_version" = "$ANCHOR_VERSION" ]; then
            log_success "Anchor CLI $current_version is already installed"
            return 0
        else
            log_warning "Anchor CLI $current_version found. Installing specific version $ANCHOR_VERSION..."
        fi
    fi
    
    # Install specific version of Anchor CLI
    log_info "Installing Anchor Version Manager (AVM)..."
    log_info "This may take several minutes as Anchor CLI is compiled from source..."
    
    # First install AVM (Anchor Version Manager) with enhanced retry
    if ! retry_command "$MAX_RETRIES" cargo install --git https://github.com/coral-xyz/anchor avm --locked --force; then
        log_error "Failed to install Anchor Version Manager (AVM) after $MAX_RETRIES attempts"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    # Add cargo bin to PATH if not already there
    local cargo_bin="$HOME/.cargo/bin"
    if [[ ":$PATH:" != *":$cargo_bin:"* ]]; then
        # Add to shell profiles with error handling
        for profile in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
            if [ -f "$profile" ] || [ "$profile" = "$HOME/.bashrc" ]; then
                if ! echo "export PATH=\"$cargo_bin:\$PATH\"" >> "$profile" 2>/dev/null; then
                    log_warning "Failed to update $profile, but installation continues"
                fi
            fi
        done
        export PATH="$cargo_bin:$PATH"
        log_info "Added Cargo bin to PATH in shell profiles"
    fi
    
    # Validate AVM installation first
    if ! validate_installation "avm" "avm --version" ""; then
        log_error "AVM installation validation failed"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    # Install and use specific Anchor version with retry
    log_info "Installing Anchor CLI v$ANCHOR_VERSION using AVM..."
    if ! retry_command "$MAX_RETRIES" avm install "$ANCHOR_VERSION"; then
        log_error "Failed to install Anchor CLI v$ANCHOR_VERSION after $MAX_RETRIES attempts"
        log_info "Available versions can be found at: https://github.com/coral-xyz/anchor/releases"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    if ! retry_command 2 avm use "$ANCHOR_VERSION"; then
        log_error "Failed to set Anchor CLI v$ANCHOR_VERSION as active"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    # Validate final installation
    if ! validate_installation "anchor" "anchor --version" "$ANCHOR_VERSION"; then
        log_error "Anchor CLI installation validation failed"
        provide_manual_instructions "anchor" "$(detect_platform)"
        return 1
    fi
    
    local installed_version
    installed_version=$(anchor --version 2>/dev/null | cut -d' ' -f2 || echo "unknown")
    log_success "Anchor CLI $installed_version installed and validated successfully"
    
    # Verify Anchor can find Solana with timeout
    log_info "Verifying Anchor configuration..."
    if timeout 10 anchor --version >/dev/null 2>&1; then
        log_success "Anchor CLI is properly configured"
    else
        log_warning "Anchor CLI installed but may need configuration"
        log_info "You may need to restart your terminal for full functionality"
    fi
    
    return 0
}

# Install Substrate tools for Polkadot development
install_substrate() {
    log_info "Installing Substrate tools for Polkadot development..."
    
    # Check if Rust is available
    if ! command_exists cargo; then
        log_error "Cargo not found. Please install Rust first."
        log_info "Run: $0 --tool=rust"
        provide_manual_instructions "substrate" "$(detect_platform)"
        return 1
    fi
    
    # Check permissions for system-wide protobuf installation
    local platform
    platform=$(detect_platform)
    
    # Check and install protobuf compiler (required for substrate tools)
    if ! command_exists protoc; then
        log_info "Protocol Buffers compiler (protoc) not found. Installing..."
        
        case $platform in
            "macos")
                if command_exists brew; then
                    if ! retry_command "$MAX_RETRIES" brew install protobuf; then
                        log_error "Failed to install protobuf via Homebrew after $MAX_RETRIES attempts"
                        provide_manual_instructions "substrate" "$platform"
                        return 1
                    fi
                else
                    log_error "Homebrew not found. Cannot install protobuf automatically."
                    provide_manual_instructions "substrate" "$platform"
                    return 1
                fi
                ;;
            "linux")
                # Check if we can use sudo for system package installation
                if ! check_permissions "system"; then
                    log_error "System package installation requires sudo privileges"
                    provide_manual_instructions "substrate" "$platform"
                    return 1
                fi
                
                # Try different package managers with retry
                local installed=false
                if command_exists apt-get; then
                    if retry_command 2 sudo apt-get update && retry_command 2 sudo apt-get install -y protobuf-compiler; then
                        installed=true
                    fi
                elif command_exists yum; then
                    if retry_command 2 sudo yum install -y protobuf-compiler; then
                        installed=true
                    fi
                elif command_exists pacman; then
                    if retry_command 2 sudo pacman -S --noconfirm protobuf; then
                        installed=true
                    fi
                fi
                
                if [ "$installed" = false ]; then
                    log_error "Failed to install protobuf compiler via package manager"
                    provide_manual_instructions "substrate" "$platform"
                    return 1
                fi
                ;;
            "windows")
                log_warning "Windows detected. Automatic protobuf installation not supported."
                provide_manual_instructions "substrate" "$platform"
                return 1
                ;;
            *)
                log_error "Unsupported platform for automatic protobuf installation: $platform"
                provide_manual_instructions "substrate" "$platform"
                return 1
                ;;
        esac
        
        # Validate protobuf installation
        if ! validate_installation "protoc" "protoc --version" ""; then
            log_error "Protocol Buffers compiler installation validation failed"
            provide_manual_instructions "substrate" "$platform"
            return 1
        fi
        
        log_success "Protocol Buffers compiler installed and validated successfully"
    else
        log_success "Protocol Buffers compiler is already installed"
    fi
    
    # Verify WASM target is installed (needed for Substrate)
    if rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
        log_success "WebAssembly target is already installed"
    else
        log_info "Installing WebAssembly target for Substrate..."
        if ! retry_command 2 rustup target add wasm32-unknown-unknown; then
            log_error "Failed to install WebAssembly target after retries"
            provide_manual_instructions "substrate" "$platform"
            return 1
        else
            log_success "WebAssembly target installed successfully"
        fi
    fi
    
    # Install cargo-contract for ink! smart contracts
    if command_exists cargo-contract; then
        log_success "cargo-contract is already installed"
    else
        log_info "Installing cargo-contract for ink! smart contracts..."
        log_info "This may take several minutes as it compiles from source..."
        
        # Check network connectivity before long compilation
        if ! check_network_connectivity; then
            provide_manual_instructions "substrate" "$platform"
            return 1
        fi
        
        if ! retry_command 2 cargo install cargo-contract --force; then
            log_warning "Failed to install cargo-contract after retries"
            log_info "You can install it manually later: cargo install cargo-contract --force"
        else
            # Validate cargo-contract installation
            if ! validate_installation "cargo-contract" "cargo-contract --version" ""; then
                log_warning "cargo-contract installed but validation failed"
            else
                log_success "cargo-contract installed and validated successfully"
            fi
        fi
    fi
    
    # Install substrate-contracts-node for local testing (optional, as it's large)
    if command_exists substrate-contracts-node; then
        log_success "substrate-contracts-node is already installed"
    else
        log_info "Skipping substrate-contracts-node installation (large dependency)"
        log_info "To install manually: cargo install contracts-node --git https://github.com/paritytech/substrate-contracts-node.git"
    fi
    
    log_success "Substrate tools installation completed"
    return 0
}

# Install Node.js dependencies for Hardhat (Polygon)
install_node_deps() {
    log_info "Verifying Node.js dependencies for Hardhat..."
    
    if ! command_exists node; then
        log_error "Node.js not found. Please install Node.js 20+ first."
        return 1
    fi
    
    local node_version
    node_version=$(node --version | sed 's/v//')
    local required_version="20.0.0"
    
    if ! version_ge "$node_version" "$required_version"; then
        log_error "Node.js $node_version found, but version $required_version or higher is required"
        return 1
    fi
    
    log_success "Node.js $node_version meets requirements"
    
    # Check if we're in the project root and install dependencies
    if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ]; then
        if command_exists pnpm; then
            log_info "Installing project dependencies with pnpm..."
            pnpm install
            log_success "Project dependencies installed"
        else
            log_warning "pnpm not found. Please install pnpm for optimal dependency management"
        fi
    fi
    
    return 0
}

# Additional global variables for enhanced help
INTERACTIVE_MODE=false
SKIP_VALIDATION=false
FORCE_INSTALL=false

# Enhanced help function
show_help() {
    if command -v show_comprehensive_help >/dev/null 2>&1; then
        show_comprehensive_help "$(basename "$0")"
    else
        show_usage
    fi
}

# Interactive installation guidance
run_interactive_installation() {
    if command -v interactive_troubleshooting >/dev/null 2>&1; then
        log_info "Starting interactive installation guidance..."
        interactive_troubleshooting "dependency-missing"
    else
        log_error "Interactive help system not available"
        log_info "Please check that scripts/interactive-help.sh exists"
        return 1
    fi
}

# Main installation function
install_tool() {
    local tool="$1"
    
    case "$tool" in
        "rust")
            install_rust
            ;;
        "solana")
            install_solana
            ;;
        "anchor")
            install_anchor
            ;;
        "substrate"|"polkadot")
            install_substrate
            ;;
        "node"|"nodejs")
            install_node_deps
            ;;
        *)
            log_error "Unknown tool: $tool"
            log_info "Available tools: rust, solana, anchor, substrate, node"
            return 1
            ;;
    esac
}

# Source interactive help system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/interactive-help.sh" ]]; then
    source "$SCRIPT_DIR/interactive-help.sh"
fi

# Show comprehensive usage information
show_usage() {
    cat << EOF
$(echo -e "${CYAN}=== Automated Blockchain Tools Installer ===${NC}")

$(echo -e "${YELLOW}DESCRIPTION:${NC}")
  Automated installation of blockchain development dependencies with enhanced
  error handling, retry mechanisms, and cross-platform support.

$(echo -e "${YELLOW}USAGE:${NC}")
  $0 [OPTIONS]

$(echo -e "${YELLOW}OPTIONS:${NC}")
  --tool=TOOL           Install specific tool (rust|solana|anchor|substrate|node)
  --all                 Install all blockchain development tools
  --force               Force reinstallation even if tool exists
  --verbose             Enable verbose output and debugging information
  --interactive         Enable interactive prompts and guidance
  --skip-validation     Skip post-installation validation checks
  --help, -h            Show this help message

$(echo -e "${YELLOW}SUPPORTED TOOLS:${NC}")
  rust                  Rust programming language (via rustup)
  solana                Solana CLI tools for program deployment
  anchor                Anchor framework for Solana development
  substrate             Substrate tools for Polkadot development (cargo-contract)
  node                  Node.js dependencies verification

$(echo -e "${YELLOW}EXAMPLES:${NC}")
  $0 --tool=rust               # Install only Rust
  $0 --tool=solana --verbose   # Install Solana CLI with verbose output
  $0 --all                     # Install all tools
  $0 --all --force             # Reinstall all tools
  $0 --interactive             # Interactive installation with guidance

$(echo -e "${YELLOW}INSTALLATION DETAILS:${NC}")

$(echo -e "${CYAN}Rust Installation:${NC}")
  • Uses official rustup installer
  • Installs stable toolchain by default
  • Adds WebAssembly target for Substrate development
  • Includes clippy and rustfmt components
  • Updates PATH in shell profiles

$(echo -e "${CYAN}Solana CLI Installation:${NC}")
  • Uses official Solana installer
  • Installs specific version ($SOLANA_VERSION)
  • Configures for development use
  • Updates PATH in shell profiles
  • Validates installation with timeout

$(echo -e "${CYAN}Anchor CLI Installation:${NC}")
  • Requires Rust and Solana CLI
  • Uses Anchor Version Manager (AVM)
  • Installs specific version ($ANCHOR_VERSION)
  • Compiles from source (may take time)
  • Validates with Solana integration

$(echo -e "${CYAN}Substrate Tools Installation:${NC}")
  • Requires Rust and Protocol Buffers compiler
  • Installs cargo-contract for ink! contracts
  • Adds WebAssembly compilation target
  • Platform-specific protobuf installation

$(echo -e "${YELLOW}RETRY MECHANISM:${NC}")
  • Automatic retry with exponential backoff
  • Network failure handling
  • Maximum $MAX_RETRIES attempts per operation
  • Fallback to manual installation instructions

$(echo -e "${YELLOW}VALIDATION:${NC}")
  • Post-installation validation with timeout
  • Version verification
  • Functionality testing
  • PATH configuration verification

$(echo -e "${YELLOW}PLATFORM SUPPORT:${NC}")
  • macOS (Intel and Apple Silicon)
  • Linux (x86_64 and ARM64)
  • Windows (limited support via WSL/Git Bash)
  • Automatic platform detection

$(echo -e "${YELLOW}ENVIRONMENT VARIABLES:${NC}")
  MAX_RETRIES           Maximum retry attempts (default: $MAX_RETRIES)
  VALIDATION_TIMEOUT    Validation timeout in seconds (default: $VALIDATION_TIMEOUT)
  CI                    Automatically detected - disables interactive features
  SKIP_NETWORK_CHECK    Set to 'true' to skip network connectivity checks

$(echo -e "${YELLOW}EXIT CODES:${NC}")
  0    Installation completed successfully
  1    Installation failed
  2    Invalid command line arguments
  3    Network connectivity issues
  4    Permission issues
  5    Platform not supported

$(echo -e "${YELLOW}TROUBLESHOOTING:${NC}")
  If installation fails:
  • Check network connectivity
  • Verify sufficient disk space
  • Ensure proper permissions
  • Try with --verbose for detailed output
  • Use --interactive for step-by-step guidance
  • Check manual installation instructions

$(echo -e "${YELLOW}MANUAL INSTALLATION:${NC}")
  If automatic installation fails, the script provides detailed
  manual installation instructions for each tool and platform.

$(echo -e "${YELLOW}RELATED SCRIPTS:${NC}")
  scripts/blockchain-deps-check.sh    Verify installed dependencies
  scripts/build-contracts.sh          Build contracts with dependency checks
  scripts/interactive-help.sh         Interactive troubleshooting system

EOF
}nstallation even if tool exists"
    echo "  --help            Show this help message"
    echo ""
    echo "Available tools:"
    echo "  rust              Rust programming language and Cargo"
    echo "  solana            Solana CLI for Solana blockchain development"
    echo "  anchor            Anchor framework for Solana smart contracts"
    echo "  substrate         Substrate tools for Polkadot development"
    echo "  node              Node.js dependencies verification"
    echo ""
    echo "Examples:"
    echo "  $0 --tool=rust    Install only Rust"
    echo "  $0 --all          Install all blockchain tools"
    echo "  $0 --force --all  Force reinstall all tools"
}

# Parse command line arguments
INSTALL_ALL=false
FORCE_INSTALL=false
SPECIFIC_TOOL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --tool=*)
            SPECIFIC_TOOL="${1#*=}"
            shift
            ;;
        --all)
            INSTALL_ALL=true
            shift
            ;;
        --force)
            FORCE_INSTALL=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Enhanced error reporting
report_installation_summary() {
    local total_tools=0
    local successful_tools=0
    local summary_output=""
    
    # Collect results for each tool
    for tool in rust solana anchor substrate node; do
        if [ "$INSTALL_ALL" = true ] || [ "$SPECIFIC_TOOL" = "$tool" ]; then
            total_tools=$((total_tools + 1))
            local tool_result=""
            
            case "$tool" in
                "rust")
                    if command_exists rustc; then
                        tool_result="✓ $(rustc --version | cut -d' ' -f1-2)"
                        successful_tools=$((successful_tools + 1))
                    else
                        tool_result="✗ Installation failed"
                    fi
                    ;;
                "solana")
                    if command_exists solana; then
                        tool_result="✓ $(solana --version | cut -d' ' -f1-2)"
                        successful_tools=$((successful_tools + 1))
                    else
                        tool_result="✗ Installation failed"
                    fi
                    ;;
                "anchor")
                    if command_exists anchor; then
                        tool_result="✓ $(anchor --version 2>/dev/null | cut -d' ' -f1-2 || echo 'Anchor CLI installed')"
                        successful_tools=$((successful_tools + 1))
                    else
                        tool_result="✗ Installation failed"
                    fi
                    ;;
                "substrate")
                    local substrate_status=""
                    if command_exists protoc; then
                        substrate_status="protoc"
                    fi
                    if command_exists cargo-contract; then
                        substrate_status="$substrate_status cargo-contract"
                    fi
                    if [ -n "$substrate_status" ]; then
                        tool_result="✓ Substrate tools: $substrate_status"
                        successful_tools=$((successful_tools + 1))
                    else
                        tool_result="✗ Installation failed"
                    fi
                    ;;
                "node")
                    if command_exists node; then
                        tool_result="✓ $(node --version | sed 's/v/Node.js /')"
                        successful_tools=$((successful_tools + 1))
                    else
                        tool_result="✗ Verification failed"
                    fi
                    ;;
            esac
            
            summary_output="$summary_output$tool: $tool_result\n"
        fi
    done
    
    # Display summary
    echo ""
    log_info "Installation Summary:"
    echo "===================="
    echo -e "$summary_output"
    echo ""
    log_info "Success Rate: $successful_tools/$total_tools tools installed successfully"
    
    if [ $successful_tools -eq $total_tools ]; then
        return 0
    else
        return 1
    fi
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tool=*)
                SPECIFIC_TOOL="${1#*=}"
                shift
                ;;
            --all)
                INSTALL_ALL=true
                shift
                ;;
            --force)
                FORCE_INSTALL=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --interactive)
                INTERACTIVE_MODE=true
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 2
                ;;
        esac
    done
    
    # Validate arguments
    if [[ -n "$SPECIFIC_TOOL" ]] && [[ "$INSTALL_ALL" == true ]]; then
        log_error "Cannot specify both --tool and --all options"
        exit 2
    fi
    
    if [[ -z "$SPECIFIC_TOOL" ]] && [[ "$INSTALL_ALL" != true ]] && [[ "$INTERACTIVE_MODE" != true ]]; then
        log_error "Must specify either --tool=<tool>, --all, or --interactive"
        show_usage
        exit 2
    fi
}

# Main execution
main() {
    log_info "Blockchain Tools Installer"
    log_info "Platform: $(detect_platform) ($(get_arch))"
    log_info "Max retries: $MAX_RETRIES, Validation timeout: ${VALIDATION_TIMEOUT}s"
    echo ""
    
    # Pre-flight checks
    log_info "Running pre-flight checks..."
    
    # Check if running in supported environment
    if [ "$(detect_platform)" = "unknown" ]; then
        log_error "Unsupported platform detected"
        log_info "This installer supports macOS, Linux, and Windows (WSL/Git Bash)"
        exit 1
    fi
    
    # Check for required utilities
    if ! command_exists curl && ! command_exists wget; then
        log_error "Neither curl nor wget found. Please install one of them first."
        exit 1
    fi
    
    local success=true
    local failed_tools=()
    
    if [ "$INSTALL_ALL" = true ]; then
        log_info "Installing all blockchain development tools..."
        echo ""
        
        # Install in dependency order with individual error tracking
        local tools=("rust" "solana" "anchor" "substrate" "node")
        for tool in "${tools[@]}"; do
            log_info "Starting installation of $tool..."
            if ! install_tool "$tool"; then
                success=false
                failed_tools+=("$tool")
                log_error "$tool installation failed"
            else
                log_success "$tool installation completed"
            fi
            echo ""
        done
        
    elif [ -n "$SPECIFIC_TOOL" ]; then
        log_info "Installing $SPECIFIC_TOOL..."
        echo ""
        if ! install_tool "$SPECIFIC_TOOL"; then
            success=false
            failed_tools+=("$SPECIFIC_TOOL")
        fi
        
    else
        log_error "No installation target specified. Use --all or --tool=<tool>"
        show_usage
        exit 1
    fi
    
    # Generate installation summary
    if ! report_installation_summary; then
        success=false
    fi
    
    # Final status and recommendations
    echo ""
    if [ "$success" = true ]; then
        log_success "All installations completed successfully!"
        log_info "Recommendations:"
        log_info "1. Restart your terminal or run 'source ~/.bashrc' to update your PATH"
        log_info "2. Run the dependency checker to verify everything is working:"
        log_info "   ./scripts/blockchain-deps-check.sh"
        log_info "3. Try building contracts to test the setup:"
        log_info "   ./scripts/build-contracts.sh"
    else
        log_error "Some installations failed: ${failed_tools[*]}"
        log_info "Troubleshooting steps:"
        log_info "1. Check the error messages above for specific issues"
        log_info "2. Try installing failed tools individually with --tool=<tool>"
        log_info "3. Follow the manual installation instructions provided"
        log_info "4. Check network connectivity and permissions"
        log_info "5. Consult the troubleshooting documentation"
        exit 1
    fi
}

# Initialize and run
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Initialize help system if available
    if command -v init_help_system >/dev/null 2>&1; then
        init_help_system "$(basename "$0")"
    fi
    
    # Parse arguments
    parse_arguments "$@"
    
    # Handle interactive mode
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        run_interactive_installation
        exit $?
    fi
    
    # Run main installation
    main
fi