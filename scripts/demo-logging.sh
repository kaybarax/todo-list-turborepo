#!/bin/bash

# Demo script showing the complete build logging and reporting system

set -euo pipefail

# Source the logging system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/build-logger.sh"

# Demo configuration
export LOG_LEVEL="INFO"
export LOG_FILE="demo-build.log"
export REPORT_FILE="demo-build-report.json"

echo "=== Build Logging System Demo ==="
echo "This demo simulates a blockchain build process with comprehensive logging"
echo ""

# Initialize logging
init_logging

log_info "Starting blockchain contract build process"
log_info "Target networks: polygon, solana, polkadot"

# Set environment check
BUILD_REPORT_ENVIRONMENT_CHECK="success"

# Simulate Polygon build (success)
log_info "=== Building Polygon Contracts ==="
init_network_report "polygon"
show_progress "Installing dependencies" 2
log_info "Compiling Solidity contracts..."
show_progress "Compiling contracts" 3
add_compiled_artifact "polygon" "contracts_compiled" "TodoList"
add_compiled_artifact "polygon" "contracts_compiled" "UserRegistry"
add_network_warning "polygon" "Using deprecated OpenZeppelin version"
log_success "Polygon contracts compiled successfully"
show_progress "Running tests" 2
log_success "All tests passed"
update_network_status "polygon" "success"

# Simulate Solana build (failure)
log_info "=== Building Solana Programs ==="
init_network_report "solana"
show_progress "Checking Rust installation" 1
add_network_error "solana" "Anchor CLI not found"
add_network_error "solana" "Rust version 1.65.0 too old (required: 1.70+)"
log_error "Solana build failed due to missing dependencies"
update_network_status "solana" "failed"

# Simulate Polkadot build (success with warnings)
log_info "=== Building Polkadot Pallets ==="
init_network_report "polkadot"
show_progress "Setting up WebAssembly target" 2
log_info "Compiling Substrate pallets..."
show_progress "Compiling pallets" 4
add_compiled_artifact "polkadot" "pallets_compiled" "pallet-todo"
add_network_warning "polkadot" "WASM runtime file not found in expected location"
log_success "Polkadot pallets compiled successfully"
show_progress "Building WASM runtime" 3
add_compiled_artifact "polkadot" "pallets_compiled" "runtime.wasm"
log_success "WASM runtime built successfully"
update_network_status "polkadot" "success"

# Generate final reports
log_info "Build process completed - generating reports..."
cleanup_logging

echo ""
echo "=== Demo Results ==="
echo "Check the generated files:"
echo "  - Log file: $LOG_FILE"
echo "  - JSON report: $REPORT_FILE"
echo ""

# Show a snippet of the log file
echo "Log file sample (last 10 lines):"
echo "=================================="
tail -10 "$LOG_FILE"

echo ""
echo "JSON report summary:"
echo "===================="
if command -v jq >/dev/null 2>&1; then
    echo "Networks built:"
    jq -r '.networks | keys[]' "$REPORT_FILE" | sed 's/^/  - /'
    echo ""
    echo "Build status:"
    jq -r '.networks | to_entries[] | "  \(.key): \(.value.status)"' "$REPORT_FILE"
    echo ""
    echo "Total duration: $(jq -r '.total_duration' "$REPORT_FILE")s"
    echo ""
    echo "Recommendations:"
    jq -r '.recommendations[]' "$REPORT_FILE" | sed 's/^/  - /'
else
    echo "Install 'jq' to see formatted JSON output"
    echo "Raw JSON report:"
    cat "$REPORT_FILE"
fi

echo ""
echo "Demo completed! The logging system provides:"
echo "  ✓ Structured logging with multiple levels"
echo "  ✓ Progress indicators for long operations"
echo "  ✓ Network-specific build tracking"
echo "  ✓ Comprehensive error and warning collection"
echo "  ✓ JSON and human-readable reports"
echo "  ✓ Automated recommendations based on results"

# Cleanup demo files
rm -f "$LOG_FILE" "$REPORT_FILE"
echo ""
echo "Demo files cleaned up."