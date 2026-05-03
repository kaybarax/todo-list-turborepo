# Platform-Specific Installation Instructions

## Overview

This guide provides detailed, platform-specific instructions for setting up the complete blockchain development environment on macOS, Linux, and Windows systems. Each platform has unique requirements and optimal installation methods.

## macOS Installation

### Prerequisites

- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools
- Homebrew (recommended)

### Step 1: Install System Dependencies

#### Install Xcode Command Line Tools

```bash
xcode-select --install
```

#### Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install System Libraries

```bash
# Essential development tools
brew install git curl wget pkg-config openssl cmake

# Additional libraries for blockchain development
brew install libuv libffi
```

### Step 2: Install Node.js

```bash
# Install Node.js 20+ using Homebrew
brew install node@20

# Or use Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install 20
nvm use 20
nvm alias default 20
```

### Step 3: Install Rust

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add WebAssembly target for Substrate
rustup target add wasm32-unknown-unknown

# Install essential Rust tools
rustup component add rustfmt clippy
```

### Step 4: Install Solana CLI

```bash
# Method 1: Official installer (recommended)
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Method 2: Homebrew
brew install solana
```

### Step 5: Install Anchor CLI

```bash
# Install using cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Step 6: Configure Environment

```bash
# Add to ~/.zshrc (or ~/.bash_profile for bash)
cat >> ~/.zshrc << 'EOF'
# Rust environment
export PATH="$HOME/.cargo/bin:$PATH"

# Solana environment
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Development environment
export RUST_BACKTRACE=1
export CARGO_INCREMENTAL=1
EOF

# Reload shell configuration
source ~/.zshrc
```

### Step 7: Verify Installation

```bash
# Check versions
node --version          # Should be 20+
npm --version
rustc --version         # Should be 1.70+
cargo --version
solana --version        # Should be 1.16+
anchor --version        # Should be latest
```

### macOS-Specific Notes

- **M1/M2 Macs**: All tools have native Apple Silicon support
- **Rosetta**: Not required for blockchain development tools
- **Security**: You may need to allow downloaded tools in System Preferences > Security & Privacy

---

## Linux Installation (Ubuntu/Debian)

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- sudo access
- Internet connection

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install System Dependencies

```bash
# Essential development tools
sudo apt install -y curl wget git build-essential pkg-config libssl-dev

# Additional libraries for blockchain development
sudo apt install -y clang libuv1-dev libffi-dev cmake

# For GUI applications (if needed)
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.0-dev
```

### Step 3: Install Node.js

```bash
# Method 1: Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Method 2: Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

### Step 4: Install Rust

```bash
# Install Rust using rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install essential components
rustup component add rustfmt clippy
```

### Step 5: Install Solana CLI

```bash
# Download and install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
```

### Step 6: Install Anchor CLI

```bash
# Install Anchor CLI using cargo
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Step 7: Configure Environment

```bash
# Add to ~/.bashrc
cat >> ~/.bashrc << 'EOF'
# Rust environment
export PATH="$HOME/.cargo/bin:$PATH"

# Solana environment
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Development environment
export RUST_BACKTRACE=1
export CARGO_INCREMENTAL=1
EOF

# Reload shell configuration
source ~/.bashrc
```

### Step 8: Verify Installation

```bash
# Check versions
node --version          # Should be 20+
npm --version
rustc --version         # Should be 1.70+
cargo --version
solana --version        # Should be 1.16+
anchor --version        # Should be latest
```

### Linux Distribution Specific Notes

#### CentOS/RHEL/Fedora

```bash
# Install development tools
sudo dnf groupinstall "Development Tools"
sudo dnf install pkg-config openssl-devel clang

# For older versions (CentOS 7/RHEL 7)
sudo yum groupinstall "Development Tools"
sudo yum install pkg-config openssl-devel clang
```

#### Arch Linux

```bash
# Install dependencies
sudo pacman -S base-devel git curl wget pkg-config openssl clang

# Install Node.js
sudo pacman -S nodejs npm
```

---

## Windows Installation

### Prerequisites

- Windows 10 version 1903+ or Windows 11
- Administrator access
- PowerShell 5.1+ or PowerShell Core 7+

### Option 1: Windows Subsystem for Linux (WSL) - Recommended

#### Step 1: Install WSL

```powershell
# Run as Administrator
wsl --install -d Ubuntu-22.04
```

#### Step 2: Setup Ubuntu in WSL

After WSL installation and restart, follow the Linux (Ubuntu) installation instructions above.

#### Step 3: Configure WSL Integration

```bash
# In WSL terminal, add Windows PATH integration
echo 'export PATH="$PATH:/mnt/c/Windows/System32"' >> ~/.bashrc
source ~/.bashrc
```

### Option 2: Native Windows Installation

#### Step 1: Install Package Manager

```powershell
# Install Chocolatey (run as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Or install Scoop (user-level)
iwr -useb get.scoop.sh | iex
```

#### Step 2: Install Visual Studio Build Tools

```powershell
# Using Chocolatey
choco install visualstudio2022buildtools -y

# Or download manually from:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

#### Step 3: Install Git

```powershell
# Using Chocolatey
choco install git -y

# Using Scoop
scoop install git
```

#### Step 4: Install Node.js

```powershell
# Using Chocolatey
choco install nodejs -y

# Using Scoop
scoop install nodejs

# Or download from https://nodejs.org/
```

#### Step 5: Install Rust

```powershell
# Download and run rustup-init.exe from https://rustup.rs/
# Or use PowerShell
Invoke-WebRequest -Uri "https://win.rustup.rs/" -OutFile "rustup-init.exe"
.\rustup-init.exe

# Add WebAssembly target
rustup target add wasm32-unknown-unknown
```

#### Step 6: Install Solana CLI

```powershell
# Download Windows installer from GitHub releases
# https://github.com/solana-labs/solana/releases

# Or use PowerShell script
cmd /c "curl https://release.solana.com/v1.16.0/solana-install-init-x86_64-pc-windows-msvc.exe --output solana-install-init.exe"
.\solana-install-init.exe
```

#### Step 7: Install Anchor CLI

```powershell
# This requires WSL or may have compatibility issues
# Recommended to use WSL for Anchor development
```

#### Step 8: Configure Environment

```powershell
# Add to PowerShell profile
$profile_path = $PROFILE
if (!(Test-Path $profile_path)) {
    New-Item -Path $profile_path -Type File -Force
}

Add-Content -Path $profile_path -Value @"
# Rust environment
`$env:PATH += ";`$env:USERPROFILE\.cargo\bin"

# Solana environment
`$env:PATH += ";`$env:USERPROFILE\.local\share\solana\install\active_release\bin"
"@
```

### Windows-Specific Notes

- **WSL is strongly recommended** for blockchain development on Windows
- Native Windows support varies by tool (Solana: good, Anchor: limited)
- PowerShell execution policy may need adjustment
- Windows Defender may flag some tools - add exclusions as needed

---

## Docker-Based Development (All Platforms)

### Prerequisites

- Docker Desktop installed
- Docker Compose (included with Docker Desktop)

### Step 1: Create Development Container

```dockerfile
# Create Dockerfile.dev
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl wget git build-essential pkg-config libssl-dev \
    clang libuv1-dev libffi-dev cmake \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup target add wasm32-unknown-unknown

# Install Solana CLI
RUN sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Install Anchor CLI
RUN cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
RUN avm install latest && avm use latest

WORKDIR /workspace
```

### Step 2: Create Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  blockchain-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/workspace
      - cargo-cache:/root/.cargo
      - solana-cache:/root/.cache/solana
    ports:
      - '8899:8899' # Solana local validator
      - '8900:8900' # Solana WebSocket
    environment:
      - RUST_BACKTRACE=1
      - CARGO_INCREMENTAL=1

volumes:
  cargo-cache:
  solana-cache:
```

### Step 3: Use Development Container

```bash
# Build and start container
docker compose -f docker-compose.dev.yml up -d

# Enter development environment
docker compose -f docker-compose.dev.yml exec blockchain-dev bash

# Verify installation
node --version
rustc --version
solana --version
anchor --version
```

---

## Verification Script

Create a verification script to test all installations:

```bash
#!/bin/bash
# verify-installation.sh

echo "🔍 Verifying blockchain development environment..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js: Not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm: Not found"
fi

# Check Rust
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✅ Rust: $RUST_VERSION"
else
    echo "❌ Rust: Not found"
fi

# Check Cargo
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version)
    echo "✅ Cargo: $CARGO_VERSION"
else
    echo "❌ Cargo: Not found"
fi

# Check Solana CLI
if command -v solana &> /dev/null; then
    SOLANA_VERSION=$(solana --version)
    echo "✅ Solana CLI: $SOLANA_VERSION"
else
    echo "❌ Solana CLI: Not found"
fi

# Check Anchor CLI
if command -v anchor &> /dev/null; then
    ANCHOR_VERSION=$(anchor --version)
    echo "✅ Anchor CLI: $ANCHOR_VERSION"
else
    echo "❌ Anchor CLI: Not found"
fi

# Check WebAssembly target
if rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "✅ WebAssembly target: Installed"
else
    echo "❌ WebAssembly target: Not installed"
fi

echo ""
echo "🎯 Environment verification complete!"
```

Make it executable and run:

```bash
chmod +x verify-installation.sh
./verify-installation.sh
```

---

## Troubleshooting by Platform

### macOS Common Issues

- **Permission denied**: Use `sudo` for system-wide installations
- **Command not found**: Check PATH in `~/.zshrc`
- **Xcode issues**: Reinstall Command Line Tools
- **Homebrew conflicts**: Run `brew doctor`

### Linux Common Issues

- **Package conflicts**: Update package lists with `apt update`
- **Permission issues**: Ensure user is in sudo group
- **Missing libraries**: Install build-essential package
- **Network issues**: Check firewall and proxy settings

### Windows Common Issues

- **PowerShell execution policy**: Run `Set-ExecutionPolicy RemoteSigned`
- **Path issues**: Restart terminal after installations
- **Visual Studio Build Tools**: Ensure C++ workload is installed
- **WSL networking**: Configure WSL network settings

---

## Next Steps

After successful installation:

1. **Test the environment** using our verification script
2. **Run the dependency checker**: `./scripts/blockchain-deps-check.sh`
3. **Try building contracts**: `./scripts/build-contracts.sh`
4. **Set up your development workflow**
5. **Configure your IDE** with appropriate extensions

For ongoing development, refer to the specific troubleshooting guides for each tool:

- [Anchor CLI Setup](./anchor-setup.md)
- [Solana CLI Setup](./solana-setup.md)
- [Rust Environment Setup](./rust-setup.md)
