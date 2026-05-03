#!/bin/bash

# Script to test the complete deployment workflow on Base Sepolia
# This script performs all deployment steps in sequence

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "Base Sepolia Deployment Test"
echo "=========================================="
echo ""

# Check if .env exists and is configured
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file from .env.example and configure it"
    exit 1
fi

source .env

if [ -z "$BASE_PRIVATE_KEY" ] || [ "$BASE_PRIVATE_KEY" = "your_private_key_here_without_0x_prefix" ]; then
    echo -e "${RED}Error: BASE_PRIVATE_KEY not configured${NC}"
    echo "Please set your private key in .env file"
    exit 1
fi

# Get deployer address
DEPLOYER_ADDRESS=$(cast wallet address $BASE_PRIVATE_KEY)
echo -e "${BLUE}Deployer address:${NC} $DEPLOYER_ADDRESS"
echo ""

# Step 1: Verify setup
echo -e "${BLUE}Step 1: Verifying setup...${NC}"
if ./verify-setup.sh; then
    echo -e "${GREEN}✓ Setup verification passed${NC}"
else
    echo -e "${RED}✗ Setup verification failed${NC}"
    exit 1
fi

echo ""
read -p "Press Enter to continue with deployment..."
echo ""

# Step 2: Deploy TodoListFactory
echo "=========================================="
echo -e "${BLUE}Step 2: Deploying TodoListFactory...${NC}"
echo "=========================================="
echo ""

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ TodoListFactory deployed successfully${NC}"
    
    # Read factory address from deployment file
    FACTORY_ADDRESS=$(jq -r '.factory' deployments/84532/TodoListFactory.json)
    echo -e "${BLUE}Factory address:${NC} $FACTORY_ADDRESS"
    echo -e "${BLUE}View on explorer:${NC} https://sepolia.basescan.org/address/$FACTORY_ADDRESS"
else
    echo -e "${RED}✗ Factory deployment failed${NC}"
    exit 1
fi

echo ""
read -p "Press Enter to continue with TodoList creation..."
echo ""

# Step 3: Create TodoList
echo "=========================================="
echo -e "${BLUE}Step 3: Creating TodoList instance...${NC}"
echo "=========================================="
echo ""

forge script script/CreateTodoList.s.sol:CreateTodoListScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ TodoList created successfully${NC}"
    
    # Read TodoList address from deployment file
    TODOLIST_FILE="deployments/84532/TodoList-${DEPLOYER_ADDRESS}.json"
    if [ -f "$TODOLIST_FILE" ]; then
        TODOLIST_ADDRESS=$(jq -r '.todoList' "$TODOLIST_FILE")
        echo -e "${BLUE}TodoList address:${NC} $TODOLIST_ADDRESS"
        echo -e "${BLUE}View on explorer:${NC} https://sepolia.basescan.org/address/$TODOLIST_ADDRESS"
    fi
else
    echo -e "${RED}✗ TodoList creation failed${NC}"
    exit 1
fi

echo ""
read -p "Press Enter to continue with sample todos creation..."
echo ""

# Step 4: Create sample todos
echo "=========================================="
echo -e "${BLUE}Step 4: Creating sample todos...${NC}"
echo "=========================================="
echo ""

forge script script/CreateSampleTodos.s.sol:CreateSampleTodosScript \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Sample todos created successfully${NC}"
else
    echo -e "${RED}✗ Sample todos creation failed${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Test Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo -e "  ${BLUE}Factory:${NC}  $FACTORY_ADDRESS"
echo -e "  ${BLUE}TodoList:${NC} $TODOLIST_ADDRESS"
echo ""
echo "View on Base Sepolia Explorer:"
echo "  Factory:  https://sepolia.basescan.org/address/$FACTORY_ADDRESS"
echo "  TodoList: https://sepolia.basescan.org/address/$TODOLIST_ADDRESS"
echo ""
echo "Deployment files saved in: deployments/84532/"
echo ""

# Step 5: Verify contract interaction
echo "=========================================="
echo -e "${BLUE}Step 5: Verifying contract interaction...${NC}"
echo "=========================================="
echo ""

echo "Getting todo count..."
TODO_COUNT=$(cast call $TODOLIST_ADDRESS "todoCount()(uint256)" --rpc-url base_sepolia)
echo -e "${GREEN}✓${NC} Todo count: $TODO_COUNT"

echo ""
echo "Getting todo statistics..."
STATS=$(cast call $TODOLIST_ADDRESS "getTodoStats()((uint256,uint256,uint256,uint256))" --rpc-url base_sepolia)
echo -e "${GREEN}✓${NC} Stats: $STATS"

echo ""
echo "Getting first todo..."
TODO_1=$(cast call $TODOLIST_ADDRESS "getTodo(uint256)((uint256,string,string,bool,uint8,uint256,uint256))" 1 --rpc-url base_sepolia)
echo -e "${GREEN}✓${NC} Todo #1 retrieved successfully"

echo ""
echo "=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=========================================="
echo ""
echo "Your contracts are deployed and working on Base Sepolia testnet."
echo ""
