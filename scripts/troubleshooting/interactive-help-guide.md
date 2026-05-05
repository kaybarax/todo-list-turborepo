# Interactive Help and Guidance System

This document provides comprehensive information about the interactive help and guidance system implemented for blockchain development environment setup.

## Overview

The interactive help system provides:

- Command-line help options for all blockchain development scripts
- Interactive troubleshooting prompts with step-by-step guidance
- Environment diagnosis with actionable recommendations
- Verbose mode for detailed debugging information

## Components

### 1. Interactive Help System (`scripts/interactive-help.sh`)

Core library providing:

- Interactive prompts and user input handling
- Environment diagnosis functions
- Troubleshooting workflows
- Comprehensive help formatting

### 2. Enhanced Scripts

All blockchain development scripts now include:

- `--help` / `-h` options with comprehensive documentation
- `--verbose` mode for detailed debugging output
- `--interactive` mode for step-by-step guidance
- `--diagnose` mode for environment analysis

### 3. Unified Help System (`scripts/blockchain-help.sh`)

Central help system providing:

- Unified access to all script help
- Quick start guide for new developers
- Common usage examples
- Interactive troubleshooting entry point

## Usage Examples

### Getting Help

```bash
# Show help for specific script
./scripts/blockchain-deps-check.sh --help
./scripts/install-blockchain-tools.sh --help
./scripts/build-contracts.sh --help

# Unified help system
./scripts/blockchain-help.sh help deps-check
./scripts/blockchain-help.sh quick-start
./scripts/blockchain-help.sh examples
```

### Interactive Troubleshooting

```bash
# Interactive dependency troubleshooting
./scripts/blockchain-deps-check.sh --interactive

# Interactive build troubleshooting
./scripts/build-contracts.sh --interactive

# General troubleshooting
./scripts/blockchain-help.sh troubleshoot
```

### Environment Diagnosis

```bash
# Comprehensive environment diagnosis
./scripts/blockchain-deps-check.sh --diagnose
./scripts/build-contracts.sh --diagnose

# Network-specific diagnosis
./scripts/blockchain-help.sh diagnose solana
```

### Verbose Mode

```bash
# Verbose dependency checking
./scripts/blockchain-deps-check.sh --verbose

# Verbose installation
./scripts/install-blockchain-tools.sh --tool=rust --verbose

# Verbose building
./scripts/build-contracts.sh --network=solana --verbose
```

## Interactive Features

### User Prompts

The system provides various types of interactive prompts:

- Yes/No questions for confirmation
- Multiple choice selections
- Text input for configuration
- Guided troubleshooting workflows

### Environment Diagnosis

Comprehensive analysis including:

- Core dependency verification (Node.js, pnpm, Git)
- Network-specific tool checking (Rust, Solana CLI, Anchor CLI)
- Project structure validation
- Configuration verification
- Actionable recommendations

### Troubleshooting Workflows

Step-by-step guidance for:

- Build failure resolution
- Missing dependency installation
- Network-specific issues
- Configuration problems

## Implementation Details

### Color-Coded Output

- 🔵 **Info**: General information and status updates
- 🟢 **Success**: Successful operations and confirmations
- 🟡 **Warning**: Non-critical issues and recommendations
- 🔴 **Error**: Critical failures requiring attention
- 🔵 **Question**: Interactive prompts for user input

### Non-Interactive Mode

All scripts automatically detect CI/CD environments and disable interactive features:

- Environment variable `CI` detection
- Non-TTY input detection
- `--non-interactive` flag support

### Error Handling

Comprehensive error handling with:

- Graceful fallbacks when interactive features unavailable
- Clear error messages with actionable guidance
- Exit codes indicating specific failure types
- Retry mechanisms for network operations

## Troubleshooting Categories

### Build Failures

- Contract compilation errors
- Dependency version conflicts
- Configuration issues
- Network-specific problems

### Missing Dependencies

- Tool installation guidance
- Version requirement checking
- Platform-specific instructions
- Automated installation options

### Environment Issues

- PATH configuration problems
- Permission issues
- Platform compatibility
- Development environment setup

## Best Practices

### For Users

1. **Start with help**: Always check `--help` for available options
2. **Use verbose mode**: Add `--verbose` when troubleshooting
3. **Try interactive mode**: Use `--interactive` for guided assistance
4. **Check environment**: Run diagnosis before reporting issues

### For Developers

1. **Consistent interface**: All scripts follow the same help patterns
2. **Graceful degradation**: Interactive features work in non-interactive environments
3. **Clear messaging**: Error messages include actionable guidance
4. **Comprehensive coverage**: Help covers all major use cases

## Future Enhancements

Potential improvements:

- Web-based interactive troubleshooting interface
- Integration with project documentation system
- Automated issue reporting and resolution tracking
- Machine learning-based problem diagnosis
- Integration with development environment IDEs

## Related Documentation

- [Blockchain Development Setup](../../docs/blockchain/setup.md)
- [Troubleshooting Guide](../../docs/support/troubleshooting.md)
- [Documentation Index](../../docs/README.md)
- [Dependency Management Tests](../../test/dependency-management/README.md)
