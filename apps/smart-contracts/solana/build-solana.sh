#!/bin/bash

# Build Solana program using cargo-build-sbf directly

echo "Building Solana program using cargo-build-sbf..."

# Create the solana toolchain link if it doesn't exist
if ! rustup toolchain list | grep -q "solana"; then
    echo "Creating Solana toolchain link..."
    rustup toolchain link solana /Users/kevin/.local/share/solana/install/active_release/bin/platform-tools-sdk/sbf/dependencies/platform-tools/rust
fi

# Navigate to the program directory
cd programs/todo-program || exit 1

# Try to build using cargo-build-sbf
echo "Building with cargo-build-sbf..."
cargo-build-sbf --manifest-path Cargo.toml

echo "Build completed!"