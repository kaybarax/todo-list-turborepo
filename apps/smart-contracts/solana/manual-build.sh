#!/bin/bash

# Manual build script for Solana program

echo "Manual Solana program build..."

# Set up environment
export SOLANA_PATH="/Users/kevin/.local/share/solana/install/active_release/bin"
export PLATFORM_TOOLS_PATH="/Users/kevin/.local/share/solana/install/active_release/bin/platform-tools-sdk/sbf/dependencies/platform-tools"

# Create target directory
mkdir -p target/deploy

# Navigate to program directory
cd programs/todo-program || exit 1

echo "Compiling Solana program manually..."

# Try to compile using the Solana Rust toolchain directly
$PLATFORM_TOOLS_PATH/rust/bin/cargo build --release --target sbf-solana-solana

echo "Manual build completed!"