# Blockchain Development Commands Reference

Quick reference for blockchain development dependency management and troubleshooting commands.

## 🔍 Dependency Checking

### Basic Checks

```bash
# Check all blockchain dependencies
pnpm blockchain:deps:check

# Check with detailed output and version information
pnpm blockchain:deps:check:verbose

# Check specific networks only
pnpm blockchain:deps:check:polygon    # Node.js, Hardhat
pnpm blockchain:deps:check:solana     # Rust, Solana CLI, Anchor CLI
pnpm blockchain:deps:check:polkadot   # Rust, cargo-contract, WASM target
```

### Advanced Diagnostics

```bash
# Comprehensive environment diagnosis
pnpm blockchain:deps:diagnose

# Interactive troubleshooting mode
pnpm blockchain:deps:check:interactive
```

## 🛠️ Automated Installation

### Fix Missing Dependencies

```bash
# Automatically install all missing dependencies
pnpm blockchain:deps:fix

# Interactive installation with guided setup
pnpm blockchain:deps:fix:interactive
```

### Install Specific Tools

```bash
# Install all blockchain tools
pnpm blockchain:tools:install

# Install specific tools
pnpm blockchain:tools:install:rust      # Rust and Cargo
pnpm blockchain:tools:install:solana    # Solana CLI
pnpm blockchain:tools:install:anchor    # Anchor CLI
pnpm blockchain:tools:install:substrate # Substrate tools

# Interactive installation guidance
pnpm blockchain:tools:install:interactive
```

## 🏗️ Contract Compilation (Enhanced)

All contract compilation commands now include automatic dependency checking:

```bash
# Compile all contracts with dependency verification
pnpm contracts:compile

# Network-specific compilation with dependency checks
pnpm contracts:polygon    # Solidity contracts (Hardhat)
pnpm contracts:solana     # Rust programs (Anchor)
pnpm contracts:polkadot   # Substrate pallets
pnpm contracts:moonbeam   # Moonbeam EVM contracts
pnpm contracts:base       # Base L2 contracts

# Test all contracts with dependency verification
pnpm contracts:test
```

## 📚 Help and Documentation

```bash
# Get blockchain development help
pnpm blockchain:help

# Interactive help system with guided troubleshooting
pnpm blockchain:help:interactive
```

## 🚨 Troubleshooting Workflows

### Quick Fix Workflow

```bash
# 1. Check what's missing
pnpm blockchain:deps:check

# 2. Fix automatically
pnpm blockchain:deps:fix

# 3. Verify installation
pnpm blockchain:deps:check:verbose

# 4. Test compilation
pnpm contracts:compile
```

### Interactive Troubleshooting Workflow

```bash
# 1. Start interactive mode
pnpm blockchain:deps:fix:interactive

# 2. Follow guided prompts for installation

# 3. Run comprehensive diagnosis if issues persist
pnpm blockchain:deps:diagnose
```

### Manual Troubleshooting Workflow

```bash
# 1. Get detailed environment information
pnpm blockchain:deps:check:verbose > environment.txt

# 2. Check specific network dependencies
pnpm blockchain:deps:check:solana  # or polygon, polkadot

# 3. Install missing tools manually
pnpm blockchain:tools:install:anchor  # example

# 4. Verify and test
pnpm blockchain:deps:check
pnpm contracts:solana
```

## 🔧 Advanced Usage

### Environment Variables

```bash
# Skip network connectivity checks
SKIP_NETWORK_CHECK=true pnpm blockchain:deps:check

# Disable automatic installation prompts
AUTO_INSTALL=false pnpm blockchain:deps:fix

# Enable debug mode
DEBUG=true pnpm blockchain:deps:check:verbose
```

### CI/CD Usage

```bash
# Non-interactive dependency installation for CI
CI=true pnpm blockchain:deps:fix

# Check dependencies without fixing
pnpm blockchain:deps:check --no-fix

# Install specific tools for CI
pnpm blockchain:tools:install:rust --non-interactive
```

### Development Container

```bash
# All tools are pre-installed in the development container
# Just verify they're working:
pnpm blockchain:deps:check:verbose
```

## 📋 Command Options Reference

### blockchain:deps:check Options

- `--verbose`: Show detailed version information and debug output
- `--network=<network>`: Check dependencies for specific network only
- `--interactive`: Enable interactive troubleshooting prompts
- `--diagnose`: Run comprehensive environment diagnosis
- `--fix`: Attempt to install missing dependencies automatically

### blockchain:tools:install Options

- `--tool=<tool>`: Install specific tool (rust, solana, anchor, substrate)
- `--interactive`: Enable interactive installation guidance
- `--force`: Force reinstallation even if tool exists
- `--non-interactive`: Disable all prompts (for CI/CD)

### contracts:\* Options (Enhanced)

- `--check-deps`: Verify dependencies before compilation (now default)
- `--skip-deps`: Skip dependency checking
- `--network=<network>`: Compile for specific network only
- `--test`: Run tests after compilation

## 🎯 Common Use Cases

### New Developer Setup

```bash
# Complete setup for new developer
git clone <repo>
cd todo-list-monorepo
pnpm install
pnpm blockchain:deps:fix:interactive
pnpm contracts:compile
pnpm dev
```

### CI/CD Pipeline

```bash
# Automated CI setup
pnpm install
pnpm blockchain:deps:check
pnpm blockchain:deps:fix
pnpm contracts:test
pnpm build
```

### Troubleshooting Build Failures

```bash
# When contract compilation fails
pnpm blockchain:deps:check:verbose
pnpm blockchain:deps:fix
pnpm contracts:compile --verbose
```

### Network-Specific Development

```bash
# Solana development setup
pnpm blockchain:deps:check:solana
pnpm blockchain:tools:install:solana
pnpm blockchain:tools:install:anchor
pnpm contracts:solana

# Polkadot development setup
pnpm blockchain:deps:check:polkadot
pnpm blockchain:tools:install:substrate
pnpm contracts:polkadot
```

### Environment Validation

```bash
# Before important deployments
pnpm blockchain:deps:check:verbose
pnpm contracts:test
pnpm test:integration:blockchain
```

## 📖 Related Documentation

- [Blockchain Setup](./setup.md) - Detailed setup instructions
- [Troubleshooting](../support/troubleshooting.md) - Comprehensive troubleshooting guide
- [Documentation Index](../README.md) - Main documentation index
- `scripts/troubleshooting/` - Platform-specific troubleshooting guides

## 🔄 Keeping Tools Updated

```bash
# Check for updates
pnpm blockchain:deps:check:verbose

# Update all tools
rustup update
solana-install update
avm install latest && avm use latest
cargo install cargo-contract --force

# Verify updates
pnpm blockchain:deps:check:verbose
```
