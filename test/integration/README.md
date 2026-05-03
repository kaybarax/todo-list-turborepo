# Blockchain Expansion Integration Tests

This directory contains comprehensive integration tests for the blockchain expansion refactor, specifically testing the new Moonbeam and Base network integrations along with cross-network functionality.

## Overview

The integration tests cover:

1. **Moonbeam Network Integration**
   - Mainnet and Moonbase Alpha testnet
   - EVM compatibility with Polkadot ecosystem
   - Parachain-specific functionality
   - Substrate integration features

2. **Base Network Integration**
   - Mainnet and Base Sepolia testnet
   - L2 optimistic rollup functionality
   - Coinbase ecosystem integration
   - Gas optimization features

3. **Network Switching Functionality**
   - Seamless switching between all 5 networks (10 environments)
   - Chain ID validation
   - Network-specific UI elements
   - State isolation between networks

4. **Cross-Network Data Consistency**
   - Data integrity across network switches
   - Concurrent operations across networks
   - Transaction isolation
   - Error handling without affecting other networks

## Test Structure

```text
test/integration/
├── blockchain-expansion-integration.test.ts  # Core blockchain service tests
├── web-blockchain-integration.test.ts        # Web application integration tests
├── mobile-blockchain-integration.test.ts     # Mobile application integration tests
├── jest.config.js                           # Jest configuration
├── setup.ts                                 # Test setup and utilities
├── env-setup.ts                             # Environment configuration
├── global-setup.ts                          # Global test setup
├── global-teardown.ts                       # Global test cleanup
├── results-processor.js                     # Custom test result processing
└── README.md                                # This file
```

## Running Tests

### Prerequisites

1. **Node.js 18+** and **pnpm 9+**
2. **Environment Variables** (see `.env.test` or use defaults)
3. **Mock Services** (enabled by default for CI/CD)

### Basic Commands

```bash
# Run all integration tests
pnpm test:integration:all

# Run specific test suites
pnpm test:integration:blockchain    # Core blockchain service tests
pnpm test:integration:web          # Web application tests
pnpm test:integration:mobile       # Mobile application tests

# Run with coverage
pnpm test:integration:all --coverage

# Run in watch mode (development)
pnpm test:integration:all --watch

# Run specific test file
pnpm test:integration:all --testPathPattern=moonbeam

# Run with verbose output
pnpm test:integration:all --verbose
```

### Advanced Options

```bash
# Run with real blockchain services (requires network access)
USE_MOCK_BLOCKCHAIN_SERVICES=false pnpm test:integration:all

# Run performance tests
ENABLE_PERFORMANCE_TESTS=true pnpm test:integration:all

# Run with specific timeout
TEST_TIMEOUT=60000 pnpm test:integration:all

# Run with custom network configuration
MOONBEAM_RPC_URL=https://custom-rpc.com pnpm test:integration:blockchain
```

## Configuration

### Environment Variables

The tests use the following environment variables (with defaults):

#### Network RPC URLs

```bash
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
MOONBEAM_RPC_URL=https://rpc.api.moonbeam.network
MOONBEAM_TESTNET_RPC_URL=https://rpc.api.moonbase.moonbeam.network
BASE_RPC_URL=https://mainnet.base.org
BASE_TESTNET_RPC_URL=https://sepolia.base.org
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com
POLKADOT_RPC_URL=wss://rpc.polkadot.io
POLKADOT_TESTNET_RPC_URL=wss://westend-rpc.polkadot.io
```

#### Contract Addresses

```bash
POLYGON_TODO_FACTORY_ADDRESS=0x...
MOONBEAM_TODO_FACTORY_ADDRESS=0x...
BASE_TODO_FACTORY_ADDRESS=0x...
# ... etc for all networks
```

#### Test Configuration

```bash
USE_MOCK_BLOCKCHAIN_SERVICES=true    # Use mocked services
USE_MOCK_WALLET_PROVIDERS=true       # Use mocked wallet providers
ENABLE_BLOCKCHAIN_TESTS=true         # Enable blockchain-specific tests
ENABLE_PERFORMANCE_TESTS=false       # Enable performance testing
TEST_TIMEOUT=30000                   # Default test timeout (ms)
MOCK_TRANSACTION_DELAY=1000          # Mock transaction delay (ms)
```

### Mock Configuration

By default, tests use mocked blockchain services and wallet providers for:

- **Reliability**: No dependency on external networks
- **Speed**: Faster test execution
- **CI/CD**: Consistent results in automated environments

To use real blockchain services:

```bash
USE_MOCK_BLOCKCHAIN_SERVICES=false USE_MOCK_WALLET_PROVIDERS=false pnpm test:integration:all
```

## Test Categories

### 1. Core Blockchain Service Tests (`blockchain-expansion-integration.test.ts`)

Tests the blockchain service layer directly:

- Service factory configuration
- Network-specific service implementations
- CRUD operations on each network
- Error handling and recovery
- Performance and scalability

**Key Test Scenarios:**

- Moonbeam parachain integration
- Base L2 optimization features
- Network switching without conflicts
- Cross-network data consistency
- Concurrent operations across networks

### 2. Web Application Tests (`web-blockchain-integration.test.ts`)

Tests blockchain integration in the Next.js web application:

- Wallet connection flows
- Network selection UI
- Transaction status handling
- Error display and recovery
- Responsive design during blockchain operations

**Key Test Scenarios:**

- MetaMask integration with new networks
- Network switching prompts
- Transaction confirmation flows
- Network-specific UI elements
- Offline/online state handling

### 3. Mobile Application Tests (`mobile-blockchain-integration.test.ts`)

Tests blockchain integration in the React Native mobile application:

- WalletConnect integration
- Mobile-optimized network switching
- Touch-friendly transaction flows
- Device rotation handling
- Background/foreground transitions

**Key Test Scenarios:**

- Mobile wallet connection
- Network switching on mobile
- Touch gestures for blockchain operations
- Mobile-specific error handling
- Performance on mobile devices

## Test Data and Mocking

### Mock Blockchain Services

The tests include comprehensive mocking for:

- **Transaction Receipts**: Realistic transaction data
- **Network Responses**: Proper RPC response simulation
- **Wallet Providers**: MetaMask, WalletConnect, etc.
- **Error Scenarios**: Network-specific error conditions

### Test Data Generation

Utility functions for generating:

- Mock wallet addresses
- Transaction hashes
- Block numbers and timestamps
- Network-specific data structures

### Performance Testing

When enabled, performance tests measure:

- Transaction confirmation times
- Network switching speed
- Concurrent operation handling
- Memory usage during operations

## Debugging

### Common Issues

1. **Test Timeouts**

   ```bash
   # Increase timeout for slow operations
   TEST_TIMEOUT=60000 pnpm test:integration:all
   ```

2. **Network Connection Errors**

   ```bash
   # Use mocked services
   USE_MOCK_BLOCKCHAIN_SERVICES=true pnpm test:integration:all
   ```

3. **Environment Variable Issues**
   ```bash
   # Check environment setup
   node -e "console.log(process.env.MOONBEAM_RPC_URL)"
   ```

### Debug Mode

```bash
# Run with debug logging
LOG_LEVEL=debug pnpm test:integration:all

# Run single test with full output
pnpm test:integration:all --testNamePattern="should connect to Moonbeam" --verbose
```

### Test Coverage

```bash
# Generate coverage report
pnpm test:integration:all --coverage

# View coverage in browser
open test/integration/coverage/lcov-report/index.html
```

## CI/CD Integration

The tests are designed to run in CI/CD environments:

```yaml
# Example GitHub Actions configuration
- name: Run Integration Tests
  run: |
    USE_MOCK_BLOCKCHAIN_SERVICES=true \
    USE_MOCK_WALLET_PROVIDERS=true \
    ENABLE_PERFORMANCE_TESTS=false \
    pnpm test:integration:all
```

### Docker Support

```bash
# Run tests in Docker
docker run -e USE_MOCK_BLOCKCHAIN_SERVICES=true node:18 \
  bash -c "npm install -g pnpm && pnpm install && pnpm test:integration:all"
```

## Contributing

When adding new integration tests:

1. **Follow the existing patterns** for network-specific tests
2. **Use the provided utilities** in `setup.ts`
3. **Add appropriate mocking** for new blockchain features
4. **Update this README** with new test scenarios
5. **Ensure tests are deterministic** and don't rely on external state

### Test Naming Convention

```typescript
describe('Network Name Integration Tests', () => {
  describe('Specific Feature Tests', () => {
    it('should perform specific action with expected outcome', async () => {
      // Test implementation
    });
  });
});
```

### Adding New Networks

To add tests for a new blockchain network:

1. Add network configuration to `env-setup.ts`
2. Create network-specific test cases
3. Add mock service implementation
4. Update the results processor
5. Document the new network in this README

## Troubleshooting

### Performance Issues

If tests are running slowly:

1. Check if real blockchain services are being used
2. Reduce mock transaction delays
3. Disable performance tests
4. Run tests in parallel with `--maxWorkers`

### Memory Issues

For memory-related problems:

1. Increase Node.js memory limit: `--max-old-space-size=4096`
2. Run tests in smaller batches
3. Check for memory leaks in mock services

### Network-Specific Issues

Each network may have unique characteristics:

- **Moonbeam**: Substrate-specific errors
- **Base**: L2 sequencer issues
- **Polygon**: High gas price variations
- **Solana**: Account rent and program limitations
- **Polkadot**: Parachain connectivity

Refer to the network-specific error handling in each test file for examples.

## Support

For issues with the integration tests:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the test output and error messages
3. Verify environment configuration
4. Check if the issue is network-specific
5. Create an issue with detailed reproduction steps

## Future Enhancements

Planned improvements for the integration tests:

1. **Real Network Testing**: Optional integration with testnets
2. **Load Testing**: High-volume transaction scenarios
3. **Cross-Chain Testing**: Inter-network communication tests
4. **Visual Testing**: Screenshot comparison for UI tests
5. **Automated Performance Benchmarking**: Continuous performance monitoring
