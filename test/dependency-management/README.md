# Dependency Management Test Suite

This comprehensive test suite validates the blockchain development environment dependency management system, covering dependency detection, installation scripts, cross-platform compatibility, and error handling scenarios.

## Overview

The test suite is organized into four main categories:

- **Unit Tests**: Test individual dependency detection functions and version comparison logic
- **Integration Tests**: Test the complete installation and build process workflows
- **Cross-Platform Tests**: Validate compatibility across different operating systems and architectures
- **Error Handling Tests**: Test recovery scenarios and error handling mechanisms

## Test Structure

```text
test/dependency-management/
├── unit/                           # Unit tests
│   ├── dependency-detection.test.js   # Dependency detection functions
│   └── version-comparison.test.js     # Version parsing and comparison
├── integration/                    # Integration tests
│   ├── installation-scripts.test.js   # Installation script workflows
│   └── build-process.test.js          # Build process integration
├── cross-platform/                # Cross-platform compatibility
│   └── platform-detection.test.js     # Platform-specific behavior
├── error-handling/                 # Error handling and recovery
│   └── recovery-scenarios.test.js     # Error recovery scenarios
├── fixtures/                      # Test fixtures and mock data
├── tmp/                          # Temporary test files (auto-created)
├── coverage/                     # Coverage reports (auto-generated)
├── results/                      # Test results (auto-generated)
├── jest.config.js               # Jest configuration
├── setup.js                    # Global test setup
├── run-tests.sh                 # Test runner script
└── README.md                    # This file
```

## Running Tests

### Prerequisites

- Node.js 20+
- Jest testing framework
- Bash shell (for script testing)
- Access to the blockchain dependency scripts

### Quick Start

```bash
# Run all tests
./test/dependency-management/run-tests.sh

# Run specific test categories
./test/dependency-management/run-tests.sh --unit
./test/dependency-management/run-tests.sh --integration
./test/dependency-management/run-tests.sh --cross-platform
./test/dependency-management/run-tests.sh --error-handling

# Run with coverage report
./test/dependency-management/run-tests.sh --coverage

# Run with verbose output
./test/dependency-management/run-tests.sh --verbose

# Stop on first failure
./test/dependency-management/run-tests.sh --bail
```

### Using Jest Directly

```bash
# Run all dependency management tests
npx jest --config=test/dependency-management/jest.config.js

# Run specific test file
npx jest test/dependency-management/unit/dependency-detection.test.js

# Run with coverage
npx jest --config=test/dependency-management/jest.config.js --coverage
```

## Test Categories

### Unit Tests

**Purpose**: Test individual functions and components in isolation

**Coverage**:

- Node.js version detection and validation
- Rust toolchain detection (rustc, cargo)
- Solana CLI version checking
- Anchor CLI detection and version parsing
- Version comparison logic (semantic versioning)
- Network-specific dependency filtering
- Platform detection functions
- Error code handling

**Key Test Cases**:

- Valid tool detection with correct versions
- Missing tool detection and error reporting
- Version comparison edge cases (equal, older, newer)
- Invalid version string handling
- Command execution failures
- Verbose mode output validation

### Integration Tests

**Purpose**: Test complete workflows and script interactions

**Coverage**:

- End-to-end installation script execution
- Build process dependency integration
- Automatic dependency installation workflows
- Script parameter validation and help systems
- Network connectivity handling
- Installation validation and verification
- Build artifact validation

**Key Test Cases**:

- Complete Rust installation simulation
- Solana CLI installation with configuration
- Anchor CLI installation with prerequisites
- Build process with dependency checking
- Auto-install failure recovery
- Cross-script communication and data flow

### Cross-Platform Tests

**Purpose**: Validate compatibility across different operating systems

**Coverage**:

- Platform detection (macOS, Linux, Windows/WSL)
- Architecture detection (x86_64, ARM64)
- Package manager integration (Homebrew, apt, yum, pacman)
- Path handling and environment variables
- Shell compatibility (bash, zsh, sh)
- File system operations and permissions

**Key Test Cases**:

- macOS-specific Homebrew usage
- Linux package manager detection
- Windows/WSL environment handling
- Path separator handling
- Shell profile updates
- Permission handling across platforms

### Error Handling Tests

**Purpose**: Test error scenarios and recovery mechanisms

**Coverage**:

- Network failure recovery with retry logic
- Permission error detection and guidance
- Version conflict resolution
- Dependency chain failure handling
- Build process error recovery
- Timeout handling for long operations
- Corrupted installation detection

**Key Test Cases**:

- Network connectivity failures with exponential backoff
- Permission denied scenarios with alternative solutions
- Missing prerequisite tools with installation guidance
- Build failures with specific error context
- Validation timeouts with appropriate error messages
- Cleanup and recovery after failures

## Test Environment

### Environment Variables

The test suite uses several environment variables to control behavior:

- `NODE_ENV=test`: Indicates test environment
- `CI=true`: Disables interactive features
- `SKIP_NETWORK_CHECK=true`: Skips network connectivity tests
- `ORIGINAL_PATH`: Preserves original PATH for restoration

### Mock System

The test suite includes a comprehensive mocking system:

- **Command Mocking**: Create mock executables with controlled behavior
- **Version Mocking**: Simulate different tool versions
- **Failure Simulation**: Test error conditions and edge cases
- **Platform Simulation**: Test cross-platform behavior

### Test Fixtures

Test fixtures provide reusable test data:

- Mock command scripts with various behaviors
- Sample configuration files
- Test directory structures
- Error scenario simulations

## Coverage Requirements

The test suite aims for comprehensive coverage:

- **Function Coverage**: All dependency detection functions
- **Branch Coverage**: All conditional logic paths
- **Error Path Coverage**: All error handling scenarios
- **Platform Coverage**: Major operating systems and architectures

### Coverage Targets

- Unit Tests: 95%+ line coverage
- Integration Tests: 85%+ workflow coverage
- Cross-Platform Tests: All supported platforms
- Error Handling Tests: All error scenarios

## Continuous Integration

The test suite is designed for CI/CD integration:

- **Fast Execution**: Optimized for quick feedback
- **Parallel Execution**: Tests can run in parallel
- **Deterministic Results**: Consistent across environments
- **Comprehensive Reporting**: Detailed results and coverage

### CI Configuration

```yaml
# Example GitHub Actions configuration
- name: Run Dependency Management Tests
  run: |
    ./test/dependency-management/run-tests.sh --coverage --bail

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v3
  with:
    file: ./test/dependency-management/coverage/lcov.info
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure test runner has appropriate permissions
2. **Path Issues**: Verify scripts are executable and in correct locations
3. **Mock Failures**: Check that mock commands are properly created
4. **Environment Conflicts**: Ensure clean test environment setup

### Debug Mode

Enable verbose output for debugging:

```bash
./test/dependency-management/run-tests.sh --verbose
```

### Manual Test Execution

For debugging specific scenarios:

```bash
# Test specific function
node -e "
const { executeScript } = require('./test/dependency-management/setup.js');
const result = executeScript('scripts/blockchain-deps-check.sh', ['--verbose']);
console.log(result);
"
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include both positive and negative test cases
3. Add appropriate mocking for external dependencies
4. Update this README with new test descriptions
5. Ensure tests are deterministic and can run in any order

### Test Naming Convention

- Test files: `*.test.js`
- Test descriptions: Use descriptive names that explain the scenario
- Test groups: Organize related tests using `describe()` blocks
- Mock files: Prefix with `mock-` for clarity

## Requirements Traceability

This test suite validates the following requirements from the specification:

- **Requirement 3.1**: Resilient build scripts with automatic installation
- **Requirement 3.2**: Error handling and retry mechanisms
- **Requirement 3.3**: Cross-platform compatibility testing

Each test case includes comments linking back to specific requirements to ensure complete coverage of the specification.
