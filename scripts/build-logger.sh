#!/bin/bash

# Build Logging and Reporting System
# Provides structured logging, progress indicators, and build reports
# for blockchain development environment

# Global logging configuration
LOG_LEVEL="${LOG_LEVEL:-INFO}"
LOG_FILE="${LOG_FILE:-build.log}"
REPORT_FILE="${REPORT_FILE:-build-report.json}"
ENABLE_COLORS="${ENABLE_COLORS:-true}"
ENABLE_TIMESTAMPS="${ENABLE_TIMESTAMPS:-true}"
ENABLE_PROGRESS="${ENABLE_PROGRESS:-true}"

# Color codes for output formatting
if [[ "$ENABLE_COLORS" == "true" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    # shellcheck disable=SC2034
YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    # shellcheck disable=SC2034
    PURPLE=''
    CYAN=''
    # shellcheck disable=SC2034
    WHITE=''
    NC=''
fi

# Log level constants
LOG_LEVEL_DEBUG=0
LOG_LEVEL_INFO=1
LOG_LEVEL_WARN=2
LOG_LEVEL_ERROR=3

# Convert log level string to number
get_log_level_num() {
    local level
    level=$(echo "$1" | tr '[:lower:]' '[:upper:]')
    case "$level" in
        "DEBUG") echo $LOG_LEVEL_DEBUG ;;
        "INFO")  echo $LOG_LEVEL_INFO ;;
        "WARN")  echo $LOG_LEVEL_WARN ;;
        "ERROR") echo $LOG_LEVEL_ERROR ;;
        *) echo $LOG_LEVEL_INFO ;;
    esac
}

# Get current timestamp
get_timestamp() {
    if [[ "$ENABLE_TIMESTAMPS" == "true" ]]; then
        date '+%Y-%m-%d %H:%M:%S'
    else
        echo ""
    fi
}

# Format log message
format_log_message() {
    local level
    level="$1"
    local message
    message="$2"
    local timestamp
    timestamp=$(get_timestamp)
    
    if [[ -n "$timestamp" ]]; then
        echo "[$timestamp] [$level] $message"
    else
        echo "[$level] $message"
    fi
}

# Core logging function
log_message() {
    local level
    level="$1"
    local message
    message="$2"
    local color
    color="$3"
    local current_level_num
    local target_level_num
    
    current_level_num=$(get_log_level_num "$LOG_LEVEL")
    target_level_num=$(get_log_level_num "$level")
    
    # Only log if message level is >= current log level
    if [[ $target_level_num -ge $current_level_num ]]; then
        local formatted_message
        formatted_message=$(format_log_message "$level" "$message")
        
        # Output to console with color
        echo -e "${color}${formatted_message}${NC}"
        
        # Output to log file without color
        echo "$formatted_message" >> "$LOG_FILE"
    fi
}

# Specific logging functions
log_debug() {
    log_message "DEBUG" "$1" "$CYAN"
}

log_info() {
    log_message "INFO" "$1" "$BLUE"
}

log_warn() {
    log_message "WARN" "$1" "$YELLOW"
}

log_error() {
    log_message "ERROR" "$1" "$RED"
}

log_success() {
    log_message "INFO" "✓ $1" "$GREEN"
}

log_failure() {
    log_message "ERROR" "✗ $1" "$RED"
}

# Progress indicator functions
show_progress() {
    if [[ "$ENABLE_PROGRESS" != "true" ]]; then
        return
    fi
    
    local message
    message="$1"
    local duration
    duration="${2:-0}"
    
    echo -ne "${BLUE}[PROGRESS]${NC} $message"
    
    if [[ $duration -gt 0 ]]; then
        for ((i=1; i<=duration; i++)); do
            echo -ne "."
            sleep 1
        done
    fi
    
    echo ""
}

show_spinner() {
    if [[ "$ENABLE_PROGRESS" != "true" ]]; then
        return
    fi
    
    local message
    message="$1"
    local pid
    pid="$2"
    local spin
    spin='-\|/'
    local i
    i=0
    
    echo -ne "${BLUE}[PROGRESS]${NC} $message "
    
    while kill -0 "$pid" 2>/dev/null; do
        i=$(( (i+1) %4 ))
        # shellcheck disable=SC2059
        printf "\r${BLUE}[PROGRESS]${NC} $message ${spin:$i:1}"
        sleep 0.1
    done
    
    # shellcheck disable=SC2059
    printf "\r${BLUE}[PROGRESS]${NC} $message ✓\n"
}

# Build report data structure (using simple variables for compatibility)
BUILD_REPORT_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_REPORT_ENVIRONMENT_CHECK="pending"
BUILD_REPORT_TOTAL_DURATION="0"

# Network-specific report data (using simple variables)
# Format: NETWORK_REPORT_<network>_<field>

# Initialize network report
init_network_report() {
    local network
    network="$1"
    local network_upper
    network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    
    eval "NETWORK_REPORT_${network_upper}_STATUS=pending"
    eval "NETWORK_REPORT_${network_upper}_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    eval "NETWORK_REPORT_${network_upper}_CONTRACTS_COMPILED=''"
    eval "NETWORK_REPORT_${network_upper}_PROGRAMS_BUILT=''"
    eval "NETWORK_REPORT_${network_upper}_PALLETS_COMPILED=''"
    eval "NETWORK_REPORT_${network_upper}_ERRORS=''"
    eval "NETWORK_REPORT_${network_upper}_WARNINGS=''"
    eval "NETWORK_REPORT_${network_upper}_DURATION=0"
}

# Update network report status
update_network_status() {
    local network
    network="$1"
    local status
    status="$2"
    local network_upper
    network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    local end_time
    local start_time
    local duration
    
    eval "NETWORK_REPORT_${network_upper}_STATUS='$status'"
    end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    eval "start_time=\$NETWORK_REPORT_${network_upper}_START_TIME"
    
    # Calculate duration (simplified - in seconds)
    if command -v date >/dev/null 2>&1; then
        local start_epoch end_epoch
        start_epoch=$(date -d "$start_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$start_time" +%s 2>/dev/null || echo "0")
        end_epoch=$(date -d "$end_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$end_time" +%s 2>/dev/null || echo "0")
        duration=$((end_epoch - start_epoch))
    else
        duration=0
    fi
    
    eval "NETWORK_REPORT_${network_upper}_DURATION='$duration'"
    eval "NETWORK_REPORT_${network_upper}_END_TIME='$end_time'"
}

# Add compiled artifact to report
add_compiled_artifact() {
    local network
    network="$1"
    local artifact_type
    artifact_type="$2"  # contracts_compiled, programs_built, pallets_compiled
    local artifact_name
    artifact_name="$3"
    local network_upper
    network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    local artifact_type_upper
    artifact_type_upper=$(echo "$artifact_type" | tr '[:lower:]' '[:upper:]')
    
    local current_artifacts
    eval "current_artifacts=\$NETWORK_REPORT_${network_upper}_${artifact_type_upper}"
    
    if [[ -n "$current_artifacts" ]]; then
        eval "NETWORK_REPORT_${network_upper}_${artifact_type_upper}='$current_artifacts,$artifact_name'"
    else
        eval "NETWORK_REPORT_${network_upper}_${artifact_type_upper}='$artifact_name'"
    fi
}

# Add error to report
add_network_error() {
    local network
    network="$1"
    local error_message
    error_message="$2"
    local network_upper
    network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    
    local current_errors
    eval "current_errors=\$NETWORK_REPORT_${network_upper}_ERRORS"
    
    if [[ -n "$current_errors" ]]; then
        eval "NETWORK_REPORT_${network_upper}_ERRORS='$current_errors|$error_message'"
    else
        eval "NETWORK_REPORT_${network_upper}_ERRORS='$error_message'"
    fi
}

# Add warning to report
add_network_warning() {
    local network
    network="$1"
    local warning_message
    warning_message="$2"
    local network_upper
    network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    
    local current_warnings
    eval "current_warnings=\$NETWORK_REPORT_${network_upper}_WARNINGS"
    
    if [[ -n "$current_warnings" ]]; then
        eval "NETWORK_REPORT_${network_upper}_WARNINGS='$current_warnings|$warning_message'"
    else
        eval "NETWORK_REPORT_${network_upper}_WARNINGS='$warning_message'"
    fi
}

# Generate recommendations based on build results
generate_recommendations() {
    local recommendations
    recommendations=()
    
    # Check for common issues and provide recommendations
    for network in polygon solana polkadot moonbeam base; do
        local network_upper
        network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        local status errors
        eval "status=\$NETWORK_REPORT_${network_upper}_STATUS"
        eval "errors=\$NETWORK_REPORT_${network_upper}_ERRORS"
        
        if [[ "$status" == "failed" ]]; then
            if [[ "$errors" == *"dependency"* ]]; then
                recommendations+=("Install missing dependencies for $network using: ./scripts/install-blockchain-tools.sh --tool=$network")
            fi
            
            if [[ "$errors" == *"version"* ]]; then
                recommendations+=("Update $network development tools to latest compatible versions")
            fi
            
            if [[ "$errors" == *"compilation"* ]]; then
                recommendations+=("Review $network contract/program code for syntax errors and compatibility issues")
            fi
            
            if [[ "$errors" == *"test"* ]]; then
                recommendations+=("Fix $network test failures before deployment")
            fi
        fi
        
        if [[ "$status" == "success" ]]; then
            local duration
            eval "duration=\$NETWORK_REPORT_${network_upper}_DURATION"
            if [[ $duration -gt 300 ]]; then  # 5 minutes
                recommendations+=("Consider optimizing $network build process - current duration: ${duration}s")
            fi
        fi
    done
    
    # General recommendations
    if [[ "$BUILD_REPORT_ENVIRONMENT_CHECK" == "failed" ]]; then
        recommendations+=("Run dependency check: ./scripts/blockchain-deps-check.sh --verbose")
    fi
    
    # Performance recommendations
    if [[ $BUILD_REPORT_TOTAL_DURATION -gt 600 ]]; then  # 10 minutes
        recommendations+=("Consider parallel builds or incremental compilation to reduce build time")
    fi
    
    # Convert array to comma-separated string
    local IFS
    IFS=','
    echo "${recommendations[*]}"
}

# Generate JSON build report
generate_json_report() {
    local end_time
    local start_time
    local total_duration
    local recommendations
    
    end_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    start_time="$BUILD_REPORT_START_TIME"
    recommendations=$(generate_recommendations)
    
    # Calculate total duration
    if command -v date >/dev/null 2>&1; then
        local start_epoch end_epoch
        start_epoch=$(date -d "$start_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$start_time" +%s 2>/dev/null || echo "0")
        end_epoch=$(date -d "$end_time" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%SZ" "$end_time" +%s 2>/dev/null || echo "0")
        total_duration=$((end_epoch - start_epoch))
    else
        total_duration=0
    fi
    
    BUILD_REPORT_TOTAL_DURATION="$total_duration"
    # shellcheck disable=SC2034
    BUILD_REPORT_END_TIME="$end_time"
    
    # Generate JSON report
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$end_time",
  "start_time": "$start_time",
  "end_time": "$end_time",
  "total_duration": "$total_duration",
  "environment_check": "$BUILD_REPORT_ENVIRONMENT_CHECK",
  "networks": {
EOF

    # Add network reports
    local first_network
    first_network=true
    for network in polygon solana polkadot moonbeam base; do
        local network_upper
        network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        local status contracts_compiled programs_built pallets_compiled errors warnings duration
        
        eval "status=\$NETWORK_REPORT_${network_upper}_STATUS"
        if [[ -n "$status" && "$status" != "pending" ]]; then
            if [[ "$first_network" == false ]]; then
                echo "," >> "$REPORT_FILE"
            fi
            first_network=false
            
            eval "contracts_compiled=\$NETWORK_REPORT_${network_upper}_CONTRACTS_COMPILED"
            eval "programs_built=\$NETWORK_REPORT_${network_upper}_PROGRAMS_BUILT"
            eval "pallets_compiled=\$NETWORK_REPORT_${network_upper}_PALLETS_COMPILED"
            eval "errors=\$NETWORK_REPORT_${network_upper}_ERRORS"
            eval "warnings=\$NETWORK_REPORT_${network_upper}_WARNINGS"
            eval "duration=\$NETWORK_REPORT_${network_upper}_DURATION"
            
            # Convert comma-separated strings to JSON arrays
            local contracts_json
            contracts_json="[]"
            local programs_json
            programs_json="[]"
            local pallets_json
            pallets_json="[]"
            local errors_json
            errors_json="[]"
            local warnings_json
            warnings_json="[]"
            
            if [[ -n "$contracts_compiled" ]]; then
                # shellcheck disable=SC2001
                contracts_json="[\"$(echo "$contracts_compiled" | sed 's/,/","/g')\"]"
            fi
            
            if [[ -n "$programs_built" ]]; then
                # shellcheck disable=SC2001
                programs_json="[\"$(echo "$programs_built" | sed 's/,/","/g')\"]"
            fi
            
            if [[ -n "$pallets_compiled" ]]; then
                # shellcheck disable=SC2001
                pallets_json="[\"$(echo "$pallets_compiled" | sed 's/,/","/g')\"]"
            fi
            
            if [[ -n "$errors" ]]; then
                # shellcheck disable=SC2001
                errors_json="[\"$(echo "$errors" | sed 's/|/","/g')\"]"
            fi
            
            if [[ -n "$warnings" ]]; then
                # shellcheck disable=SC2001
                warnings_json="[\"$(echo "$warnings" | sed 's/|/","/g')\"]"
            fi
            
            cat >> "$REPORT_FILE" << EOF
    "$network": {
      "status": "$status",
      "duration": "$duration",
      "contracts_compiled": $contracts_json,
      "programs_built": $programs_json,
      "pallets_compiled": $pallets_json,
      "errors": $errors_json,
      "warnings": $warnings_json
    }
EOF
        fi
    done
    
    # Add recommendations
    local recommendations_json
    recommendations_json="[]"
    if [[ -n "$recommendations" ]]; then
        # shellcheck disable=SC2001
        recommendations_json="[\"$(echo "$recommendations" | sed 's/,/","/g')\"]"
    fi
    
    cat >> "$REPORT_FILE" << EOF
  },
  "recommendations": $recommendations_json
}
EOF
}

# Generate human-readable summary report
generate_summary_report() {
    local total_duration
    total_duration="$BUILD_REPORT_TOTAL_DURATION"
    local environment_check
    environment_check="$BUILD_REPORT_ENVIRONMENT_CHECK"
    
    echo ""
    echo "=== BUILD SUMMARY REPORT ==="
    echo "Build completed at: $(date)"
    echo "Total duration: ${total_duration}s"
    echo "Environment check: $environment_check"
    echo ""
    
    # Network status summary
    echo "Network Build Status:"
    local success_count
    success_count=0
    local failed_count
    failed_count=0
    local skipped_count
    skipped_count=0
    
    for network in polygon solana polkadot moonbeam base; do
        local network_upper
        network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        local status duration
        eval "status=\$NETWORK_REPORT_${network_upper}_STATUS"
        eval "duration=\$NETWORK_REPORT_${network_upper}_DURATION"
        
        if [[ -n "$status" && "$status" != "pending" ]]; then
            case "$status" in
                "success")
                    echo -e "  ${GREEN}✓${NC} $network (${duration}s)"
                    ((success_count++))
                    ;;
                "failed")
                    echo -e "  ${RED}✗${NC} $network (${duration}s)"
                    ((failed_count++))
                    ;;
                "skipped")
                    echo -e "  ${YELLOW}⊝${NC} $network (skipped)"
                    ((skipped_count++))
                    ;;
            esac
        fi
    done
    
    echo ""
    echo "Summary: $success_count successful, $failed_count failed, $skipped_count skipped"
    
    # Show errors if any
    if [[ $failed_count -gt 0 ]]; then
        echo ""
        echo "Build Errors:"
        for network in polygon solana polkadot moonbeam base; do
            local network_upper
            network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
            local status errors
            eval "status=\$NETWORK_REPORT_${network_upper}_STATUS"
            eval "errors=\$NETWORK_REPORT_${network_upper}_ERRORS"
            
            if [[ "$status" == "failed" && -n "$errors" ]]; then
                echo "  $network:"
                echo "$errors" | tr '|' '\n' | sed 's/^/    - /'
            fi
        done
    fi
    
    # Show warnings if any
    local has_warnings
    has_warnings=false
    for network in polygon solana polkadot moonbeam base; do
        local network_upper
        network_upper=$(echo "$network" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
        local warnings
        eval "warnings=\$NETWORK_REPORT_${network_upper}_WARNINGS"
        if [[ -n "$warnings" ]]; then
            if [[ "$has_warnings" == false ]]; then
                echo ""
                echo "Build Warnings:"
                has_warnings=true
            fi
            echo "  $network:"
            echo "$warnings" | tr '|' '\n' | sed 's/^/    - /'
        fi
    done
    
    # Show recommendations
    local recommendations
    recommendations=$(generate_recommendations)
    if [[ -n "$recommendations" ]]; then
        echo ""
        echo "Recommendations:"
        echo "$recommendations" | tr ',' '\n' | sed 's/^/  - /'
    fi
    
    echo ""
    echo "Detailed report saved to: $REPORT_FILE"
    echo "Build log saved to: $LOG_FILE"
    echo ""
}

# Initialize logging system
init_logging() {
    # Create log directory if it doesn't exist
    local log_dir
    log_dir=$(dirname "$LOG_FILE")
    if [[ "$log_dir" != "." ]]; then
        mkdir -p "$log_dir"
    fi
    
    # Initialize log file
    echo "=== Build Log Started at $(date) ===" > "$LOG_FILE"
    
    log_info "Logging system initialized"
    log_info "Log level: $LOG_LEVEL"
    log_info "Log file: $LOG_FILE"
    log_info "Report file: $REPORT_FILE"
}

# Cleanup logging system
cleanup_logging() {
    log_info "Build process completed"
    echo "=== Build Log Ended at $(date) ===" >> "$LOG_FILE"
    
    # Generate final reports
    generate_json_report
    generate_summary_report
}

# Export functions for use in other scripts
export -f log_debug log_info log_warn log_error log_success log_failure
export -f show_progress show_spinner
export -f init_network_report update_network_status add_compiled_artifact
export -f add_network_error add_network_warning
export -f init_logging cleanup_logging
export -f generate_json_report generate_summary_report

# If script is run directly, show usage
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Build Logger and Reporting System"
    echo "This script provides logging functions for blockchain build processes."
    echo ""
    echo "Usage: source $0"
    echo ""
    echo "Available functions:"
    echo "  log_debug, log_info, log_warn, log_error, log_success, log_failure"
    echo "  show_progress, show_spinner"
    echo "  init_network_report, update_network_status, add_compiled_artifact"
    echo "  add_network_error, add_network_warning"
    echo "  init_logging, cleanup_logging"
    echo "  generate_json_report, generate_summary_report"
    echo ""
    echo "Environment variables:"
    echo "  LOG_LEVEL (DEBUG|INFO|WARN|ERROR) - default: INFO"
    echo "  LOG_FILE - default: build.log"
    echo "  REPORT_FILE - default: build-report.json"
    echo "  ENABLE_COLORS (true|false) - default: true"
    echo "  ENABLE_TIMESTAMPS (true|false) - default: true"
    echo "  ENABLE_PROGRESS (true|false) - default: true"
fi