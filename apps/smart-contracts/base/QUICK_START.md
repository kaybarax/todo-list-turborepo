# Quick Start Guide - Base Sepolia Deployment

## 5-Minute Deployment

### Prerequisites Checklist

- [ ] Foundry installed (`forge --version`)
- [ ] Sepolia ETH in your wallet
- [ ] Basescan API key
- [ ] `.env` file configured

### Step 1: Install Foundry (if needed)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Step 2: Configure Environment

```bash
# Copy example file
cp .env.example .env

# Edit .env and set:
# - BASE_PRIVATE_KEY (your private key without 0x)
# - BASESCAN_API_KEY (from https://basescan.org/myapikey)
```

### Step 3: Get Testnet ETH

1. Get Sepolia ETH: https://sepoliafaucet.com/
2. Bridge to Base Sepolia: https://bridge.base.org/

### Step 4: Verify Setup

```bash
./verify-setup.sh
```

### Step 5: Deploy Everything

```bash
./test-deployment.sh
```

That's it! Your contracts are deployed to Base Sepolia.

## Manual Deployment (Step by Step)

### 1. Deploy Factory

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

### 2. Create TodoList

```bash
forge script script/CreateTodoList.s.sol:CreateTodoListScript \
  --rpc-url base_sepolia \
  --broadcast
```

### 3. Create Sample Todos

```bash
forge script script/CreateSampleTodos.s.sol:CreateSampleTodosScript \
  --rpc-url base_sepolia \
  --broadcast
```

## View Your Contracts

After deployment, find your contract addresses in:

```bash
cat deployments/84532/TodoListFactory.json
cat deployments/84532/TodoList-<YOUR_ADDRESS>.json
```

View on Base Sepolia Explorer:

```text
https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>
```

## Quick Commands

```bash
# Compile contracts
forge build

# Run tests
forge test

# Check balance
cast balance <YOUR_ADDRESS> --rpc-url base_sepolia

# Get todo count
cast call <TODOLIST_ADDRESS> "todoCount()(uint256)" --rpc-url base_sepolia

# Create a todo
cast send <TODOLIST_ADDRESS> \
  "createTodo(string,string,uint8)(uint256)" \
  "My todo" "Description" 1 \
  --private-key $BASE_PRIVATE_KEY \
  --rpc-url base_sepolia
```

## Need Help?

- Full guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- README: [README.md](./README.md)
- Base Docs: https://docs.base.org/
- Foundry Book: https://book.getfoundry.sh/

## Common Issues

| Issue              | Solution                                       |
| ------------------ | ---------------------------------------------- |
| No ETH             | Get from https://sepoliafaucet.com/ and bridge |
| Verification fails | Check `BASESCAN_API_KEY` in `.env`             |
| Nonce too low      | Wait for pending transactions                  |
| Setup fails        | Run `./verify-setup.sh` to diagnose            |

## Network Info

- **Network**: Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://sepoliafaucet.com/ (get Sepolia ETH, then bridge)
