#!/bin/bash

# Test script for blockchain tools installer
# This script tests the installation functions without actually installing anything

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Logging functions
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

# Test script existence and permissions
test_script_basics() {
    log_test "Testing script basics..."
    
    if [ -f "scripts/install-blockchain-tools.sh" ]; then
        log_pass "Installation script exists"
    else
        log_fail "Installation script not found"
        return 1
    fi
    
    if [ -x "scripts/install-blockchain-tools.sh" ]; then
        log_pass "Installation script is executable"
    else
        log_fail "Installation script is not executable"
        return 1
    fi
    
    if [ -f "scripts/install-blockchain-tools.bat" ]; then
        log_pass "Windows batch script exists"
    else
        log_fail "Windows batch script not found"
    fi
}

# Test help functionality
test_help() {
    log_test "Testing help functionality..."
    
    if ./scripts/install-blockchain-tools.sh --help >/dev/null 2>&1; then
        log_pass "Help command works"
    else
        log_fail "Help command failed"
    fi
}

# Test platform detection
test_platform_detection() {
    log_test "Testing platform detection..."
    
    # Test platform detection by running node tool (safe test)
    if ./scripts/install-blockchain-tools.sh --tool=node 2>&1 | grep -q "Platform:"; then
        log_pass "Platform detection works"
    else
        log_fail "Platform detection not working"
    fi
}

# Test tool validation
test_tool_validation() {
    log_test "Testing tool validation..."
    
    # Test invalid tool
    if ./scripts/install-blockchain-tools.sh --tool=invalid 2>&1 | grep -q "Unknown tool"; then
        log_pass "Invalid tool detection works"
    else
        log_fail "Invalid tool detection failed"
    fi
    
    # Test valid tools are recognized
    local valid_tools=("rust" "solana" "anchor" "substrate" "node")
    for tool in "${valid_tools[@]}"; do
        if ./scripts/install-blockchain-tools.sh --help | grep -q "$tool"; then
            log_pass "Tool '$tool' is documented"
        else
            log_fail "Tool '$tool' is not documented"
        fi
    done
}

# Test argument parsing
test_argument_parsing() {
    log_test "Testing argument parsing..."
    
    # Test that script requires arguments
    if ./scripts/install-blockchain-tools.sh 2>&1 | grep -q "No installation target specified"; then
        log_pass "Argument requirement works"
    else
        log_fail "Argument requirement failed"
    fi
}

# Test Node.js tool (safe to test as it just checks existing installation)
test_node_tool() {
    log_test "Testing Node.js tool..."
    
    if ./scripts/install-blockchain-tools.sh --tool=node >/dev/null 2>&1; then
        log_pass "Node.js tool execution works"
    else
        log_fail "Node.js tool execution failed"
    fi
}

# Main test execution
main() {
    echo "Starting blockchain tools installer tests..."
    echo ""
    
    test_script_basics
    test_help
    test_platform_detection
    test_tool_validation
    test_argument_parsing
    test_node_tool
    
    echo ""
    echo "Test Results:"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Run tests
main "$@"