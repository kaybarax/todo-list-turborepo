#!/bin/bash

# Blockchain contracts deployment script
# Handles deployment across multiple networks with proper validation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# shellcheck disable=SC2329
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
ENVIRONMENT="${ENVIRONMENT:-development}"
NETWORK="${NETWORK:-all}"
VERIFY_CONTRACTS="${VERIFY_CONTRACTS:-false}"
DRY_RUN="${DRY_RUN:-false}"

print_status "Starting blockchain contracts deployment..."
print_status "Environment: $ENVIRONMENT"
print_status "Network: $NETWORK"

# Function to validate environment variables
validate_environment() {
    local network
    network=$1
    local required_vars
    required_vars=()
    
    case $network in
        polygon)
            case $ENVIRONMENT in
                development)
                    required_vars=("POLYGON_LOCAL_RPC_URL")
                    ;;
                staging)
                    required_vars=("POLYGON_MUMBAI_RPC_URL" "POLYGON_PRIVATE_KEY")
                    ;;
                production)
                    required_vars=("POLYGON_MAINNET_RPC_URL" "POLYGON_PRIVATE_KEY" "ETHERSCAN_API_KEY")
                    ;;
            esac
            ;;
        solana)
            case $ENVIRONMENT in
                development)
                    required_vars=("SOLANA_LOCAL_RPC_URL")
                    ;;
                staging)
                    required_vars=("SOLANA_DEVNET_RPC_URL")
                    ;;
                production)
                    required_vars=("SOLANA_MAINNET_RPC_URL")
                    ;;
            esac
            ;;
        polkadot)
            case $ENVIRONMENT in
                development)
                    required_vars=("POLKADOT_LOCAL_RPC_URL")
                    ;;
                staging)
                    required_vars=("POLKADOT_WESTEND_RPC_URL")
                    ;;
                production)
                    required_vars=("POLKADOT_MAINNET_RPC_URL")
                    ;;
            esac
            ;;
        moonbeam)
            case $ENVIRONMENT in
                development)
                    required_vars=("MOONBEAM_LOCAL_RPC_URL")
                    ;;
                staging)
                    required_vars=("MOONBEAM_TESTNET_RPC_URL" "MOONBEAM_PRIVATE_KEY")
                    ;;
                production)
                    required_vars=("MOONBEAM_MAINNET_RPC_URL" "MOONBEAM_PRIVATE_KEY" "MOONBEAM_API_KEY")
                    ;;
            esac
            ;;
        base)
            case $ENVIRONMENT in
                development)
                    required_vars=("BASE_LOCAL_RPC_URL")
                    ;;
                staging)
                    required_vars=("BASE_TESTNET_RPC_URL" "BASE_PRIVATE_KEY")
                    ;;
                production)
                    required_vars=("BASE_MAINNET_RPC_URL" "BASE_PRIVATE_KEY" "BASESCAN_API_KEY")
                    ;;
            esac
            ;;
    esac
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set for $network $ENVIRONMENT deployment"
            return 1
        fi
    done
    
    return 0
}

# Function to deploy Polygon contracts
deploy_polygon() {
    print_status "Deploying Polygon contracts..."
    
    if ! validate_environment "polygon"; then
        return 1
    fi
    
    cd apps/smart-contracts/polygon
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi
    
    # Compile contracts
    print_status "Compiling Polygon contracts..."
    pnpm compile
    
    case $ENVIRONMENT in
        development)
            print_status "Deploying to local Hardhat network..."
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to localhost:8545"
            else
                pnpm deploy:local
            fi
            ;;
        staging)
            print_status "Deploying to Polygon Mumbai testnet..."
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Mumbai testnet"
            else
                pnpm deploy:mumbai
                
                if [ "$VERIFY_CONTRACTS" = "true" ]; then
                    print_status "Verifying contracts on Mumbai..."
                    pnpm verify:mumbai || print_warning "Contract verification failed"
                fi
            fi
            ;;
        production)
            print_status "Deploying to Polygon mainnet..."
            print_warning "Production deployment requires manual confirmation"
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Polygon mainnet"
            else
                read -r -p "Are you sure you want to deploy to Polygon mainnet? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    pnpm deploy:mainnet
                    
                    if [ "$VERIFY_CONTRACTS" = "true" ]; then
                        print_status "Verifying contracts on Polygonscan..."
                        pnpm verify:mainnet || print_warning "Contract verification failed"
                    fi
                else
                    print_warning "Polygon mainnet deployment cancelled"
                fi
            fi
            ;;
    esac
    
    # Save deployment artifacts
    if [ -d "deployments" ]; then
        deployment_dir="../../../build/contracts/polygon/$ENVIRONMENT"
        mkdir -p "$deployment_dir"
        cp -r deployments/* "$deployment_dir/"
        print_success "Polygon deployment artifacts saved to $deployment_dir"
    fi
    
    cd ../../..
    print_success "Polygon contracts deployment completed"
}

# Function to deploy Solana programs
deploy_solana() {
    print_status "Deploying Solana programs..."
    
    if ! validate_environment "solana"; then
        return 1
    fi
    
    # Check if Solana CLI is available
    if ! command -v solana &> /dev/null; then
        print_error "Solana CLI not found. Please install Solana CLI first."
        return 1
    fi
    
    # Check if Anchor is available
    if ! command -v anchor &> /dev/null; then
        print_error "Anchor CLI not found. Please install Anchor CLI first."
        return 1
    fi
    
    cd apps/smart-contracts/solana
    
    case $ENVIRONMENT in
        development)
            print_status "Deploying to local Solana validator..."
            solana config set --url localhost
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to local validator"
            else
                # Check if local validator is running
                if ! solana cluster-version &> /dev/null; then
                    print_error "Local Solana validator is not running. Start with: solana-test-validator"
                    cd ../../..
                    return 1
                fi
                
                anchor deploy
            fi
            ;;
        staging)
            print_status "Deploying to Solana devnet..."
            solana config set --url devnet
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Solana devnet"
            else
                anchor deploy --provider.cluster devnet
            fi
            ;;
        production)
            print_status "Deploying to Solana mainnet..."
            print_warning "Production deployment requires manual confirmation"
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Solana mainnet"
            else
                read -r -p "Are you sure you want to deploy to Solana mainnet? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    solana config set --url mainnet-beta
                    anchor deploy --provider.cluster mainnet-beta
                else
                    print_warning "Solana mainnet deployment cancelled"
                fi
            fi
            ;;
    esac
    
    # Save deployment artifacts
    if [ -d "target/deploy" ]; then
        deployment_dir="../../../build/contracts/solana/$ENVIRONMENT"
        mkdir -p "$deployment_dir"
        cp -r target/deploy/* "$deployment_dir/"
        cp -r target/idl/* "$deployment_dir/" 2>/dev/null || true
        print_success "Solana deployment artifacts saved to $deployment_dir"
    fi
    
    cd ../../..
    print_success "Solana programs deployment completed"
}

# Function to deploy Polkadot pallets
deploy_polkadot() {
    print_status "Deploying Polkadot pallets..."
    
    if ! validate_environment "polkadot"; then
        return 1
    fi
    
    # Check if Rust/Cargo is available
    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo not found. Please install Rust first."
        return 1
    fi
    
    cd apps/smart-contracts/polkadot
    
    # Build the runtime
    print_status "Building Polkadot runtime..."
    cargo build --release
    
    case $ENVIRONMENT in
        development)
            print_status "Starting local Polkadot node..."
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would start local Polkadot node"
            else
                # Start local node in background
                ./target/release/node-template --dev --tmp &
                NODE_PID=$!
                
                # Wait for node to start
                sleep 10
                
                print_success "Local Polkadot node started (PID: $NODE_PID)"
                print_status "Node is running at ws://localhost:9944"
                
                # Save PID for cleanup
                echo $NODE_PID > /tmp/polkadot-node.pid
            fi
            ;;
        staging)
            print_status "Connecting to Westend testnet..."
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would connect to Westend testnet"
            else
                print_status "Westend testnet connection configured"
                print_status "Runtime can be deployed via governance proposal"
            fi
            ;;
        production)
            print_status "Preparing for Polkadot mainnet deployment..."
            print_warning "Polkadot mainnet deployment requires governance approval"
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would prepare mainnet deployment"
            else
                print_status "Runtime built and ready for governance proposal"
                print_status "Submit runtime upgrade proposal through governance"
            fi
            ;;
    esac
    
    # Save deployment artifacts
    if [ -f "target/release/node-template" ]; then
        deployment_dir="../../../build/contracts/polkadot/$ENVIRONMENT"
        mkdir -p "$deployment_dir"
        cp target/release/node-template "$deployment_dir/"
        cp -r runtime/src/* "$deployment_dir/runtime/" 2>/dev/null || true
        print_success "Polkadot deployment artifacts saved to $deployment_dir"
    fi
    
    cd ../../..
    print_success "Polkadot pallets deployment completed"
}

# Function to deploy Moonbeam contracts
deploy_moonbeam() {
    print_status "Deploying Moonbeam contracts..."
    
    if ! validate_environment "moonbeam"; then
        return 1
    fi
    
    cd apps/smart-contracts/moonbeam
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi
    
    # Compile contracts
    print_status "Compiling Moonbeam contracts..."
    pnpm compile
    
    case $ENVIRONMENT in
        development)
            print_status "Deploying to local Hardhat network..."
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to localhost:8545"
            else
                pnpm deploy:local
            fi
            ;;
        staging)
            print_status "Deploying to Moonbase Alpha testnet..."
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Moonbase Alpha testnet"
            else
                pnpm deploy:testnet
                
                if [ "$VERIFY_CONTRACTS" = "true" ]; then
                    print_status "Verifying contracts on Moonbase Alpha..."
                    pnpm verify:testnet || print_warning "Contract verification failed"
                fi
            fi
            ;;
        production)
            print_status "Deploying to Moonbeam mainnet..."
            print_warning "Production deployment requires manual confirmation"
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Moonbeam mainnet"
            else
                read -r -p "Are you sure you want to deploy to Moonbeam mainnet? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    pnpm deploy:mainnet
                    
                    if [ "$VERIFY_CONTRACTS" = "true" ]; then
                        print_status "Verifying contracts on Moonscan..."
                        pnpm verify:mainnet || print_warning "Contract verification failed"
                    fi
                else
                    print_warning "Moonbeam mainnet deployment cancelled"
                fi
            fi
            ;;
    esac
    
    # Save deployment artifacts
    if [ -d "deployments" ]; then
        deployment_dir="../../../build/contracts/moonbeam/$ENVIRONMENT"
        mkdir -p "$deployment_dir"
        cp -r deployments/* "$deployment_dir/"
        print_success "Moonbeam deployment artifacts saved to $deployment_dir"
    fi
    
    cd ../../..
    print_success "Moonbeam contracts deployment completed"
}

# Function to deploy Base contracts
deploy_base() {
    print_status "Deploying Base contracts..."
    
    if ! validate_environment "base"; then
        return 1
    fi
    
    cd apps/smart-contracts/base
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        pnpm install
    fi
    
    # Compile contracts
    print_status "Compiling Base contracts..."
    pnpm compile
    
    case $ENVIRONMENT in
        development)
            print_status "Deploying to local Hardhat network..."
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to localhost:8545"
            else
                pnpm deploy:local
            fi
            ;;
        staging)
            print_status "Deploying to Base Sepolia testnet..."
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Base Sepolia testnet"
            else
                pnpm deploy:testnet
                
                if [ "$VERIFY_CONTRACTS" = "true" ]; then
                    print_status "Verifying contracts on Base Sepolia..."
                    pnpm verify:testnet || print_warning "Contract verification failed"
                fi
            fi
            ;;
        production)
            print_status "Deploying to Base mainnet..."
            print_warning "Production deployment requires manual confirmation"
            
            if [ "$DRY_RUN" = "true" ]; then
                print_status "DRY RUN: Would deploy to Base mainnet"
            else
                read -r -p "Are you sure you want to deploy to Base mainnet? (yes/no): " confirm
                if [ "$confirm" = "yes" ]; then
                    pnpm deploy:mainnet
                    
                    if [ "$VERIFY_CONTRACTS" = "true" ]; then
                        print_status "Verifying contracts on Basescan..."
                        pnpm verify:mainnet || print_warning "Contract verification failed"
                    fi
                else
                    print_warning "Base mainnet deployment cancelled"
                fi
            fi
            ;;
    esac
    
    # Save deployment artifacts
    if [ -d "deployments" ]; then
        deployment_dir="../../../build/contracts/base/$ENVIRONMENT"
        mkdir -p "$deployment_dir"
        cp -r deployments/* "$deployment_dir/"
        print_success "Base deployment artifacts saved to $deployment_dir"
    fi
    
    cd ../../..
    print_success "Base contracts deployment completed"
}

# Function to update application configurations
update_app_configs() {
    print_status "Updating application configurations with contract addresses..."
    
    # Create contract addresses configuration
    config_file="build/contracts/addresses.json"
    mkdir -p "$(dirname "$config_file")"
    
    cat > "$config_file" << EOF
{
  "environment": "$ENVIRONMENT",
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "networks": {
EOF
    
    # Add Polygon addresses
    if [ -f "build/contracts/polygon/$ENVIRONMENT/TodoList.json" ]; then
        polygon_address=$(jq -r '.address' "build/contracts/polygon/$ENVIRONMENT/TodoList.json")
        cat >> "$config_file" << EOF
    "polygon": {
      "todoList": "$polygon_address",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "mainnet" || echo "mumbai")"
    },
EOF
    fi
    
    # Add Solana addresses
    if [ -f "build/contracts/solana/$ENVIRONMENT/todo_program.json" ]; then
        solana_program_id=$(jq -r '.programId' "build/contracts/solana/$ENVIRONMENT/todo_program.json" 2>/dev/null || echo "")
        if [ -n "$solana_program_id" ]; then
            cat >> "$config_file" << EOF
    "solana": {
      "todoProgram": "$solana_program_id",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "mainnet-beta" || echo "devnet")"
    },
EOF
        fi
    fi
    
    # Add Moonbeam addresses
    if [ -f "build/contracts/moonbeam/$ENVIRONMENT/TodoList.json" ]; then
        moonbeam_address=$(jq -r '.address' "build/contracts/moonbeam/$ENVIRONMENT/TodoList.json")
        cat >> "$config_file" << EOF
    "moonbeam": {
      "todoList": "$moonbeam_address",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "moonbeam" || echo "moonbase-alpha")"
    },
EOF
    fi
    
    # Add Base addresses
    if [ -f "build/contracts/base/$ENVIRONMENT/TodoList.json" ]; then
        base_address=$(jq -r '.address' "build/contracts/base/$ENVIRONMENT/TodoList.json")
        cat >> "$config_file" << EOF
    "base": {
      "todoList": "$base_address",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "base" || echo "base-sepolia")"
    },
EOF
    fi
    
    # Add Polkadot configuration
    cat >> "$config_file" << EOF
    "polkadot": {
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "polkadot" || echo "westend")",
      "endpoint": "$([ "$ENVIRONMENT" = "development" ] && echo "ws://localhost:9944" || echo "wss://westend-rpc.polkadot.io")"
    }
  }
}
EOF
    
    print_success "Contract addresses configuration saved to $config_file"
    
    # Update environment files
    if [ -f ".env.$ENVIRONMENT" ]; then
        print_status "Updating .env.$ENVIRONMENT with contract addresses..."
        
        # Add contract addresses to environment file
        if [ -n "$polygon_address" ]; then
            echo "POLYGON_TODO_CONTRACT_ADDRESS=$polygon_address" >> ".env.$ENVIRONMENT"
        fi
        
        if [ -n "$solana_program_id" ]; then
            echo "SOLANA_TODO_PROGRAM_ID=$solana_program_id" >> ".env.$ENVIRONMENT"
        fi
        
        if [ -n "$moonbeam_address" ]; then
            echo "MOONBEAM_TODO_CONTRACT_ADDRESS=$moonbeam_address" >> ".env.$ENVIRONMENT"
        fi
        
        if [ -n "$base_address" ]; then
            echo "BASE_TODO_CONTRACT_ADDRESS=$base_address" >> ".env.$ENVIRONMENT"
        fi
    fi
}

# Function to run post-deployment tests
run_deployment_tests() {
    print_status "Running post-deployment contract tests..."
    
    case $NETWORK in
        polygon|all)
            if [ -d "apps/smart-contracts/polygon" ]; then
                cd apps/smart-contracts/polygon
                pnpm test:deployment || print_warning "Polygon deployment tests failed"
                cd ../../..
            fi
            ;;
    esac
    
    case $NETWORK in
        solana|all)
            if [ -d "apps/smart-contracts/solana" ]; then
                cd apps/smart-contracts/solana
                anchor test --skip-local-validator || print_warning "Solana deployment tests failed"
                cd ../../..
            fi
            ;;
    esac
    
    case $NETWORK in
        moonbeam|all)
            if [ -d "apps/smart-contracts/moonbeam" ]; then
                cd apps/smart-contracts/moonbeam
                pnpm test:deployment || print_warning "Moonbeam deployment tests failed"
                cd ../../..
            fi
            ;;
    esac
    
    case $NETWORK in
        base|all)
            if [ -d "apps/smart-contracts/base" ]; then
                cd apps/smart-contracts/base
                pnpm test:deployment || print_warning "Base deployment tests failed"
                cd ../../..
            fi
            ;;
    esac
    
    print_success "Post-deployment tests completed"
}

# Function to generate deployment report
generate_deployment_report() {
    print_status "Generating contract deployment report..."
    
    report_file="contract-deployment-report-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "network": "$NETWORK",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "deployedContracts": {
EOF
    
    # Add deployed contract information
    first_entry=true
    
    if [ -f "build/contracts/polygon/$ENVIRONMENT/TodoList.json" ]; then
        if [ "$first_entry" = "false" ]; then echo "," >> "$report_file"; fi
        polygon_address=$(jq -r '.address' "build/contracts/polygon/$ENVIRONMENT/TodoList.json")
        cat >> "$report_file" << EOF
    "polygon": {
      "todoList": "$polygon_address",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "mainnet" || echo "mumbai")",
      "verified": $([ "$VERIFY_CONTRACTS" = "true" ] && echo "true" || echo "false")
    }
EOF
        first_entry=false
    fi
    
    if [ -f "build/contracts/solana/$ENVIRONMENT/todo_program.json" ]; then
        if [ "$first_entry" = "false" ]; then echo "," >> "$report_file"; fi
        solana_program_id=$(jq -r '.programId' "build/contracts/solana/$ENVIRONMENT/todo_program.json" 2>/dev/null || echo "")
        cat >> "$report_file" << EOF
    "solana": {
      "todoProgram": "$solana_program_id",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "mainnet-beta" || echo "devnet")"
    }
EOF
        first_entry=false
    fi
    
    if [ -f "build/contracts/polkadot/$ENVIRONMENT/node-template" ]; then
        if [ "$first_entry" = "false" ]; then echo "," >> "$report_file"; fi
        cat >> "$report_file" << EOF
    "polkadot": {
      "runtime": "deployed",
      "network": "$([ "$ENVIRONMENT" = "production" ] && echo "polkadot" || echo "westend")"
    }
EOF
        first_entry=false
    fi
    
    cat >> "$report_file" << EOF
  }
}
EOF
    
    print_success "Deployment report generated: $report_file"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy blockchain contracts across multiple networks"
    echo ""
    echo "Options:"
    echo "  --environment ENV     Deployment environment (development, staging, production)"
    echo "  --network NETWORK     Target network (polygon, solana, polkadot, moonbeam, base, all)"
    echo "  --verify              Verify contracts on block explorers"
    echo "  --dry-run             Show what would be deployed without actually deploying"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  ENVIRONMENT           Deployment environment"
    echo "  NETWORK              Target network"
    echo "  VERIFY_CONTRACTS     Verify contracts (true/false)"
    echo "  DRY_RUN              Dry run mode (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy all contracts to development"
    echo "  $0 --environment staging              # Deploy to staging testnets"
    echo "  $0 --network polygon --verify         # Deploy only Polygon with verification"
    echo "  $0 --dry-run --environment production # Dry run for production"
}

# Main deployment function
main_deploy() {
    print_status "Starting blockchain contracts deployment..."
    
    local start_time
    start_time=$(date +%s)
    
    # Create build directory
    mkdir -p build/contracts
    
    # Deploy based on network selection
    case $NETWORK in
        polygon)
            deploy_polygon
            ;;
        solana)
            deploy_solana
            ;;
        polkadot)
            deploy_polkadot
            ;;
        moonbeam)
            deploy_moonbeam
            ;;
        base)
            deploy_base
            ;;
        all)
            deploy_polygon || print_warning "Polygon deployment failed"
            deploy_solana || print_warning "Solana deployment failed"
            deploy_polkadot || print_warning "Polkadot deployment failed"
            deploy_moonbeam || print_warning "Moonbeam deployment failed"
            deploy_base || print_warning "Base deployment failed"
            ;;
        *)
            print_error "Unknown network: $NETWORK"
            show_help
            exit 1
            ;;
    esac
    
    update_app_configs
    run_deployment_tests
    generate_deployment_report
    
    local end_time
    end_time=$(date +%s)
    local duration
    duration=$((end_time - start_time))
    
    print_success "Contract deployment completed successfully in ${duration}s"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --network)
            NETWORK="$2"
            shift 2
            ;;
        --verify)
            VERIFY_CONTRACTS="true"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute main deployment
main_deploy