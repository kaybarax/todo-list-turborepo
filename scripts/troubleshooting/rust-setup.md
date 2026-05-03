# Rust Development Environment Setup Guide

## Overview

Rust is required for Solana program development and Polkadot/Substrate development. This guide covers installation, configuration, and troubleshooting for Rust development environments across different platforms.

## Prerequisites

- Operating System: macOS, Linux, or Windows
- Internet connection for downloading tools
- Terminal/Command Prompt access
- C compiler (automatically handled by rustup on most systems)

## Installation

### Automatic Installation (Recommended)

Use our automated installer:

```bash
./scripts/install-blockchain-tools.sh --tool=rust
```

### Manual Installation

#### Method 1: Using rustup (Recommended)

```bash
# Download and install rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts and restart your shell
source ~/.cargo/env
```

#### Method 2: Platform-specific Package Managers

**macOS (Homebrew):**

```bash
brew install rust
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install rustc cargo
```

**Windows:**

- Download installer from https://rustup.rs/
- Or use Windows Subsystem for Linux (WSL)

## Initial Configuration

### 1. Verify Installation

```bash
rustc --version
cargo --version
rustup --version
```

### 2. Set Default Toolchain

```bash
# Set stable as default
rustup default stable

# Update to latest stable
rustup update stable
```

### 3. Add Required Components

```bash
# Add components needed for blockchain development
rustup component add rustfmt clippy

# Add WebAssembly target for Substrate development
rustup target add wasm32-unknown-unknown
```

### 4. Configure Cargo

```bash
# Create cargo config directory
mkdir -p ~/.cargo

# Configure cargo for better performance
cat > ~/.cargo/config.toml << EOF
[build]
jobs = 4

[net]
retry = 3

[source.crates-io]
replace-with = "sparse-index"
EOF
```

## Common Issues and Solutions

### Issue 1: "rustc: command not found"

**Symptoms:**

- Command `rustc --version` returns "command not found"
- Installation appears successful but Rust is not available

**Solutions:**

1. **Check PATH configuration:**

   ```bash
   # Check if cargo bin is in PATH
   echo $PATH | grep -o ~/.cargo/bin

   # Add to PATH (add to ~/.bashrc, ~/.zshrc, or ~/.profile)
   export PATH="$HOME/.cargo/bin:$PATH"
   source ~/.bashrc  # or ~/.zshrc
   ```

2. **Reload environment:**

   ```bash
   source ~/.cargo/env
   ```

3. **Verify installation directory:**
   ```bash
   ls -la ~/.cargo/bin/
   which rustc
   ```

### Issue 2: Compilation errors with system dependencies

**Symptoms:**

- "linker `cc` not found" errors
- Missing system libraries during compilation
- Build failures with cryptic error messages

**Solutions:**

**macOS:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install additional dependencies via Homebrew
brew install pkg-config openssl
```

**Ubuntu/Debian:**

```bash
# Install build essentials
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev

# For Substrate development
sudo apt install -y clang curl git make
```

**CentOS/RHEL/Fedora:**

```bash
# Install development tools
sudo dnf groupinstall "Development Tools"
sudo dnf install pkg-config openssl-devel

# Or for older versions
sudo yum groupinstall "Development Tools"
sudo yum install pkg-config openssl-devel
```

**Windows:**

```powershell
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Or use chocolatey
choco install visualstudio2019buildtools
```

### Issue 3: "failed to run custom build command" errors

**Symptoms:**

- Build failures during `cargo build`
- Dependency compilation errors
- Out of memory errors during compilation

**Solutions:**

1. **Increase available memory:**

   ```bash
   # Set environment variable for more memory
   export CARGO_BUILD_JOBS=2  # Reduce parallel jobs

   # Or build with limited parallelism
   cargo build -j 2
   ```

2. **Clean and rebuild:**

   ```bash
   cargo clean
   rm -rf target/
   cargo build
   ```

3. **Update dependencies:**
   ```bash
   cargo update
   cargo build
   ```

### Issue 4: Slow compilation times

**Symptoms:**

- Very slow `cargo build` times
- High CPU usage during compilation
- Long dependency resolution

**Solutions:**

1. **Configure cargo for better performance:**

   ```bash
   # Add to ~/.cargo/config.toml
   [build]
   jobs = 4  # Adjust based on CPU cores

   [source.crates-io]
   replace-with = "sparse-index"

   [net]
   retry = 3
   ```

2. **Use cargo cache:**

   ```bash
   # Install sccache for compilation caching
   cargo install sccache
   export RUSTC_WRAPPER=sccache
   ```

3. **Enable incremental compilation:**
   ```bash
   export CARGO_INCREMENTAL=1
   ```

### Issue 5: WebAssembly target issues (Substrate development)

**Symptoms:**

- "wasm32-unknown-unknown" target not found
- WebAssembly compilation failures
- Missing wasm-related tools

**Solutions:**

1. **Add WebAssembly target:**

   ```bash
   rustup target add wasm32-unknown-unknown
   ```

2. **Install wasm-pack:**

   ```bash
   cargo install wasm-pack
   ```

3. **Verify target installation:**
   ```bash
   rustup target list --installed
   ```

### Issue 6: Version conflicts and toolchain issues

**Symptoms:**

- "unsupported Rust version" errors
- Toolchain conflicts between projects
- Outdated compiler warnings

**Solutions:**

1. **Update Rust toolchain:**

   ```bash
   rustup update stable
   rustup default stable
   ```

2. **Use project-specific toolchains:**

   ```bash
   # Create rust-toolchain.toml in project root
   cat > rust-toolchain.toml << EOF
   [toolchain]
   channel = "stable"
   components = ["rustfmt", "clippy"]
   targets = ["wasm32-unknown-unknown"]
   EOF
   ```

3. **Override toolchain for specific project:**
   ```bash
   rustup override set stable
   ```

## Platform-Specific Setup

### macOS Setup

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install additional tools via Homebrew
brew install pkg-config openssl cmake

# For M1/M2 Macs, ensure proper architecture
rustup target add aarch64-apple-darwin
```

### Linux Setup (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt update
sudo apt install -y curl build-essential pkg-config libssl-dev git clang

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add WebAssembly target
rustup target add wasm32-unknown-unknown
```

### Windows Setup

```powershell
# Option 1: Native Windows
# Download and run rustup-init.exe from https://rustup.rs/

# Option 2: WSL (Recommended for blockchain development)
# Install WSL first, then follow Linux instructions

# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

## Development Tools and Extensions

### Essential Cargo Tools

```bash
# Code formatting
cargo install rustfmt

# Linting
cargo install clippy

# Documentation generation
cargo install cargo-doc

# Dependency management
cargo install cargo-edit
cargo install cargo-outdated

# Security auditing
cargo install cargo-audit

# Performance profiling
cargo install cargo-flamegraph
```

### IDE Setup

#### Visual Studio Code

```bash
# Install Rust extension
code --install-extension rust-lang.rust-analyzer
code --install-extension vadimcn.vscode-lldb
```

#### IntelliJ/CLion

- Install Rust plugin from JetBrains marketplace

#### Vim/Neovim

```bash
# Install rust.vim plugin
# Add to .vimrc or init.vim
```

## Environment Variables

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# Rust environment
export PATH="$HOME/.cargo/bin:$PATH"
export RUST_BACKTRACE=1  # Enable backtraces for debugging
export CARGO_INCREMENTAL=1  # Enable incremental compilation

# For Substrate development
export WASM_BUILD_TOOLCHAIN=stable

# For better performance
export CARGO_BUILD_JOBS=4  # Adjust based on CPU cores
```

## Project Structure Best Practices

### Basic Rust Project

```text
my-project/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── main.rs
│   └── lib.rs
├── tests/
│   └── integration_test.rs
└── examples/
    └── example.rs
```

### Workspace Configuration

```toml
# Cargo.toml for workspace
[workspace]
members = [
    "crate1",
    "crate2",
]

[workspace.dependencies]
serde = "1.0"
tokio = "1.0"
```

## Testing and Quality Assurance

### Running Tests

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_name

# Run with output
cargo test -- --nocapture

# Run benchmarks
cargo bench
```

### Code Quality Tools

```bash
# Format code
cargo fmt

# Lint code
cargo clippy

# Check without building
cargo check

# Security audit
cargo audit

# Check for outdated dependencies
cargo outdated
```

## Performance Optimization

### Compilation Optimization

```toml
# Add to Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"

[profile.dev]
opt-level = 0
debug = true
```

### Build Caching

```bash
# Install and configure sccache
cargo install sccache
export RUSTC_WRAPPER=sccache

# Check cache statistics
sccache --show-stats
```

## Troubleshooting Checklist

1. **Verify installation:**

   ```bash
   rustc --version
   cargo --version
   ```

2. **Check PATH:**

   ```bash
   echo $PATH | grep cargo
   which rustc
   ```

3. **Update toolchain:**

   ```bash
   rustup update
   ```

4. **Clean build artifacts:**

   ```bash
   cargo clean
   ```

5. **Check system dependencies:**
   - C compiler (gcc/clang)
   - pkg-config
   - OpenSSL development libraries

## Getting Help

- **Official Documentation**: https://doc.rust-lang.org/
- **Rust Book**: https://doc.rust-lang.org/book/
- **Cargo Book**: https://doc.rust-lang.org/cargo/
- **GitHub Repository**: https://github.com/rust-lang/rust
- **Community Forum**: https://users.rust-lang.org/
- **Discord**: https://discord.gg/rust-lang
- **Stack Overflow**: Tag questions with `rust`

## Version Management

```bash
# List installed toolchains
rustup toolchain list

# Install specific version
rustup toolchain install 1.70.0

# Set default toolchain
rustup default stable

# Update all toolchains
rustup update

# Show current toolchain
rustup show
```

## Blockchain-Specific Setup

### For Solana Development

```bash
# Ensure stable toolchain
rustup default stable

# Required for Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### For Substrate Development

```bash
# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install substrate-contracts-node
cargo install contracts-node --git https://github.com/paritytech/substrate-contracts-node.git

# Install cargo-contract
cargo install cargo-contract --force --locked
```
