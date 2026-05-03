#!/bin/bash

# Custom build script for Solana programs without using +solana toolchain

echo "Building Solana program with custom script..."

# Set the Rust toolchain to use
export RUSTUP_TOOLCHAIN=1.75.0

# Navigate to the program directory
cd programs/todo-program || exit 1

# Build the program for the BPF target
echo "Building todo-program..."
cargo build --release --target bpfel-unknown-none

echo "Build completed!"