# Base Sepolia Testnet Deployment Guide

This guide walks you through deploying the TodoList contracts to Base Sepolia testnet.

## Prerequisites

1. **Foundry Installed**: Ensure you have Foundry installed

   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Sepolia ETH**: Your deployment account needs Sepolia ETH
   - Get Sepolia ETH from: https://sepoliafaucet.com/
   - Bridge to Base Sepolia: https://bridge.base.org/

3. **Basescan API Key**: For contract verification
   - Sign up at: https://basescan.org/
   - Get API key from: https://basescan.org/myapikey

## Step 1: Configure Environment Variables

Edit the `.env` file in this directory:

```bash
# Your private key (without 0x prefix)
BASE_PRIVATE_KEY=your_actual_private_key_here

# Base Sepolia RPC URL (default should work)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Your Basescan API key
BASESCAN_API_KEY=your_actual_api_key_here
```

**Security Note**: Never commit your `.env` file to version control!

## Step 2: Verify Configuration

Check that your configuration is correct:

```bash
# Load environment variables
source .env

# Check your account balance
cast balance $(cast wallet address $BASE_PRIVATE_KEY) --rpc-url $BASE_SEPOLIA_RPC_URL

# Verify RPC connection
cast chain-id --rpc-url $BASE_SEPOLIA_RPC_URL
# Should return: 84532 (Base Sepolia chain ID)
```

## Step 3: Deploy TodoListFactory

Deploy the factory contract to Base Sepolia:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

**What this does:**

- Deploys the `TodoListFactory` contract
- Automatically verifies the contract on Basescan
- Saves deployment info to `deployments/84532/TodoListFactory.json`

**Expected Output:**

```bash
===========================================
Deploying TodoListFactory
===========================================
Deployer address: 0x...
Chain ID: 84532
===========================================

===========================================
Deployment Complete!
===========================================
TodoListFactory deployed to: 0x...
Factory owner: 0x...
Block number: ...
===========================================
```

## Step 4: Verify Deployment on Block Explorer

Visit Base Sepolia Explorer to verify your deployment:

```text
https://sepolia.basescan.org/address/<YOUR_FACTORY_ADDRESS>
```

You should see:

- ✅ Contract verified (green checkmark)
- Contract source code visible
- Read/Write contract functions available

## Step 5: Create a TodoList Instance

Create your personal TodoList:

```bash
forge script script/CreateTodoList.s.sol:CreateTodoListScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

**What this does:**

- Reads the factory address from deployment file
- Creates a new TodoList for your account
- Saves TodoList info to `deployments/84532/TodoList-<YOUR_ADDRESS>.json`

**Expected Output:**

```bash
===========================================
Creating TodoList
===========================================
Factory address: 0x...
User address: 0x...
Chain ID: 84532
===========================================

===========================================
TodoList Created!
===========================================
TodoList address: 0x...
TodoList owner: 0x...
Block number: ...
===========================================
```

## Step 6: Create Sample Todos

Populate your TodoList with sample data:

```bash
forge script script/CreateSampleTodos.s.sol:CreateSampleTodosScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

**What this does:**

- Creates 5 sample todo items
- Marks one as completed
- Saves sample todos info to `deployments/84532/SampleTodos-<YOUR_ADDRESS>.json`

**Expected Output:**

```bash
===========================================
Creating Sample Todos
===========================================
Factory address: 0x...
User address: 0x...
Chain ID: 84532
TodoList address: 0x...
===========================================

Creating sample todos...
Created todo #1 - High priority
Created todo #2 - Medium priority
Created todo #3 - Low priority
Created todo #4 - High priority
Created todo #5 - Medium priority
Marked todo #5 as completed

===========================================
Sample Todos Created!
===========================================
Total todos: 5
Completed: 1
Pending: 4
High priority pending: 2
Block number: ...
===========================================
```

## Step 7: Interact with Your Contracts

### Using Cast (Command Line)

```bash
# Get your TodoList address
FACTORY_ADDRESS=$(jq -r '.factory' deployments/84532/TodoListFactory.json)
TODOLIST_ADDRESS=$(jq -r '.todoList' deployments/84532/TodoList-$(cast wallet address $BASE_PRIVATE_KEY).json)

# Get todo count
cast call $TODOLIST_ADDRESS "todoCount()(uint256)" --rpc-url base_sepolia

# Get a specific todo
cast call $TODOLIST_ADDRESS "getTodo(uint256)((uint256,string,string,bool,uint8,uint256,uint256))" 1 --rpc-url base_sepolia

# Get todo statistics
cast call $TODOLIST_ADDRESS "getTodoStats()((uint256,uint256,uint256,uint256))" --rpc-url base_sepolia

# Create a new todo
cast send $TODOLIST_ADDRESS \
  "createTodo(string,string,uint8)(uint256)" \
  "My new todo" \
  "Description here" \
  1 \
  --private-key $BASE_PRIVATE_KEY \
  --rpc-url base_sepolia
```

### Using Block Explorer

Visit your TodoList contract on Basescan:

```text
https://sepolia.basescan.org/address/<YOUR_TODOLIST_ADDRESS>
```

Use the "Read Contract" and "Write Contract" tabs to interact with your todos.

## Troubleshooting

### Issue: "insufficient funds for gas"

**Solution**: Your account needs more Sepolia ETH

- Get more from: https://sepoliafaucet.com/
- Bridge to Base Sepolia: https://bridge.base.org/

### Issue: "nonce too low"

**Solution**: Reset your nonce or wait for pending transactions

```bash
# Check pending transactions
cast tx <TX_HASH> --rpc-url base_sepolia
```

### Issue: "Contract verification failed"

**Solution**: Manually verify the contract

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/TodoListFactory.sol:TodoListFactory \
  --chain base-sepolia \
  --watch
```

### Issue: "Factory address not found"

**Solution**: Make sure you deployed the factory first (Step 3)

```bash
# Check if deployment file exists
ls -la deployments/84532/TodoListFactory.json
```

### Issue: "User already has a TodoList"

**Solution**: This is expected if you already created one. Use the existing TodoList address:

```bash
# Get your existing TodoList
FACTORY_ADDRESS=$(jq -r '.factory' deployments/84532/TodoListFactory.json)
cast call $FACTORY_ADDRESS "getTodoList()(address)" --rpc-url base_sepolia
```

## Deployment Artifacts

All deployment information is saved in the `deployments/84532/` directory:

- `TodoListFactory.json` - Factory contract deployment info
- `TodoList-<ADDRESS>.json` - Your TodoList deployment info
- `SampleTodos-<ADDRESS>.json` - Sample todos creation info

## Network Information

- **Network**: Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://sepoliafaucet.com/ (get Sepolia ETH, then bridge)
- **Bridge**: https://bridge.base.org/

## Next Steps

After successful testnet deployment:

1. Test all contract functions thoroughly
2. Monitor gas costs and optimize if needed
3. Conduct security audit
4. Prepare for mainnet deployment
5. Update frontend to connect to deployed contracts

## Security Reminders

- ✅ Never commit `.env` file
- ✅ Use a separate account for testnet
- ✅ Verify contracts on block explorer
- ✅ Test all functions before mainnet
- ✅ Use hardware wallet for mainnet deployment
