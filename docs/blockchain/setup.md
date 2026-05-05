# Blockchain Development Environment Setup

This guide provides comprehensive instructions for setting up the blockchain development environment for the Todo List Monorepo, which supports multiple blockchain networks including Polygon, Solana, Polkadot, Moonbeam, and Base.

## 🚀 Quick Start

### Automated Setup (Recommended)

The easiest way to get started is using our automated dependency management system:

```bash
# Check all blockchain dependencies
pnpm blockchain:deps:check

# Automatically install missing dependencies
pnpm blockchain:deps:fix

# Interactive troubleshooting mode
pnpm blockchain:deps:fix:interactive
```

### Development Container (Easiest)

Use the pre-configured development container with all tools pre-installed:

1. Open the project in VS Code
2. Select "Reopen in Container" when prompted
3. All blockchain tools will be automatically available

## 📋 Prerequisites

### Core Requirements

- **Node.js 20+** (see .nvmrc for exact version)
- **pnpm 9+** (required for workspace management)
- **Git** for version control

### Blockchain-Specific Requirements

#### For All Networks

- **Node.js 20+** with npm/pnpm

#### For Solana Development

- **Rust 1.70+** with Cargo
- **Solana CLI 1.16+**
- **Anchor CLI 0.28+**

#### For Polkadot Development

- **Rust 1.70+** with Cargo
- **cargo-contract** for ink! smart contracts
- **WebAssembly target** (wasm32-unknown-unknown)
- **Protocol Buffers compiler** (protoc)

#### For Polygon/Moonbeam/Base Development

- **Node.js 20+** with npm/pnpm
- **Hardhat** (installed via project dependencies)

## 🛠️ Manual Installation

If you prefer to install dependencies manually or the automated setup fails, follow these platform-specific instructions:

### macOS

#### Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Core Dependencies

```bash
# Node.js and pnpm
brew install node@20 pnpm

# Rust and Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Protocol Buffers (for Polkadot)
brew install protobuf
```

#### Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

#### Install Anchor CLI

```bash
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install and use Anchor
avm install 0.29.0
avm use 0.29.0
```

#### Install Substrate Tools

```bash
# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install cargo-contract
cargo install cargo-contract --force
```

### Linux (Ubuntu/Debian)

#### Update Package Manager

```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Core Dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm@9.12.0

# Build essentials and Protocol Buffers
sudo apt-get install -y build-essential protobuf-compiler

# Rust and Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

#### Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

#### Install Anchor CLI

```bash
# Install Anchor Version Manager
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install and use Anchor
avm install 0.29.0
avm use 0.29.0
```

#### Install Substrate Tools

```bash
# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install cargo-contract
cargo install cargo-contract --force
```

### Windows

#### Using Windows Subsystem for Linux (WSL) - Recommended

1. Install WSL2 with Ubuntu
2. Follow the Linux installation instructions above

#### Native Windows Installation

1. **Node.js**: Download from [nodejs.org](https://nodejs.org/)
2. **pnpm**: `npm install -g pnpm@9.12.0`
3. **Rust**: Download from [rustup.rs](https://rustup.rs/)
4. **Solana CLI**: Download from [GitHub releases](https://github.com/solana-labs/solana/releases)
5. **Protocol Buffers**: Download from [GitHub releases](https://github.com/protocolbuffers/protobuf/releases)

## 🔧 Environment Configuration

### Shell Configuration

Add the following to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# Cargo (Rust)
export PATH="$HOME/.cargo/bin:$PATH"

# Solana CLI
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Solana configuration (optional)
export SOLANA_RPC_URL="https://api.devnet.solana.com"
```

### Solana Configuration

Configure Solana CLI for development:

```bash
# Set to devnet for development
solana config set --url devnet

# Generate a keypair (for testing)
solana-keygen new --outfile ~/.config/solana/id.json

# Check configuration
solana config get
```

### Rust Configuration

Ensure Rust is properly configured:

```bash
# Update Rust to latest stable
rustup update stable

# Add WebAssembly target for Substrate
rustup target add wasm32-unknown-unknown

# Install useful components
rustup component add clippy rustfmt
```

## 📦 Project Setup

After installing all dependencies, set up the project:

```bash
# Clone the repository
git clone <repository-url>
cd todo-list-monorepo

# Install project dependencies
pnpm install

# Verify blockchain environment
pnpm blockchain:deps:check --verbose

# Setup database
pnpm db:setup

# Build all contracts
pnpm contracts:compile
```

## 🧪 Testing Your Setup

### Verify All Dependencies

```bash
# Comprehensive dependency check
pnpm blockchain:deps:check --verbose

# Network-specific checks
pnpm blockchain:deps:check:polygon
pnpm blockchain:deps:check:solana
pnpm blockchain:deps:check:polkadot
```

### Test Contract Compilation

```bash
# Test all networks
pnpm contracts:test

# Test specific networks
pnpm contracts:polygon
pnpm contracts:solana
pnpm contracts:polkadot
```

### Run Development Environment

```bash
# Start all services
pnpm dev

# Start blockchain-specific development
pnpm dev:contracts
```

## 🚨 Troubleshooting

### Common Issues

#### Rust Installation Issues

```bash
# If rustup fails, try manual installation
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --help

# Check Rust installation
rustc --version
cargo --version
```

#### Solana CLI Issues

```bash
# If Solana CLI is not found after installation
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Update Solana CLI
solana-install update
```

#### Anchor CLI Issues

```bash
# If Anchor installation fails, try specific version
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v0.29.0 --locked

# Check Anchor installation
anchor --version
```

#### Permission Issues

```bash
# Fix cargo permissions
sudo chown -R $(whoami) ~/.cargo

# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

### Interactive Troubleshooting

Use our interactive troubleshooting system:

```bash
# Interactive dependency fixing
pnpm blockchain:deps:fix:interactive

# Interactive help system
pnpm blockchain:help:interactive

# Comprehensive environment diagnosis
pnpm blockchain:deps:diagnose
```

### Getting Help

1. **Check Documentation**: Review the troubleshooting guides in `scripts/troubleshooting/`
2. **Run Diagnostics**: Use `pnpm blockchain:deps:diagnose` for detailed analysis
3. **Interactive Mode**: Use `pnpm blockchain:deps:fix:interactive` for guided setup
4. **Manual Installation**: Follow the manual installation instructions above

## 📚 Additional Resources

### Documentation

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Substrate Documentation](https://docs.substrate.io/)
- [Hardhat Documentation](https://hardhat.org/docs)

### Network-Specific Guides

- [Polygon Development](https://docs.polygon.technology/)
- [Moonbeam Development](https://docs.moonbeam.network/)
- [Base Development](https://docs.base.org/)

### Tools and IDEs

- [VS Code Solana Extension](https://marketplace.visualstudio.com/items?itemName=solana-labs.solana)
- [Rust Analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [Hardhat VS Code Extension](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)

## 🔄 Keeping Dependencies Updated

### Regular Updates

```bash
# Update Rust
rustup update

# Update Solana CLI
solana-install update

# Update Anchor CLI
avm install latest
avm use latest

# Update project dependencies
pnpm update
```

### Version Management

```bash
# Check current versions
pnpm blockchain:deps:check --verbose

# Pin specific versions in CI/CD
export SOLANA_VERSION="1.18.0"
export ANCHOR_VERSION="0.29.0"
```

## 🎯 Next Steps

After completing the setup:

1. **Explore the Codebase**: Review the smart contracts in `apps/smart-contracts/`
2. **Run Tests**: Execute `pnpm test:contracts` to verify everything works
3. **Start Development**: Use `pnpm dev` to start the development environment
4. **Deploy Contracts**: Follow the deployment guides for each network

For more detailed information about development workflows, see the main [README.md](../../README.md) and the [documentation index](../README.md).
