# Troubleshooting Guide

This guide provides solutions to common issues encountered when developing with the Todo List Monorepo.

## 🚀 Quick Diagnostics

Before diving into specific issues, run our automated diagnostic tools:

```bash
# Check blockchain development environment
pnpm blockchain:deps:check -- --verbose

# Run comprehensive environment diagnosis
pnpm blockchain:deps:check -- --diagnose

# Interactive troubleshooting
pnpm blockchain:deps:fix -- --interactive
```

## 🔧 Blockchain Development Issues

### Smart Contract Compilation Failures

#### Issue: "anchor: command not found"

**Symptoms**: Anchor CLI commands fail with "command not found"

**Solutions**:

```bash
# Option 1: Automated installation
pnpm blockchain:tools:install -- --tool=anchor

# Option 2: Manual installation
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Option 3: Check PATH
export PATH="$HOME/.cargo/bin:$PATH"
source ~/.bashrc  # or ~/.zshrc
```

#### Issue: "solana: command not found"

**Symptoms**: Solana CLI commands fail

**Solutions**:

```bash
# Option 1: Automated installation
pnpm blockchain:tools:install -- --tool=solana

# Option 2: Manual installation
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Option 3: Update existing installation
solana-install update
```

#### Issue: "rustc: command not found"

**Symptoms**: Rust compilation fails

**Solutions**:

```bash
# Option 1: Automated installation
pnpm blockchain:tools:install -- --tool=rust

# Option 2: Manual installation
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Option 3: Update existing installation
rustup update stable
```

#### Issue: "cargo-contract: command not found"

**Symptoms**: Polkadot/Substrate contract compilation fails

**Solutions**:

```bash
# Option 1: Automated installation
pnpm blockchain:tools:install -- --tool=substrate

# Option 2: Manual installation
rustup target add wasm32-unknown-unknown
cargo install cargo-contract --force

# Option 3: Install protobuf (required dependency)
# macOS:
brew install protobuf
# Ubuntu/Debian:
sudo apt-get install protobuf-compiler
```

### Version Compatibility Issues

#### Issue: Outdated tool versions

**Symptoms**: Tools are installed but versions are too old

**Check versions**:

```bash
pnpm blockchain:deps:check -- --verbose
```

**Update tools**:

```bash
# Update all tools
pnpm blockchain:deps:fix

# Update specific tools
rustup update stable
solana-install update
avm install latest && avm use latest
cargo install cargo-contract --force
```

### Network Configuration Issues

#### Issue: Solana CLI not configured

**Symptoms**: Solana commands work but network errors occur

**Solutions**:

```bash
# Configure for development
solana config set --url devnet

# Generate keypair for testing
solana-keygen new --outfile ~/.config/solana/id.json

# Check configuration
solana config get

# Test connection
solana balance
```

#### Issue: Hardhat network issues

**Symptoms**: Polygon/Moonbeam/Base contract deployment fails

**Solutions**:

```bash
# Check Node.js version (must be 20+)
node --version

# Reinstall Hardhat dependencies
cd apps/smart-contracts/polygon
pnpm install

# Reset Hardhat cache
npx hardhat clean

# Test local network
npx hardhat node
```

## 🏗️ Development Environment Issues

### Package Management Issues

#### Issue: pnpm workspace resolution failures

**Symptoms**: Packages can't find each other, import errors

**Solutions**:

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install

# Verify workspace configuration
cat pnpm-workspace.yaml

# Check package linking
pnpm list --depth=0
```

#### Issue: "Cannot find module" errors

**Symptoms**: TypeScript/JavaScript import errors

**Solutions**:

```bash
# Rebuild TypeScript references
pnpm build:packages

# Check TypeScript configuration
pnpm typecheck

# Verify package exports
cat packages/*/package.json | grep -A 5 "exports"
```

### Docker and Container Issues

#### Issue: Docker containers won't start

**Symptoms**: docker compose up fails

**Solutions**:

```bash
# Clean Docker environment
docker compose down -v
docker system prune -f
docker volume prune -f

# Rebuild containers
docker compose build --no-cache

# Check Docker resources
docker system df
```

#### Issue: Development container issues

**Symptoms**: VS Code devcontainer fails to start

**Solutions**:

```bash
# Rebuild container
# In VS Code: Cmd/Ctrl+Shift+P > "Dev Containers: Rebuild Container"

# Check container logs
docker logs <container-id>

# Manual container build
docker build -f .devcontainer/Dockerfile -t todo-devcontainer .
```

### Database Issues

#### Issue: MongoDB connection failures

**Symptoms**: API can't connect to database

**Solutions**:

```bash
# Reset database
pnpm db:reset
pnpm db:setup

# Check MongoDB container
docker compose logs mongodb

# Verify connection string
cat apps/api/.env.example
```

#### Issue: Migration failures

**Symptoms**: Database migrations fail to run

**Solutions**:

```bash
# Check migration status
pnpm db:migrate status

# Reset and re-run migrations
pnpm db:reset
pnpm db:migrate

# Manual migration
cd db && node migrate.js up
```

## 🧪 Testing Issues

### Test Failures

#### Issue: Contract tests failing

**Symptoms**: Smart contract tests fail to run

**Solutions**:

```bash
# Check blockchain dependencies first
pnpm blockchain:deps:check

# Run tests with verbose output
pnpm test:contracts --verbose

# Test specific networks
pnpm contracts:polygon --test
pnpm contracts:solana --test
pnpm contracts:polkadot --test
```

#### Issue: E2E tests failing

**Symptoms**: Playwright or React Native tests fail

**Solutions**:

```bash
# Install browser dependencies
npx playwright install

# Check test environment
pnpm test:e2e --debug

# Reset test database
NODE_ENV=test pnpm db:reset
NODE_ENV=test pnpm db:setup
```

### Performance Issues

#### Issue: Slow builds

**Symptoms**: Build process takes too long

**Solutions**:

```bash
# Use quick build for development
pnpm build:quick

# Enable Turborepo caching
export TURBO_CACHE_DIR=.turbo

# Parallel builds
pnpm build --parallel

# Check build cache
turbo run build --dry-run
```

#### Issue: Memory issues during compilation

**Symptoms**: Out of memory errors during builds

**Solutions**:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Use swap space (Linux)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Build in stages
pnpm build:packages
pnpm build:apps
pnpm build:contracts
```

## 🌐 Network and Connectivity Issues

### Internet Connectivity

#### Issue: Installation failures due to network issues

**Symptoms**: Downloads fail, timeouts occur

**Solutions**:

```bash
# Test connectivity
curl -I https://github.com
curl -I https://sh.rustup.rs
curl -I https://release.solana.com

# Use different mirrors
export RUSTUP_DIST_SERVER=https://forge.rust-lang.org
export RUSTUP_UPDATE_ROOT=https://forge.rust-lang.org/rustup

# Configure proxy (if behind corporate firewall)
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

### Firewall Issues

#### Issue: Corporate firewall blocking downloads

**Symptoms**: SSL/TLS errors, connection refused

**Solutions**:

```bash
# Configure git to use HTTPS instead of SSH
git config --global url."https://github.com/".insteadOf git@github.com:

# Use alternative installation methods
# For Rust: Download rustup-init directly
# For Solana: Use GitHub releases instead of installer script
# For Node.js: Use official installers instead of package managers
```

## 🔍 Platform-Specific Issues

### macOS Issues

#### Issue: Xcode command line tools missing

**Symptoms**: Compilation fails with missing headers

**Solutions**:

```bash
# Install Xcode command line tools
xcode-select --install

# Accept license
sudo xcodebuild -license accept
```

#### Issue: Homebrew permission issues

**Symptoms**: brew commands fail with permission errors

**Solutions**:

```bash
# Fix Homebrew permissions
sudo chown -R $(whoami) $(brew --prefix)/*

# Reinstall Homebrew if necessary
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Linux Issues

#### Issue: Missing system dependencies

**Symptoms**: Compilation fails with missing libraries

**Solutions**:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libssl-dev protobuf-compiler

# CentOS/RHEL/Fedora
sudo yum groupinstall "Development Tools"
sudo yum install -y openssl-devel protobuf-compiler

# Arch Linux
sudo pacman -S base-devel openssl protobuf
```

### Windows Issues

#### Issue: WSL not configured properly

**Symptoms**: Linux commands don't work on Windows

**Solutions**:

```bash
# Install WSL2
wsl --install

# Set WSL2 as default
wsl --set-default-version 2

# Install Ubuntu
wsl --install -d Ubuntu

# Update WSL
wsl --update
```

## 🆘 Getting Additional Help

### Automated Help Systems

```bash
# Interactive troubleshooting
pnpm blockchain:help:interactive

# Comprehensive diagnosis
pnpm blockchain:deps:check -- --diagnose
```

### Manual Diagnostics

```bash
# Check all tool versions
node --version
pnpm --version
rustc --version
cargo --version
solana --version
anchor --version
cargo-contract --version

# Check environment variables
echo $PATH
echo $CARGO_HOME
echo $RUSTUP_HOME
echo $SOLANA_ROOT

# Check network connectivity
ping github.com
curl -I https://api.github.com
```

### Log Analysis

```bash
# Check build logs
cat build.log

# Check container logs
docker compose logs

# Check application logs
tail -f apps/api/logs/app.log
tail -f apps/web/.next/trace
```

### Community Resources

- **GitHub Issues**: Check existing issues and create new ones
- **Discord/Slack**: Join community channels for real-time help
- **Documentation**: Review official documentation for each tool
- **Stack Overflow**: Search for specific error messages

### Creating Bug Reports

When reporting issues, include:

1. **Environment Information**:

   ```bash
   pnpm blockchain:deps:check -- --verbose > environment.txt
   ```

2. **Error Messages**: Full error output with stack traces

3. **Steps to Reproduce**: Exact commands that cause the issue

4. **System Information**: OS, architecture, versions

5. **Logs**: Relevant log files and output

This comprehensive troubleshooting guide should help resolve most common issues. For issues not covered here, use the automated diagnostic tools or reach out to the community for support.
