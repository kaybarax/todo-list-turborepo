# Moonbeam Network Setup and Deployment Guide

This guide covers setting up and deploying smart contracts to the Moonbeam network, an Ethereum-compatible smart contract platform built on Polkadot.

## 🌙 About Moonbeam

Moonbeam is a Polkadot parachain that provides an Ethereum-compatible smart contract platform. It allows developers to deploy existing Solidity smart contracts and DApp frontends to Moonbeam with minimal changes.

### Key Features

- **Ethereum Compatibility**: Full Web3 RPC API compatibility
- **Polkadot Integration**: Cross-chain interoperability through Polkadot
- **EVM Support**: Run existing Ethereum smart contracts
- **Cross-Chain Assets**: Native cross-chain token transfers

### Networks

- **Moonbeam**: Mainnet (Chain ID: 1284)
- **Moonbase Alpha**: Testnet (Chain ID: 1287)
- **Moonriver**: Kusama parachain (Chain ID: 1285)

## 🛠️ Prerequisites

### Required Tools

- **Node.js 20+** and **pnpm**
- **Hardhat** (installed via project dependencies)
- **MetaMask** or compatible Ethereum wallet

### Environment Setup

1. **Install dependencies**

   ```bash
   cd apps/smart-contracts/moonbeam
   pnpm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```bash
   # Moonbeam Mainnet
   MOONBEAM_RPC_URL=https://rpc.api.moonbeam.network
   MOONBEAM_PRIVATE_KEY=your-private-key-here
   MOONBEAM_API_KEY=your-moonscan-api-key

   # Moonbase Alpha Testnet
   MOONBEAM_TESTNET_RPC_URL=https://rpc.api.moonbase.moonbeam.network
   MOONBEAM_TESTNET_PRIVATE_KEY=your-testnet-private-key

   # Local Development
   MOONBEAM_LOCAL_RPC_URL=http://localhost:8545
   ```

## 🔧 Development Setup

### Local Development Node

For local development, you can use Hardhat's built-in network or run a local Moonbeam node:

```bash
# Option 1: Use Hardhat network (recommended for development)
cd apps/smart-contracts/moonbeam
pnpm hardhat node

# Option 2: Run local Moonbeam node (Docker)
docker run -d --name moonbeam-node \
  -p 9944:9944 -p 9933:9933 \
  purestake/moonbeam:v0.28.0 \
  --dev --ws-external --rpc-external
```

### Wallet Configuration

Add Moonbeam networks to your wallet:

#### Moonbeam Mainnet

- **Network Name**: Moonbeam
- **RPC URL**: https://rpc.api.moonbeam.network
- **Chain ID**: 1284
- **Currency Symbol**: GLMR
- **Block Explorer**: https://moonscan.io

#### Moonbase Alpha Testnet

- **Network Name**: Moonbase Alpha
- **RPC URL**: https://rpc.api.moonbase.moonbeam.network
- **Chain ID**: 1287
- **Currency Symbol**: DEV
- **Block Explorer**: https://moonbase.moonscan.io

## 📝 Smart Contract Development

### Contract Structure

The Moonbeam contracts are located in `apps/smart-contracts/moonbeam/`:

```text
moonbeam/
├── contracts/
│   ├── TodoList.sol         # Main todo list contract
│   ├── TodoListFactory.sol  # Factory for creating todo lists
│   └── interfaces/          # Contract interfaces
├── scripts/
│   ├── deploy.js           # Deployment script
│   └── verify.js           # Contract verification
├── test/
│   ├── TodoList.test.js    # Contract tests
│   └── Integration.test.js # Integration tests
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

### Compiling Contracts

```bash
cd apps/smart-contracts/moonbeam

# Compile contracts
pnpm compile

# Clean and recompile
pnpm clean
pnpm compile
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm hardhat test test/TodoList.test.js

# Run tests with gas reporting
pnpm test:gas

# Run tests with coverage
pnpm test:coverage
```

## 🚀 Deployment

### Testnet Deployment (Moonbase Alpha)

1. **Get testnet tokens**
   - Visit [Moonbase Alpha Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet/)
   - Request DEV tokens for your wallet address

2. **Deploy to testnet**

   ```bash
   cd apps/smart-contracts/moonbeam

   # Deploy contracts
   pnpm deploy:testnet

   # Verify contracts (optional)
   pnpm verify:testnet
   ```

3. **Verify deployment**
   ```bash
   # Check deployment status
   pnpm hardhat run scripts/verify-deployment.js --network moonbase
   ```

### Mainnet Deployment (Moonbeam)

⚠️ **Warning**: Mainnet deployment requires real GLMR tokens and careful testing.

1. **Prepare for mainnet**
   - Ensure contracts are thoroughly tested on testnet
   - Have sufficient GLMR tokens for deployment and gas fees
   - Double-check all configuration values

2. **Deploy to mainnet**

   ```bash
   cd apps/smart-contracts/moonbeam

   # Deploy contracts (with confirmation prompts)
   pnpm deploy:mainnet

   # Verify contracts on Moonscan
   pnpm verify:mainnet
   ```

### Local Development Deployment

```bash
cd apps/smart-contracts/moonbeam

# Start local node (in separate terminal)
pnpm hardhat node

# Deploy to local network
pnpm deploy:local
```

## 🔍 Contract Verification

### Automatic Verification

Contracts are automatically verified during deployment if you have a Moonscan API key:

```bash
# Set your API key in .env
MOONBEAM_API_KEY=your-moonscan-api-key

# Deploy with verification
pnpm deploy:testnet --verify
```

### Manual Verification

```bash
# Verify specific contract
pnpm hardhat verify --network moonbase CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"

# Verify all deployed contracts
pnpm verify:testnet
```

## 🔗 Integration with Frontend

### Contract Addresses

After deployment, contract addresses are saved to:

- `deployments/moonbase/TodoList.json` (testnet)
- `deployments/moonbeam/TodoList.json` (mainnet)

### Frontend Integration

Update your frontend configuration with the deployed contract addresses:

```typescript
// In your frontend app
const MOONBEAM_CONTRACTS = {
  testnet: {
    todoList: '0x...', // From deployments/moonbase/TodoList.json
    chainId: 1287,
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  },
  mainnet: {
    todoList: '0x...', // From deployments/moonbeam/TodoList.json
    chainId: 1284,
    rpcUrl: 'https://rpc.api.moonbeam.network',
  },
};
```

## 🧪 Testing Strategy

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run with gas reporting
pnpm test:gas
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Test against live testnet
pnpm test:testnet
```

### Load Testing

```bash
# Run load tests (requires deployed contracts)
pnpm test:load
```

## 📊 Monitoring and Analytics

### Block Explorer

- **Mainnet**: https://moonscan.io
- **Testnet**: https://moonbase.moonscan.io

### Useful Tools

- **Moonbeam DApp**: https://apps.moonbeam.network
- **Subscan**: https://moonbeam.subscan.io
- **DeFiLlama**: Track TVL and analytics

## 🔧 Troubleshooting

### Common Issues

#### 1. RPC Connection Issues

```bash
# Test RPC connection
curl -H "Content-Type: application/json" \
  -d '{"id":1, "jsonrpc":"2.0", "method": "eth_chainId"}' \
  https://rpc.api.moonbeam.network
```

#### 2. Gas Estimation Failures

```javascript
// In hardhat.config.js, adjust gas settings
networks: {
  moonbase: {
    gasPrice: 1000000000, // 1 gwei
    gas: 5000000
  }
}
```

#### 3. Contract Verification Failures

```bash
# Check contract bytecode matches
pnpm hardhat verify --list-networks
pnpm hardhat verify --show-stack-traces CONTRACT_ADDRESS
```

#### 4. Insufficient Funds

- Ensure wallet has enough GLMR/DEV tokens
- Check gas price and limit settings
- Use faucet for testnet tokens

### Getting Help

- **Moonbeam Discord**: https://discord.gg/PfpUATX
- **Documentation**: https://docs.moonbeam.network
- **GitHub**: https://github.com/moonbeam-foundation/moonbeam

## 📚 Additional Resources

### Documentation

- [Moonbeam Documentation](https://docs.moonbeam.network)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

### Tutorials

- [Moonbeam Getting Started](https://docs.moonbeam.network/getting-started/)
- [Deploy Smart Contracts](https://docs.moonbeam.network/builders/build/eth-api/dev-env/hardhat/)
- [Cross-Chain Integration](https://docs.moonbeam.network/builders/interoperability/)

### Tools

- [Moonbeam Network Status](https://status.moonbeam.network)
- [Gas Tracker](https://moonbeam.moonscan.io/gastracker)
- [Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet/)
