#!/bin/bash

# Test script for the build logging and reporting system

set -euo pipefail

# Source the logging system
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
    source "$SCRIPT_DIR/build-logger.sh"

# Test configuration
export LOG_LEVEL="DEBUG"
export LOG_FILE="test-build.log"
export REPORT_FILE="test-build-report.json"

echo "Testing Build Logging and Reporting System"
echo "=========================================="

# Initialize logging
init_logging

# Test different log levels
log_debug "This is a debug message"
log_info "This is an info message"
log_warn "This is a warning message"
log_error "This is an error message"
log_success "This is a success message"
log_failure "This is a failure message"

# Test progress indicators
show_progress "Testing progress indicator" 3

# Test network reporting
init_network_report "test-network"
add_compiled_artifact "test-network" "contracts_compiled" "TestContract"
add_compiled_artifact "test-network" "contracts_compiled" "AnotherContract"
add_network_warning "test-network" "This is a test warning"
update_network_status "test-network" "success"

# Test another network with failure
init_network_report "failing-network"
add_network_error "failing-network" "Compilation failed"
add_network_error "failing-network" "Dependencies missing"
update_network_status "failing-network" "failed"

# Test environment check
# shellcheck disable=SC2034
BUILD_REPORT_ENVIRONMENT_CHECK="success"

# Generate reports
cleanup_logging

echo ""
echo "Test completed! Check the following files:"
echo "  - Log file: $LOG_FILE"
echo "  - Report file: $REPORT_FILE"
echo ""
echo "Log file contents:"
echo "=================="
cat "$LOG_FILE"
echo ""
echo "Report file contents:"
echo "===================="
cat "$REPORT_FILE"

# Cleanup test files
rm -f "$LOG_FILE" "$REPORT_FILE"

echo ""
echo "Test files cleaned up. Logging system test completed successfully!"