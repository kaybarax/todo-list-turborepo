# Base Network Setup and Deployment Guide

This guide covers setting up and deploying smart contracts to Base, Coinbase's Layer 2 solution built on Ethereum using Optimism's OP Stack.

## 🔵 About Base

Base is a secure, low-cost, builder-friendly Ethereum Layer 2 built to bring the next billion users onchain. It's built on Optimism's OP Stack and backed by Coinbase.

### Key Features

- **Low Fees**: Significantly lower transaction costs than Ethereum mainnet
- **Fast Transactions**: Near-instant transaction confirmation
- **Ethereum Compatibility**: Full EVM compatibility with existing tools
- **Coinbase Integration**: Native integration with Coinbase ecosystem
- **OP Stack**: Built on proven Optimism technology

### Networks

- **Base**: Mainnet (Chain ID: 8453)
- **Base Sepolia**: Testnet (Chain ID: 84532)

## 🛠️ Prerequisites

### Required Tools

- **Node.js 20+** and **pnpm**
- **Hardhat** (installed via project dependencies)
- **MetaMask** or compatible Ethereum wallet

### Environment Setup

1. **Install dependencies**

   ```bash
   cd apps/smart-contracts/base
   pnpm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:

   ```bash
   # Base Mainnet
   BASE_RPC_URL=https://mainnet.base.org
   BASE_PRIVATE_KEY=your-private-key-here
   BASESCAN_API_KEY=your-basescan-api-key

   # Base Sepolia Testnet
   BASE_TESTNET_RPC_URL=https://sepolia.base.org
   BASE_TESTNET_PRIVATE_KEY=your-testnet-private-key

   # Local Development
   BASE_LOCAL_RPC_URL=http://localhost:8545
   ```

## 🔧 Development Setup

### Local Development Node

For local development, you can use Hardhat's built-in network:

```bash
cd apps/smart-contracts/base
pnpm hardhat node
```

### Wallet Configuration

Add Base networks to your wallet:

#### Base Mainnet

- **Network Name**: Base
- **RPC URL**: https://mainnet.base.org
- **Chain ID**: 8453
- **Currency Symbol**: ETH
- **Block Explorer**: https://basescan.org

#### Base Sepolia Testnet

- **Network Name**: Base Sepolia
- **RPC URL**: https://sepolia.base.org
- **Chain ID**: 84532
- **Currency Symbol**: ETH
- **Block Explorer**: https://sepolia.basescan.org

## 📝 Smart Contract Development

### Contract Structure

The Base contracts are located in `apps/smart-contracts/base/`:

```text
base/
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
cd apps/smart-contracts/base

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

### Testnet Deployment (Base Sepolia)

1. **Get testnet tokens**
   - Bridge Sepolia ETH to Base Sepolia using [Base Bridge](https://bridge.base.org)
   - Or use [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

2. **Deploy to testnet**

   ```bash
   cd apps/smart-contracts/base

   # Deploy contracts
   pnpm deploy:testnet

   # Verify contracts (optional)
   pnpm verify:testnet
   ```

3. **Verify deployment**
   ```bash
   # Check deployment status
   pnpm hardhat run scripts/verify-deployment.js --network base-sepolia
   ```

### Mainnet Deployment (Base)

⚠️ **Warning**: Mainnet deployment requires real ETH and careful testing.

1. **Prepare for mainnet**
   - Ensure contracts are thoroughly tested on testnet
   - Have sufficient ETH for deployment and gas fees
   - Double-check all configuration values

2. **Deploy to mainnet**

   ```bash
   cd apps/smart-contracts/base

   # Deploy contracts (with confirmation prompts)
   pnpm deploy:mainnet

   # Verify contracts on Basescan
   pnpm verify:mainnet
   ```

### Local Development Deployment

```bash
cd apps/smart-contracts/base

# Start local node (in separate terminal)
pnpm hardhat node

# Deploy to local network
pnpm deploy:local
```

## 🔍 Contract Verification

### Automatic Verification

Contracts are automatically verified during deployment if you have a Basescan API key:

```bash
# Set your API key in .env
BASESCAN_API_KEY=your-basescan-api-key

# Deploy with verification
pnpm deploy:testnet --verify
```

### Manual Verification

```bash
# Verify specific contract
pnpm hardhat verify --network base-sepolia CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"

# Verify all deployed contracts
pnpm verify:testnet
```

## 🔗 Integration with Frontend

### Contract Addresses

After deployment, contract addresses are saved to:

- `deployments/base-sepolia/TodoList.json` (testnet)
- `deployments/base/TodoList.json` (mainnet)

### Frontend Integration

Update your frontend configuration with the deployed contract addresses:

```typescript
// In your frontend app
const BASE_CONTRACTS = {
  testnet: {
    todoList: '0x...', // From deployments/base-sepolia/TodoList.json
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
  },
  mainnet: {
    todoList: '0x...', // From deployments/base/TodoList.json
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
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

- **Mainnet**: https://basescan.org
- **Testnet**: https://sepolia.basescan.org

### Useful Tools

- **Base Bridge**: https://bridge.base.org
- **Base Ecosystem**: https://base.org/ecosystem
- **DeFiLlama**: Track TVL and analytics

## 🔧 Troubleshooting

### Common Issues

#### 1. RPC Connection Issues

```bash
# Test RPC connection
curl -H "Content-Type: application/json" \
  -d '{"id":1, "jsonrpc":"2.0", "method": "eth_chainId"}' \
  https://mainnet.base.org
```

#### 2. Gas Estimation Failures

```javascript
// In hardhat.config.js, adjust gas settings
networks: {
  base: {
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

- Ensure wallet has enough ETH
- Bridge ETH from Ethereum mainnet using Base Bridge
- Use faucet for testnet tokens

#### 5. L2 Specific Issues

- **Transaction not found**: L2 transactions may take a few seconds to appear
- **Withdrawal delays**: Withdrawals to L1 have a 7-day challenge period
- **Gas price fluctuations**: L2 gas prices can vary based on L1 congestion

### Getting Help

- **Base Discord**: https://discord.gg/buildonbase
- **Base Documentation**: https://docs.base.org
- **GitHub**: https://github.com/base-org

## 🌉 Bridging Assets

### Base Bridge

Use the official Base Bridge to move assets between Ethereum and Base:

1. **Visit**: https://bridge.base.org
2. **Connect Wallet**: Connect your MetaMask or compatible wallet
3. **Select Assets**: Choose ETH or supported ERC-20 tokens
4. **Bridge**: Follow the prompts to bridge assets

### Bridging Times

- **Deposit (L1 → L2)**: ~10-15 minutes
- **Withdrawal (L2 → L1)**: ~7 days (challenge period)

## 📚 Additional Resources

### Documentation

- [Base Documentation](https://docs.base.org)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Optimism Documentation](https://docs.optimism.io)

### Tutorials

- [Base Getting Started](https://docs.base.org/getting-started)
- [Deploy Smart Contracts](https://docs.base.org/guides/deploy-smart-contracts)
- [Bridge Assets](https://docs.base.org/guides/run-a-base-node)

### Tools

- [Base Status](https://status.base.org)
- [Gas Tracker](https://basescan.org/gastracker)
- [Bridge](https://bridge.base.org)
- [Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

### Ecosystem

- [Base Ecosystem](https://base.org/ecosystem)
- [Base Builder Community](https://base.org/builders)
- [Base Grants](https://base.org/grants)

## 🔐 Security Considerations

### L2 Security Model

- **Optimistic Rollup**: Base uses optimistic rollups with fraud proofs
- **Challenge Period**: 7-day withdrawal delay for security
- **Sequencer**: Currently operated by Coinbase (decentralization planned)

### Best Practices

- **Test Thoroughly**: Always test on testnet before mainnet deployment
- **Monitor Transactions**: Use block explorers to monitor transaction status
- **Backup Keys**: Securely store private keys and recovery phrases
- **Gas Management**: Monitor gas prices and set appropriate limits

### Audit Considerations

- **L2 Compatibility**: Ensure contracts work correctly in L2 environment
- **Gas Optimization**: Optimize for L2 gas costs
- **Bridge Security**: Be aware of bridge risks when moving assets
