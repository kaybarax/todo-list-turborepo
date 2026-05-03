#!/bin/bash

# Script to verify Base Sepolia deployment setup
# This checks that all prerequisites are met before deployment

set -euo pipefail

echo "=========================================="
echo "Base Sepolia Deployment Setup Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
echo "1. Checking .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Source the .env file
    # shellcheck disable=SC1091
source .env
    
    # Check if required variables are set
    if [ -z "$BASE_PRIVATE_KEY" ] || [ "$BASE_PRIVATE_KEY" = "your_private_key_here_without_0x_prefix" ]; then
        echo -e "${RED}✗${NC} BASE_PRIVATE_KEY not configured in .env"
        echo "  Please set your private key in .env file"
        exit 1
    else
        echo -e "${GREEN}✓${NC} BASE_PRIVATE_KEY is configured"
    fi
    
    if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
        echo -e "${RED}✗${NC} BASE_SEPOLIA_RPC_URL not configured in .env"
        exit 1
    else
        echo -e "${GREEN}✓${NC} BASE_SEPOLIA_RPC_URL is configured"
    fi
    
    if [ -z "$BASESCAN_API_KEY" ] || [ "$BASESCAN_API_KEY" = "your_basescan_api_key_here" ]; then
        echo -e "${YELLOW}⚠${NC} BASESCAN_API_KEY not configured (contract verification will fail)"
        echo "  Get your API key from: https://basescan.org/myapikey"
    else
        echo -e "${GREEN}✓${NC} BASESCAN_API_KEY is configured"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "  Please copy .env.example to .env and configure it"
    exit 1
fi

echo ""
echo "2. Checking Foundry installation..."
if command -v forge &> /dev/null; then
    FORGE_VERSION=$(forge --version | head -n 1)
    echo -e "${GREEN}✓${NC} Foundry is installed: $FORGE_VERSION"
else
    echo -e "${RED}✗${NC} Foundry is not installed"
    echo "  Install with: curl -L https://foundry.paradigm.xyz | bash && foundryup"
    exit 1
fi

echo ""
echo "3. Checking RPC connection..."
CHAIN_ID=$(cast chain-id --rpc-url "$BASE_SEPOLIA_RPC_URL" 2>/dev/null || echo "failed")
if [ "$CHAIN_ID" = "84532" ]; then
    echo -e "${GREEN}✓${NC} Connected to Base Sepolia (Chain ID: 84532)"
else
    echo -e "${RED}✗${NC} Failed to connect to Base Sepolia RPC"
    echo "  Chain ID returned: $CHAIN_ID"
    echo "  Check your BASE_SEPOLIA_RPC_URL in .env"
    exit 1
fi

echo ""
echo "4. Checking deployer account..."
DEPLOYER_ADDRESS=$(cast wallet address "$BASE_PRIVATE_KEY" 2>/dev/null || echo "failed")
if [ "$DEPLOYER_ADDRESS" = "failed" ]; then
    echo -e "${RED}✗${NC} Failed to derive address from private key"
    echo "  Check your BASE_PRIVATE_KEY in .env"
    exit 1
else
    echo -e "${GREEN}✓${NC} Deployer address: $DEPLOYER_ADDRESS"
fi

echo ""
echo "5. Checking account balance..."
BALANCE=$(cast balance "$DEPLOYER_ADDRESS" --rpc-url "$BASE_SEPOLIA_RPC_URL" 2>/dev/null || echo "0")
BALANCE_ETH=$(cast --to-unit "$BALANCE" ether 2>/dev/null || echo "0")

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}✗${NC} Account has no Sepolia ETH"
    echo "  Get Sepolia ETH from: https://sepoliafaucet.com/"
    echo "  Then bridge to Base Sepolia: https://bridge.base.org/"
    exit 1
else
    echo -e "${GREEN}✓${NC} Account balance: $BALANCE_ETH ETH"
    
    # Check if balance is sufficient (at least 0.01 ETH recommended)
    # shellcheck disable=SC2001
    BALANCE_WEI=$(echo "$BALANCE" | sed 's/[^0-9]//g')
    MIN_BALANCE="10000000000000000" # 0.01 ETH in wei
    
    if [ "$BALANCE_WEI" -lt "$MIN_BALANCE" ]; then
        echo -e "${YELLOW}⚠${NC} Balance is low. Recommended: at least 0.01 ETH for deployment"
    fi
fi

echo ""
echo "6. Checking contract compilation..."
if forge build --silent 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Contracts compile successfully"
else
    echo -e "${RED}✗${NC} Contract compilation failed"
    echo "  Run 'forge build' to see detailed errors"
    exit 1
fi

echo ""
echo "7. Checking deployment directory..."
if [ ! -d "deployments" ]; then
    mkdir -p deployments/84532
    echo -e "${GREEN}✓${NC} Created deployments directory"
else
    echo -e "${GREEN}✓${NC} Deployments directory exists"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All checks passed!${NC}"
echo "=========================================="
echo ""
echo "You are ready to deploy to Base Sepolia testnet."
echo ""
echo "Next steps:"
echo "  1. Deploy factory:     forge script script/Deploy.s.sol:DeployScript --rpc-url base_sepolia --broadcast --verify"
echo "  2. Create TodoList:    forge script script/CreateTodoList.s.sol:CreateTodoListScript --rpc-url base_sepolia --broadcast"
echo "  3. Create sample todos: forge script script/CreateSampleTodos.s.sol:CreateSampleTodosScript --rpc-url base_sepolia --broadcast"
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""
