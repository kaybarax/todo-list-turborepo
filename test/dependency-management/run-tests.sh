#!/bin/bash

# Test runner for dependency management test suite
# Runs all test categories with proper setup and reporting

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$TEST_DIR/../.." && pwd)"
COVERAGE_DIR="$TEST_DIR/coverage"
RESULTS_DIR="$TEST_DIR/results"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Usage information
usage() {
    cat << EOF
Dependency Management Test Suite Runner

USAGE:
  $0 [OPTIONS]

OPTIONS:
  --unit                Run only unit tests
  --integration         Run only integration tests
  --cross-platform      Run only cross-platform tests
  --error-handling      Run only error handling tests
  --coverage            Generate coverage report
  --verbose             Enable verbose output
  --bail                Stop on first test failure
  --help, -h            Show this help message

EXAMPLES:
  $0                    # Run all tests
  $0 --unit --coverage  # Run unit tests with coverage
  $0 --integration      # Run only integration tests
  $0 --verbose --bail   # Verbose output, stop on failure

EOF
}

# Initialize test environment
init_test_environment() {
    log_info "Initializing test environment..."
    
    # Create necessary directories
    mkdir -p "$COVERAGE_DIR" "$RESULTS_DIR"
    
    # Set environment variables for testing
    export NODE_ENV=test
    export CI=true
    export SKIP_NETWORK_CHECK=true
    export ORIGINAL_PATH="$PATH"
    
    # Change to root directory for script execution
    cd "$ROOT_DIR"
    
    log_success "Test environment initialized"
}

# Run specific test category
run_test_category() {
    local category="$1"
    local description="$2"
    
    log_info "Running $description tests..."
    
    local test_pattern="$TEST_DIR/$category/**/*.test.js"
    local results_file="$RESULTS_DIR/${category}-results.json"
    
    if npx jest --config="$TEST_DIR/jest.config.js" \
        --testPathPattern="$category" \
        --json --outputFile="$results_file" \
        ${VERBOSE:+--verbose} \
        ${BAIL:+--bail} \
        ${COVERAGE:+--coverage --coverageDirectory="$COVERAGE_DIR/$category"}; then
        log_success "$description tests passed"
        return 0
    else
        log_error "$description tests failed"
        return 1
    fi
}

# Generate combined coverage report
generate_coverage_report() {
    log_info "Generating combined coverage report..."
    
    if [ -d "$COVERAGE_DIR" ]; then
        # Combine coverage from all test categories
        npx nyc merge "$COVERAGE_DIR" "$COVERAGE_DIR/combined-coverage.json"
        npx nyc report --reporter=html --reporter=text --reporter=lcov \
            --report-dir="$COVERAGE_DIR/combined" \
            --temp-dir="$COVERAGE_DIR"
        
        log_success "Coverage report generated at $COVERAGE_DIR/combined/index.html"
    else
        log_warning "No coverage data found"
    fi
}

# Generate test summary report
generate_test_summary() {
    log_info "Generating test summary..."
    
    local summary_file="$RESULTS_DIR/test-summary.json"
    local total_tests=0
    local passed_tests=0
    local failed_tests=0
    local categories=()
    
    # Process results from each category
    for results_file in "$RESULTS_DIR"/*-results.json; do
        if [ -f "$results_file" ]; then
            local category=$(basename "$results_file" -results.json)
            categories+=("$category")
            
            # Extract test counts (simplified - would need proper JSON parsing in real implementation)
            local category_total=$(grep -o '"numTotalTests":[0-9]*' "$results_file" | cut -d: -f2 || echo "0")
            local category_passed=$(grep -o '"numPassedTests":[0-9]*' "$results_file" | cut -d: -f2 || echo "0")
            local category_failed=$(grep -o '"numFailedTests":[0-9]*' "$results_file" | cut -d: -f2 || echo "0")
            
            total_tests=$((total_tests + category_total))
            passed_tests=$((passed_tests + category_passed))
            failed_tests=$((failed_tests + category_failed))
            
            log_info "$category: $category_passed/$category_total tests passed"
        fi
    done
    
    # Create summary
    cat > "$summary_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "categories": [$(printf '"%s",' "${categories[@]}" | sed 's/,$//')],
  "totals": {
    "tests": $total_tests,
    "passed": $passed_tests,
    "failed": $failed_tests,
    "success_rate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")
  }
}
EOF
    
    log_success "Test summary generated at $summary_file"
    
    # Display summary
    echo ""
    echo "=== Test Summary ==="
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $failed_tests"
    if [ $total_tests -gt 0 ]; then
        local success_rate=$(echo "scale=1; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")
        echo "Success Rate: ${success_rate}%"
    fi
    echo ""
}

# Cleanup test environment
cleanup_test_environment() {
    log_info "Cleaning up test environment..."
    
    # Restore original PATH
    export PATH="$ORIGINAL_PATH"
    
    # Remove temporary test files
    if [ -d "$TEST_DIR/tmp" ]; then
        rm -rf "$TEST_DIR/tmp"
    fi
    
    log_success "Test environment cleaned up"
}

# Main execution
main() {
    local run_unit=false
    local run_integration=false
    local run_cross_platform=false
    local run_error_handling=false
    local run_all=true
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit)
                run_unit=true
                run_all=false
                shift
                ;;
            --integration)
                run_integration=true
                run_all=false
                shift
                ;;
            --cross-platform)
                run_cross_platform=true
                run_all=false
                shift
                ;;
            --error-handling)
                run_error_handling=true
                run_all=false
                shift
                ;;
            --coverage)
                COVERAGE=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --bail)
                BAIL=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Initialize test environment
    init_test_environment
    
    local exit_code=0
    
    # Run selected test categories
    if [ "$run_all" = true ] || [ "$run_unit" = true ]; then
        if ! run_test_category "unit" "Unit"; then
            exit_code=1
        fi
    fi
    
    if [ "$run_all" = true ] || [ "$run_integration" = true ]; then
        if ! run_test_category "integration" "Integration"; then
            exit_code=1
        fi
    fi
    
    if [ "$run_all" = true ] || [ "$run_cross_platform" = true ]; then
        if ! run_test_category "cross-platform" "Cross-Platform"; then
            exit_code=1
        fi
    fi
    
    if [ "$run_all" = true ] || [ "$run_error_handling" = true ]; then
        if ! run_test_category "error-handling" "Error Handling"; then
            exit_code=1
        fi
    fi
    
    # Generate reports
    if [ "$COVERAGE" = true ]; then
        generate_coverage_report
    fi
    
    generate_test_summary
    
    # Cleanup
    cleanup_test_environment
    
    # Final status
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully!"
    else
        log_error "Some tests failed. Check the results for details."
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"