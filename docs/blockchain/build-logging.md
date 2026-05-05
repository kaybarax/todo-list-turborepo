# Build Logging and Reporting System

This document describes the comprehensive build logging and reporting system implemented for blockchain contract compilation.

## Overview

The build logging system provides structured logging, progress indicators, and detailed build reports for blockchain development environments. It supports multiple log levels, network-specific reporting, and generates both human-readable and JSON reports.

## Features

### Structured Logging

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR
- **Colored Output**: Visual distinction between log levels
- **Timestamps**: Configurable timestamp inclusion
- **File Logging**: Persistent log files for debugging

### Progress Indicators

- **Progress Messages**: Visual feedback for long-running operations
- **Spinner Animation**: Animated progress indicators
- **Duration Tracking**: Automatic timing of operations

### Build Reporting

- **Network-Specific Reports**: Individual tracking for each blockchain network
- **Artifact Tracking**: Record of compiled contracts, programs, and pallets
- **Error and Warning Collection**: Comprehensive issue tracking
- **Performance Metrics**: Build duration and timing analysis

### Report Generation

- **JSON Reports**: Machine-readable build reports
- **Human-Readable Summaries**: Console-friendly build summaries
- **Recommendations**: Automated suggestions based on build results

## Usage

### Basic Integration

```bash
#!/bin/bash

# Source the logging system
source "scripts/build-logger.sh"

# Initialize logging
init_logging

# Use logging functions
log_info "Starting build process"
log_success "Build completed successfully"

# Generate final reports
cleanup_logging
```

### Network Reporting

```bash
# Initialize network report
init_network_report "polygon"

# Add compiled artifacts
add_compiled_artifact "polygon" "contracts_compiled" "MyContract"

# Add warnings or errors
add_network_warning "polygon" "Deprecated function used"
add_network_error "polygon" "Compilation failed"

# Update final status
update_network_status "polygon" "success"
```

### Progress Indicators

```bash
# Simple progress message
show_progress "Installing dependencies" 5

# Spinner for background processes
some_long_process &
show_spinner "Processing..." $!
```

## Configuration

### Environment Variables

| Variable            | Default             | Description                                  |
| ------------------- | ------------------- | -------------------------------------------- |
| `LOG_LEVEL`         | `INFO`              | Minimum log level (DEBUG, INFO, WARN, ERROR) |
| `LOG_FILE`          | `build.log`         | Path to log file                             |
| `REPORT_FILE`       | `build-report.json` | Path to JSON report file                     |
| `ENABLE_COLORS`     | `true`              | Enable colored console output                |
| `ENABLE_TIMESTAMPS` | `true`              | Include timestamps in log messages           |
| `ENABLE_PROGRESS`   | `true`              | Show progress indicators                     |

### Example Configuration

```bash
export LOG_LEVEL="DEBUG"
export LOG_FILE="logs/blockchain-build.log"
export REPORT_FILE="reports/build-report-$(date +%Y%m%d-%H%M%S).json"
export ENABLE_COLORS="true"
```

## Log Levels

### DEBUG

- Detailed debugging information
- Variable values and internal state
- Only shown when LOG_LEVEL=DEBUG

### INFO

- General information about build progress
- Status updates and milestones
- Default minimum log level

### WARN

- Non-critical issues that don't stop the build
- Deprecated features or configurations
- Performance warnings

### ERROR

- Critical failures that stop the build
- Missing dependencies or configuration errors
- Compilation failures

## Report Structure

### JSON Report Format

```json
{
  "timestamp": "2025-08-10T23:31:17Z",
  "start_time": "2025-08-10T23:31:14Z",
  "end_time": "2025-08-10T23:31:17Z",
  "total_duration": "180",
  "environment_check": "success",
  "networks": {
    "polygon": {
      "status": "success",
      "duration": "45",
      "contracts_compiled": ["TodoList", "UserRegistry"],
      "programs_built": [],
      "pallets_compiled": [],
      "errors": [],
      "warnings": ["Deprecated OpenZeppelin version"]
    },
    "solana": {
      "status": "failed",
      "duration": "30",
      "contracts_compiled": [],
      "programs_built": [],
      "pallets_compiled": [],
      "errors": ["Anchor CLI not found", "Rust version too old"],
      "warnings": []
    }
  },
  "recommendations": [
    "Install missing dependencies for solana using: ./scripts/install-blockchain-tools.sh --tool=solana",
    "Update solana development tools to latest compatible versions"
  ]
}
```

### Network Status Values

- **`pending`**: Build not started
- **`success`**: Build completed successfully
- **`failed`**: Build failed with errors
- **`skipped`**: Build skipped (directory not found, etc.)

## Integration with Build Scripts

### Enhanced build-contracts.sh

The main build script has been enhanced with comprehensive logging:

```bash
# Initialize logging at start
init_logging

# Network-specific reporting
init_network_report "polygon"
log_info "Building Polygon contracts..."

# Progress indicators for long operations
show_progress "Compiling contracts" 10

# Error handling with reporting
if ! compile_contracts; then
    add_network_error "polygon" "Contract compilation failed"
    update_network_status "polygon" "failed"
    return 1
fi

# Success reporting
add_compiled_artifact "polygon" "contracts_compiled" "TodoList"
update_network_status "polygon" "success"

# Generate final reports
cleanup_logging
```

## Troubleshooting

### Common Issues

1. **Permission Errors**

   ```bash
   # Ensure log directory is writable
   mkdir -p logs
   chmod 755 logs
   ```

2. **Missing Dependencies**

   ```bash
   # Check bash version (requires 4.0+)
   bash --version

   # Check date command availability
   which date
   ```

3. **Color Output Issues**
   ```bash
   # Disable colors if terminal doesn't support them
   export ENABLE_COLORS="false"
   ```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
export LOG_LEVEL="DEBUG"
./scripts/build-contracts.sh --network=polygon
```

## Performance Considerations

### Log File Management

- Log files can grow large during extensive builds
- Consider log rotation for production environments
- Use appropriate LOG_LEVEL to control verbosity

### Progress Indicators

- Disable progress indicators in CI/CD environments
- Set `ENABLE_PROGRESS="false"` for non-interactive builds

### Report Generation

- JSON reports are generated at build completion
- Large builds may produce substantial report files
- Consider archiving old reports

## Examples

### Basic Build with Logging

```bash
#!/bin/bash
source "scripts/build-logger.sh"

init_logging
log_info "Starting blockchain build process"

# Build each network
for network in polygon solana polkadot; do
    init_network_report "$network"
    log_info "Building $network contracts"

    if build_network "$network"; then
        update_network_status "$network" "success"
    else
        add_network_error "$network" "Build failed"
        update_network_status "$network" "failed"
    fi
done

cleanup_logging
```

### Custom Report Processing

```bash
#!/bin/bash

# Generate build report
./scripts/build-contracts.sh --network=all

# Process JSON report
if [ -f "build-report.json" ]; then
    # Extract failed networks
    failed_networks=$(jq -r '.networks | to_entries[] | select(.value.status == "failed") | .key' build-report.json)

    if [ -n "$failed_networks" ]; then
        echo "Failed networks: $failed_networks"
        # Send notification, update CI status, etc.
    fi
fi
```

## API Reference

### Logging Functions

- `log_debug(message)` - Log debug message
- `log_info(message)` - Log info message
- `log_warn(message)` - Log warning message
- `log_error(message)` - Log error message
- `log_success(message)` - Log success message with checkmark
- `log_failure(message)` - Log failure message with X mark

### Progress Functions

- `show_progress(message, duration)` - Show progress with dots
- `show_spinner(message, pid)` - Show spinner for background process

### Reporting Functions

- `init_network_report(network)` - Initialize network report
- `update_network_status(network, status)` - Update network status
- `add_compiled_artifact(network, type, name)` - Add compiled artifact
- `add_network_error(network, error)` - Add error to network report
- `add_network_warning(network, warning)` - Add warning to network report

### System Functions

- `init_logging()` - Initialize logging system
- `cleanup_logging()` - Generate reports and cleanup
- `generate_json_report()` - Generate JSON report
- `generate_summary_report()` - Generate human-readable summary

## Future Enhancements

### Planned Features

1. **Log Rotation**: Automatic log file rotation and archiving
2. **Remote Logging**: Send logs to external logging services
3. **Metrics Integration**: Integration with Prometheus/Grafana
4. **Slack/Discord Notifications**: Build status notifications
5. **Build Comparison**: Compare build performance over time
6. **Interactive Reports**: HTML reports with charts and graphs

### Contributing

When adding new logging features:

1. Maintain backward compatibility
2. Add appropriate tests
3. Update documentation
4. Consider performance impact
5. Follow existing naming conventions

## Related Documentation

- [Blockchain Development Setup](./setup.md)
- [Testing Guide](../testing/testing-strategy.md)
- [Troubleshooting](../support/troubleshooting.md)
- [Deployment Guide](../deployment/deployment-guide.md)
