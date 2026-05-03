# Smart Contracts

Multi-network smart contracts for the Todo List application, supporting decentralized todo storage across 5 blockchain networks.

## 🌐 Supported Networks

This project supports smart contracts deployment across multiple blockchain networks:

### EVM-Compatible Networks

- **[Polygon](polygon/README.md)** - Ethereum-compatible scaling solution
- **[Moonbeam](moonbeam/README.md)** - Ethereum-compatible smart contract platform on Polkadot
- **[Base](base/README.md)** - Coinbase's Layer 2 solution built on Optimism

### Non-EVM Networks

- **[Solana](solana/README.md)** - High-performance blockchain with Rust programs
- **[Polkadot](polkadot/README.md)** - Interoperable blockchain network with Substrate pallets

## 📁 Directory Structure

```text
smart-contracts/
├── polygon/                 # Polygon network contracts (Solidity + Hardhat)
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
├── moonbeam/               # Moonbeam network contracts (Solidity + Hardhat)
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
├── base/                   # Base network contracts (Solidity + Hardhat)
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.js
├── solana/                 # Solana programs (Rust + Anchor)
│   ├── programs/
│   ├── tests/
│   ├── migrations/
│   └── Anchor.toml
├── polkadot/              # Polkadot pallets (Rust + Substrate)
│   ├── pallets/
│   ├── runtime/
│   ├── node/
│   └── Cargo.toml
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **pnpm**
- **Rust** (for Solana and Polkadot development)
- **Docker** (optional, for local blockchain nodes)

### Installation

```bash
# Install all dependencies
pnpm install

# Install Rust (for Solana/Polkadot)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

## 🛠️ Development Commands

### Build All Contracts

```bash
# From project root
pnpm build:contracts

# Or from this directory
pnpm compile:all
```

### Network-Specific Commands

```bash
# Polygon
pnpm contracts:polygon

# Moonbeam
pnpm contracts:moonbeam

# Base
pnpm contracts:base

# Solana
pnpm contracts:solana

# Polkadot
pnpm contracts:polkadot
```

### Testing

```bash
# Test all contracts
pnpm test:contracts

# Test specific network
cd polygon && pnpm test
cd moonbeam && pnpm test
cd base && pnpm test
cd solana && anchor test
cd polkadot && cargo test
```

## 📋 Contract Specifications

### Core Functionality

All networks implement the same core todo functionality:

#### TodoList Contract/Program

- **Create Todo**: Add new todo items with metadata
- **Update Todo**: Modify existing todo items
- **Delete Todo**: Remove todo items
- **List Todos**: Retrieve user's todo items
- **Toggle Status**: Mark todos as complete/incomplete

#### TodoListFactory Contract/Program

- **Create TodoList**: Deploy new todo list instances
- **List User TodoLists**: Retrieve user's todo list contracts
- **Access Control**: Manage permissions and ownership

### Data Structure

```solidity
struct Todo {
  uint256 id;
  string title;
  string description;
  bool completed;
  uint8 priority; // 0=low, 1=medium, 2=high
  uint256 dueDate; // Unix timestamp
  string[] tags;
  uint256 createdAt;
  uint256 updatedAt;
  address owner;
}
```

## 🔧 Network-Specific Features

### EVM Networks (Polygon, Moonbeam, Base)

- **Solidity 0.8.19+**
- **OpenZeppelin contracts** for security
- **Hardhat** for development and testing
- **Gas optimization** for each network's characteristics
- **Contract verification** on block explorers

### Solana

- **Rust programs** with Anchor framework
- **Program Derived Addresses (PDAs)** for data storage
- **Cross-Program Invocations (CPIs)** for modularity
- **Solana Web3.js** integration

### Polkadot

- **Substrate pallets** in Rust
- **Runtime integration** with custom logic
- **Cross-chain messaging** capabilities
- **Governance integration** for upgrades

## 🚀 Deployment

### GitHub Actions (Primary Path)

Deployments are automated via GitHub Actions with manual approval gates:

- **Workflows**: `deploy-contracts.yml`
- **Environments**: `polygon-mainnet`, `solana-mainnet`, etc.
- **Security**: Private keys are stored as encrypted GitHub Environment Secrets.

### Development (Local)

## 🧪 Testing Strategy

### Unit Tests

- **Contract Logic**: Test individual contract functions
- **Edge Cases**: Test boundary conditions and error cases
- **Gas Usage**: Monitor and optimize gas consumption

### Integration Tests

- **Cross-Contract**: Test interactions between contracts
- **Frontend Integration**: Test with actual frontend calls
- **Multi-Network**: Test consistency across networks

### End-to-End Tests

- **User Workflows**: Complete user journey testing
- **Network Switching**: Test network switching functionality
- **Error Handling**: Test error scenarios and recovery

## 📊 Gas Optimization

### EVM Networks

- **Storage Optimization**: Minimize storage operations
- **Batch Operations**: Group multiple operations
- **Event Logging**: Use events for off-chain data
- **Proxy Patterns**: Use upgradeable contracts where appropriate

### Solana

- **Account Optimization**: Minimize account data size
- **Instruction Batching**: Combine multiple instructions
- **Rent Optimization**: Manage account rent efficiently

### Polkadot

- **Weight Optimization**: Minimize computational weight
- **Storage Efficiency**: Optimize on-chain storage usage

## 🔒 Security Considerations

### Common Security Practices

- **Access Control**: Proper permission management
- **Input Validation**: Validate all user inputs
- **Reentrancy Protection**: Prevent reentrancy attacks
- **Integer Overflow**: Use safe math operations

### Network-Specific Security

- **EVM**: Follow Solidity security best practices
- **Solana**: Implement proper PDA validation
- **Polkadot**: Follow Substrate security guidelines

### Audit Checklist

- [ ] Access control mechanisms
- [ ] Input validation and sanitization
- [ ] Reentrancy protection
- [ ] Integer overflow/underflow protection
- [ ] Gas optimization
- [ ] Event emission for important state changes
- [ ] Proper error handling
- [ ] Upgrade mechanisms (if applicable)

## 📚 Documentation

### Network-Specific Guides

- **[Polygon Setup Guide](../../docs/POLYGON_SETUP.md)**
- **[Moonbeam Setup Guide](../../docs/MOONBEAM_SETUP.md)**
- **[Base Setup Guide](../../docs/BASE_SETUP.md)**
- **[Solana Setup Guide](../../docs/SOLANA_SETUP.md)**
- **[Polkadot Setup Guide](../../docs/POLKADOT_SETUP.md)**

### API Documentation

- **Contract ABIs**: Available in `deployments/` directories
- **Program IDLs**: Available in Solana `target/idl/` directory
- **Pallet Metadata**: Available in Polkadot runtime

## 🔗 Integration

### Frontend Integration

```typescript
// Example integration with web3 libraries
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import { ApiPromise } from '@polkadot/api';

// EVM networks (Polygon, Moonbeam, Base)
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Solana
const connection = new Connection(SOLANA_RPC_URL);
const programId = new PublicKey(PROGRAM_ID);

// Polkadot
const api = await ApiPromise.create({ provider: wsProvider });
```

### Backend Integration

- **API Services**: Integrate with NestJS backend
- **Event Listening**: Monitor blockchain events
- **Transaction Status**: Track transaction confirmations

## 🛠️ Development Tools

### Recommended Extensions (VS Code)

- **Solidity**: Solidity language support
- **Rust Analyzer**: Rust language support
- **Hardhat**: Hardhat integration
- **Anchor**: Solana Anchor support

### Debugging Tools

- **Hardhat Console**: Interactive contract debugging
- **Solana Explorer**: Transaction and account inspection
- **Polkadot.js Apps**: Substrate chain interaction

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/new-contract`
2. **Implement Changes**: Add contracts, tests, and documentation
3. **Run Tests**: Ensure all tests pass
4. **Deploy to Testnet**: Test on relevant testnets
5. **Create Pull Request**: Submit for review

### Code Standards

- **Solidity**: Follow Solidity style guide
- **Rust**: Follow Rust style guide
- **Testing**: Maintain >90% test coverage
- **Documentation**: Document all public functions

## 📞 Support

### Getting Help

- **Discord**: Join our development Discord
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check network-specific guides

### Network-Specific Support

- **Polygon**: [Polygon Discord](https://discord.gg/polygon)
- **Moonbeam**: [Moonbeam Discord](https://discord.gg/PfpUATX)
- **Base**: [Base Discord](https://discord.gg/buildonbase)
- **Solana**: [Solana Discord](https://discord.gg/solana)
- **Polkadot**: [Polkadot Discord](https://discord.gg/polkadot)
