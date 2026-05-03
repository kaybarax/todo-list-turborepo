# Base Smart Contracts

This directory contains smart contracts for the Todo application deployed on Base, Coinbase's Ethereum L2 optimistic rollup.

## Overview

Base is a secure, low-cost, builder-friendly Ethereum L2 built to bring the next billion users onchain. It's built on Optimism's OP Stack and offers full EVM compatibility with significantly lower gas costs than Ethereum mainnet.

**Development Framework**: This project uses [Foundry](https://book.getfoundry.sh/), a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.

## Contracts

- **TodoList.sol**: Main contract for managing todo items
- **TodoListFactory.sol**: Factory contract for creating TodoList instances

## Networks

### Base Mainnet

- **Chain ID**: 8453
- **Native Token**: ETH
- **RPC URL**: https://mainnet.base.org
- **Explorer**: https://basescan.org

### Base Sepolia (Testnet)

- **Chain ID**: 84532
- **Native Token**: ETH
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org

### Local Development

- **Chain ID**: 8453
- **RPC URL**: http://localhost:8545 (when running local node)

## Prerequisites

1. **Install Foundry**:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Install dependencies** (if using npm scripts):

```bash
npm install
```

## Setup

1. **Copy environment file**:

```bash
cp .env.example .env
```

2. **Configure your environment variables** in `.env`:
   - `BASE_PRIVATE_KEY`: Your private key for deployment (without 0x prefix)
   - `BASESCAN_API_KEY`: API key for contract verification ([Get one here](https://basescan.org/myapikey))
   - `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC URL (default: https://sepolia.base.org)
   - `BASE_RPC_URL`: Base mainnet RPC URL (default: https://mainnet.base.org)

3. **Get testnet ETH** (for Base Sepolia deployment):
   - Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
   - Bridge to Base Sepolia at [Base Bridge](https://bridge.base.org/)

4. **Verify your setup**:

```bash
./verify-setup.sh
```

## Usage

### Compile Contracts

```bash
forge build
```

### Run Tests

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test test_CreateTodo

# Generate gas report
forge test --gas-report

# Generate coverage report
forge coverage
```

### Deploy to Base Sepolia Testnet

**Quick Start** - Run the complete deployment workflow:

```bash
./test-deployment.sh
```

**Manual Deployment** - Step by step:

1. **Deploy TodoListFactory**:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

2. **Create your TodoList**:

```bash
forge script script/CreateTodoList.s.sol:CreateTodoListScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

3. **Create sample todos**:

```bash
forge script script/CreateSampleTodos.s.sol:CreateSampleTodosScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Deploy to Base Mainnet

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base \
  --broadcast \
  --verify \
  -vvvv
```

### Deploy to Local Anvil Node

1. **Start Anvil** (Foundry's local node):

```bash
anvil --chain-id 8453
```

2. **Deploy contracts**:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url localhost \
  --broadcast \
  -vvvv
```

### Verify Contracts

Contracts are automatically verified during deployment with the `--verify` flag. To manually verify:

```bash
# Verify on Base Sepolia
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/TodoListFactory.sol:TodoListFactory \
  --chain base-sepolia \
  --watch

# Verify on Base Mainnet
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/TodoListFactory.sol:TodoListFactory \
  --chain base \
  --watch
```

### Interact with Deployed Contracts

Using Cast (Foundry's CLI tool):

```bash
# Get factory address from deployment file
FACTORY_ADDRESS=$(jq -r '.factory' deployments/84532/TodoListFactory.json)

# Get your TodoList address
DEPLOYER_ADDRESS=$(cast wallet address $BASE_PRIVATE_KEY)
TODOLIST_ADDRESS=$(jq -r '.todoList' "deployments/84532/TodoList-${DEPLOYER_ADDRESS}.json")

# Get todo count
cast call $TODOLIST_ADDRESS "todoCount()(uint256)" --rpc-url base_sepolia

# Get a specific todo
cast call $TODOLIST_ADDRESS "getTodo(uint256)((uint256,string,string,bool,uint8,uint256,uint256))" 1 --rpc-url base_sepolia

# Create a new todo
cast send $TODOLIST_ADDRESS \
  "createTodo(string,string,uint8)(uint256)" \
  "My new todo" \
  "Description here" \
  1 \
  --private-key $BASE_PRIVATE_KEY \
  --rpc-url base_sepolia
```

## Development

### Local Development with Anvil

Anvil is Foundry's local Ethereum node for testing:

```bash
# Start Anvil with Base chain ID
anvil --chain-id 8453

# In another terminal, deploy contracts
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url localhost \
  --broadcast
```

### Advanced Testing Features

**Fuzz Testing**:

```bash
# Run fuzz tests with default 256 runs
forge test --match-contract TodoListFuzzTest

# Run with more iterations
forge test --match-contract TodoListFuzzTest --fuzz-runs 10000
```

**Gas Snapshots**:

```bash
# Generate gas snapshot
forge snapshot

# Compare gas usage
forge snapshot --diff
```

**Coverage Analysis**:

```bash
# Generate coverage report
forge coverage

# Generate LCOV report
forge coverage --report lcov
```

### Gas Optimization

Base offers significantly lower gas costs than Ethereum mainnet. The contracts are optimized for:

- Efficient storage usage
- Minimal gas consumption
- Batch operations where possible
- L2-specific optimizations

Monitor gas usage with:

```bash
forge test --gas-report
```

### Base-Specific Features

- **Low Gas Costs**: Transactions cost a fraction of Ethereum mainnet
- **Fast Finality**: Near-instant transaction confirmation
- **EVM Compatibility**: Full compatibility with Ethereum tooling
- **Optimistic Rollup**: Inherits Ethereum's security with L2 efficiency

### Foundry Commands Reference

```bash
# Build
forge build                    # Compile contracts
forge clean                    # Remove build artifacts

# Test
forge test                     # Run tests
forge test -vvv                # Verbose output
forge test --gas-report        # Show gas usage
forge coverage                 # Coverage report

# Deploy
forge script <script>          # Run deployment script
forge create <contract>        # Deploy single contract

# Interact
cast call <address> <sig>      # Call view function
cast send <address> <sig>      # Send transaction
cast balance <address>         # Check balance

# Verify
forge verify-contract          # Verify on block explorer

# Format
forge fmt                      # Format Solidity code
forge fmt --check              # Check formatting

# Other
forge snapshot                 # Gas snapshot
forge doc                      # Generate documentation
```

## Contract Addresses

After deployment, contract addresses are saved in `deployments/{chainId}/`:

- `deployments/84532/` - Base Sepolia testnet
- `deployments/8453/` - Base mainnet

Files:

- `TodoListFactory.json` - Factory contract deployment info
- `TodoList-<ADDRESS>.json` - Individual TodoList deployments
- `SampleTodos-<ADDRESS>.json` - Sample todos creation info

## Project Structure

```text
apps/smart-contracts/base/
├── src/                      # Contract source files
│   ├── TodoList.sol
│   └── TodoListFactory.sol
├── test/                     # Foundry tests
│   ├── TodoList.t.sol
│   ├── TodoListFactory.t.sol
│   ├── TodoListFuzz.t.sol
│   └── helpers/
│       └── TestHelpers.sol
├── script/                   # Deployment scripts
│   ├── Deploy.s.sol
│   ├── CreateTodoList.s.sol
│   └── CreateSampleTodos.s.sol
├── lib/                      # Dependencies (git submodules)
│   ├── forge-std/
│   └── openzeppelin-contracts/
├── out/                      # Build artifacts
├── deployments/              # Deployment records
├── foundry.toml              # Foundry configuration
├── remappings.txt            # Import remappings
├── .env                      # Environment variables
├── verify-setup.sh           # Setup verification script
├── test-deployment.sh        # Deployment test script
├── DEPLOYMENT_GUIDE.md       # Detailed deployment guide
└── README.md                 # This file
```

## Troubleshooting

### Common Issues

**"insufficient funds for gas"**

- Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Bridge to Base Sepolia at [Base Bridge](https://bridge.base.org/)

**"nonce too low"**

- Wait for pending transactions to complete
- Check transaction status: `cast tx <TX_HASH> --rpc-url base_sepolia`

**"Contract verification failed"**

- Ensure `BASESCAN_API_KEY` is set in `.env`
- Try manual verification: `forge verify-contract <ADDRESS> <CONTRACT> --chain base-sepolia`

**"Factory address not found"**

- Deploy factory first: `forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast`

For more troubleshooting, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute deployment guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions
- **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)** - How to execute deployment
- **[TESTNET_DEPLOYMENT_CHECKLIST.md](./TESTNET_DEPLOYMENT_CHECKLIST.md)** - Deployment verification checklist

## Resources

- [Base Documentation](https://docs.base.org/)
- [Base GitHub](https://github.com/base-org)
- [OP Stack Documentation](https://stack.optimism.io/)
- [Basescan Explorer](https://basescan.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Base Sepolia Faucet](https://sepoliafaucet.com/)
- [Base Bridge](https://bridge.base.org/)

## Support

For Base-specific issues:

- [Base Discord](https://discord.gg/buildonbase)
- [Base Twitter](https://twitter.com/base)
- [Base GitHub Discussions](https://github.com/base-org/base-contracts/discussions)

For Foundry issues:

- [Foundry Telegram](https://t.me/foundry_rs)
- [Foundry GitHub](https://github.com/foundry-rs/foundry)
