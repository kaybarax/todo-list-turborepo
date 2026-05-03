#!/usr/bin/env bash

# Shared cleanup utility for Todo App Monorepo
# This script provides a unified way to clean build artifacts and node_modules

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
YES=0
DRY_RUN=0
VERBOSE=0
DIR=""
TYPE="general"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# shellcheck disable=SC2329
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo "Usage: $0 --dir <directory> [--type <app|package|general>] [--yes] [--dry-run] [--verbose]"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dir) DIR="$2"; shift 2 ;;
        --type) TYPE="$2"; shift 2 ;;
        --yes|-y) YES=1; shift ;;
        --dry-run) DRY_RUN=1; shift ;;
        --verbose|-v) VERBOSE=1; shift ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

if [ -z "$DIR" ]; then
    print_error "Directory (--dir) is required"
    usage
fi

# Function to confirm action
confirm() {
    if [ "$YES" -eq 1 ]; then
        return 0
    fi
    read -r -p "$1 (y/N) " response || true
    echo
    if [[ "$response" =~ ^[Yy]$ ]]; then
        return 0
    fi
    return 1
}

# Function to run command
run_cmd() {
    local cmd
    cmd="$1"
    if [ "$DRY_RUN" -eq 1 ]; then
        echo "DRY-RUN: $cmd"
    else
        if [ "$VERBOSE" -eq 1 ]; then
            echo "Executing: $cmd"
        fi
        eval "$cmd"
    fi
}

# Change to target directory
if [ ! -d "$DIR" ]; then
    print_error "Directory does not exist: $DIR"
    exit 1
fi

cd "$DIR"
print_status "Cleaning artifacts in $(pwd)..."

# Common directories to clean
dirs=(dist build coverage logs .turbo .cache .next out storybook-static chromatic-output)
# Common files to clean
files=(.eslintcache tsconfig.tsbuildinfo chromatic-diagnostics.json tsconfig.build.tsbuildinfo)

# Add type-specific artifacts
case "$TYPE" in
    app)
        # Apps might have more
        dirs+=(.next)
        ;;
    package)
        # Packages might have specific ones
        files+=(*.tsbuildinfo)
        ;;
esac

# Clean directories
for d in "${dirs[@]}"; do
    if [ -d "$d" ]; then
        run_cmd "rm -rf $d"
    fi
done

# Clean files
for f in "${files[@]}"; do
    # Handle patterns
    if [[ "$f" == *"*"* ]]; then
        find . -maxdepth 1 -name "$f" -exec rm -f {} + 2>/dev/null || true
    elif [ -f "$f" ]; then
        run_cmd "rm -f $f"
    fi
done

# Optional node_modules cleanup
if confirm "Remove node_modules in $(basename "$DIR")?"; then
    run_cmd "rm -rf node_modules"
fi

print_success "Cleanup for $(basename "$DIR") completed."
