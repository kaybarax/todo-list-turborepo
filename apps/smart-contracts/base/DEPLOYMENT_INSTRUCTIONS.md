# How to Execute Base Sepolia Deployment

## Overview

Task 8 has been prepared with all necessary scripts, documentation, and configuration files. To actually deploy to Base Sepolia testnet, you need to:

1. Add your real credentials to `.env`
2. Get testnet ETH
3. Run the deployment scripts

## Current Status

✅ **Completed**:

- `.env` file created with placeholder values
- Deployment scripts ready (`Deploy.s.sol`, `CreateTodoList.s.sol`, `CreateSampleTodos.s.sol`)
- Verification script created (`verify-setup.sh`)
- Automated deployment script created (`test-deployment.sh`)
- Comprehensive documentation created

⏳ **Requires User Action**:

- Add real private key to `.env`
- Add Basescan API key to `.env`
- Get Sepolia ETH and bridge to Base Sepolia
- Execute deployment commands

## Step-by-Step Execution

### Step 1: Configure Your Private Key

Edit `.env` file and replace the placeholder:

```bash
# Open .env in your editor
nano .env  # or vim, code, etc.

# Replace this line:
BASE_PRIVATE_KEY=your_private_key_here_without_0x_prefix

# With your actual private key (without 0x prefix):
BASE_PRIVATE_KEY=abc123def456...  # Your actual key
```

**Security Warning**:

- Never commit `.env` to git (it's already in `.gitignore`)
- Use a separate wallet for testnet
- Don't use your mainnet wallet

### Step 2: Get Basescan API Key

1. Go to https://basescan.org/
2. Sign up for a free account
3. Go to https://basescan.org/myapikey
4. Create a new API key
5. Add it to `.env`:

```bash
BASESCAN_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

### Step 3: Get Testnet ETH

Your wallet needs Sepolia ETH to pay for gas:

1. **Get Sepolia ETH**:
   - Visit https://sepoliafaucet.com/
   - Enter your wallet address
   - Request testnet ETH

2. **Bridge to Base Sepolia**:
   - Visit https://bridge.base.org/
   - Connect your wallet
   - Bridge Sepolia ETH to Base Sepolia
   - Wait for bridge confirmation (~10 minutes)

3. **Verify you have ETH**:
   ```bash
   source .env
   cast balance $(cast wallet address $BASE_PRIVATE_KEY) --rpc-url $BASE_SEPOLIA_RPC_URL
   ```

### Step 4: Verify Setup

Run the verification script to ensure everything is configured:

```bash
cd apps/smart-contracts/base
./verify-setup.sh
```

This checks:

- ✅ `.env` file exists and is configured
- ✅ Foundry is installed
- ✅ RPC connection works
- ✅ Account has sufficient balance
- ✅ Contracts compile successfully

### Step 5: Deploy to Base Sepolia

**Option A: Automated Deployment** (Recommended)

Run the complete deployment workflow:

```bash
./test-deployment.sh
```

This will:

1. Verify setup
2. Deploy TodoListFactory
3. Create your TodoList
4. Create sample todos
5. Verify contract interaction
6. Display summary with explorer links

**Option B: Manual Deployment**

Deploy step by step:

```bash
# 1. Deploy factory
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv

# 2. Create TodoList
forge script script/CreateTodoList.s.sol:CreateTodoListScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv

# 3. Create sample todos
forge script script/CreateSampleTodos.s.sol:CreateSampleTodosScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

### Step 6: Verify Deployment

After deployment, verify everything worked:

```bash
# Check deployment files
ls -la deployments/84532/

# Get contract addresses
FACTORY_ADDRESS=$(jq -r '.factory' deployments/84532/TodoListFactory.json)
DEPLOYER_ADDRESS=$(cast wallet address $BASE_PRIVATE_KEY)
TODOLIST_ADDRESS=$(jq -r '.todoList' "deployments/84532/TodoList-${DEPLOYER_ADDRESS}.json")

# View on explorer
echo "Factory: https://sepolia.basescan.org/address/$FACTORY_ADDRESS"
echo "TodoList: https://sepolia.basescan.org/address/$TODOLIST_ADDRESS"

# Test contract interaction
cast call $TODOLIST_ADDRESS "todoCount()(uint256)" --rpc-url base_sepolia
```

## What Gets Deployed

### 1. TodoListFactory Contract

- **Purpose**: Factory for creating TodoList instances
- **Owner**: Your deployer address
- **Functions**: `createTodoList()`, `getTodoList()`, etc.
- **Verified**: Yes (automatically with `--verify` flag)

### 2. TodoList Contract

- **Purpose**: Your personal todo list on-chain
- **Owner**: Your deployer address
- **Functions**: `createTodo()`, `updateTodo()`, `deleteTodo()`, etc.
- **Initial State**: Empty (until sample todos are created)

### 3. Sample Todos

5 sample todo items:

1. "Deploy smart contracts to Base mainnet" (High priority)
2. "Write comprehensive documentation" (Medium priority)
3. "Set up monitoring and alerts" (Low priority)
4. "Conduct security audit" (High priority)
5. "Migrate from Hardhat to Foundry" (Medium priority, completed)

## Deployment Artifacts

All deployment information is saved in `deployments/84532/`:

```text
deployments/84532/
├── TodoListFactory.json          # Factory deployment info
├── TodoList-<YOUR_ADDRESS>.json  # Your TodoList info
└── SampleTodos-<YOUR_ADDRESS>.json  # Sample todos info
```

Each file contains:

- Contract address
- Deployer address
- Chain ID
- Block number
- Timestamp

## Cost Estimate

Approximate gas costs on Base Sepolia:

| Operation       | Estimated Gas  | Approximate Cost |
| --------------- | -------------- | ---------------- |
| Deploy Factory  | ~1,500,000     | ~0.0015 ETH      |
| Create TodoList | ~500,000       | ~0.0005 ETH      |
| Create 5 Todos  | ~500,000       | ~0.0005 ETH      |
| **Total**       | **~2,500,000** | **~0.0025 ETH**  |

**Recommendation**: Have at least 0.01 ETH for safety margin.

## Troubleshooting

### "insufficient funds for gas"

**Problem**: Not enough Sepolia ETH in your account

**Solution**:

1. Get more Sepolia ETH: https://sepoliafaucet.com/
2. Bridge to Base Sepolia: https://bridge.base.org/
3. Verify balance: `cast balance <YOUR_ADDRESS> --rpc-url base_sepolia`

### "nonce too low"

**Problem**: Pending transaction or nonce mismatch

**Solution**:

1. Wait for pending transactions to complete
2. Check transaction status: `cast tx <TX_HASH> --rpc-url base_sepolia`
3. If stuck, try increasing gas price

### "Contract verification failed"

**Problem**: Basescan API key not configured or invalid

**Solution**:

1. Check `BASESCAN_API_KEY` in `.env`
2. Get new key: https://basescan.org/myapikey
3. Manually verify: `forge verify-contract <ADDRESS> <CONTRACT> --chain base-sepolia`

### "Factory address not found"

**Problem**: Factory not deployed yet

**Solution**:

1. Deploy factory first: `forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast --verify`
2. Check deployment file: `cat deployments/84532/TodoListFactory.json`

## After Deployment

Once deployed, you can:

1. **View on Explorer**:
   - Visit https://sepolia.basescan.org/
   - Search for your contract addresses
   - Use "Read Contract" and "Write Contract" tabs

2. **Interact via CLI**:

   ```bash
   # Read todos
   cast call <TODOLIST_ADDRESS> "getTodo(uint256)" 1 --rpc-url base_sepolia

   # Create new todo
   cast send <TODOLIST_ADDRESS> \
     "createTodo(string,string,uint8)" \
     "My todo" "Description" 1 \
     --private-key $BASE_PRIVATE_KEY \
     --rpc-url base_sepolia
   ```

3. **Integrate with Frontend**:
   - Use contract addresses from `deployments/84532/`
   - Import ABIs from `out/` directory
   - Connect with ethers.js or web3.js

## Documentation Reference

- **Quick Start**: [QUICK_START.md](./QUICK_START.md) - 5-minute guide
- **Full Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comprehensive instructions
- **Checklist**: [TESTNET_DEPLOYMENT_CHECKLIST.md](./TESTNET_DEPLOYMENT_CHECKLIST.md) - Task verification
- **README**: [README.md](./README.md) - Project overview and commands

## Support

Need help?

- Base Discord: https://discord.gg/buildonbase
- Base Docs: https://docs.base.org/
- Foundry Book: https://book.getfoundry.sh/
- Base Sepolia Explorer: https://sepolia.basescan.org/

## Security Reminders

- ✅ Never commit `.env` to version control
- ✅ Use separate wallet for testnet
- ✅ Verify contracts on block explorer
- ✅ Test thoroughly before mainnet
- ✅ Keep private keys secure
- ✅ Use hardware wallet for mainnet

## Next Steps

After successful testnet deployment:

1. ✅ Mark task 8 as complete
2. ➡️ Proceed to task 9: Update package.json scripts
3. ➡️ Continue with remaining migration tasks
4. ➡️ Eventually deploy to Base mainnet
