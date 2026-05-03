#!/bin/bash

# Blockchain development script
# Starts blockchain development environment with local networks

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

print_status "Starting blockchain development environment..."

# Configuration
NETWORK="${NETWORK:-all}"
DEPLOY_CONTRACTS="${DEPLOY_CONTRACTS:-true}"

# Check prerequisites
print_status "Checking blockchain development prerequisites..."

# Check if required tools are available
tools_available=true

if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    tools_available=false
fi

if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "solana" ]; then
    if ! command -v solana &> /dev/null; then
        print_warning "Solana CLI not found - Solana development will be limited"
    fi
    
    if ! command -v anchor &> /dev/null; then
        print_warning "Anchor CLI not found - Solana program development will be limited"
    fi
fi

if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polkadot" ]; then
    if ! command -v cargo &> /dev/null; then
        print_warning "Rust/Cargo not found - Polkadot development will be limited"
    fi
fi

if [ "$tools_available" = "false" ]; then
    print_error "Required tools are missing. Please install them first."
    exit 1
fi

# Start Hardhat node for Polygon development
if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polygon" ]; then
    print_status "Starting Hardhat node for Polygon development..."
    
    cd apps/smart-contracts/polygon
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing Polygon contract dependencies..."
        pnpm install
    fi
    
    # Start Hardhat node in background
    print_status "Starting Hardhat local network..."
    pnpm hardhat:node &
    HARDHAT_PID=$!
    
    # Wait for Hardhat node to be ready
    print_status "Waiting for Hardhat node to be ready..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost 8545 2>/dev/null; then
            print_success "Hardhat node is ready on port 8545"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "Hardhat node failed to start"
            kill "$HARDHAT_PID" 2>/dev/null || true
            cd ../../..
            exit 1
        fi
        
        sleep 2
        ((attempt++))
    done
    
    cd ../../..
fi

# Start Solana test validator
if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "solana" ]; then
    if command -v solana-test-validator &> /dev/null; then
        print_status "Starting Solana test validator..."
        
        # Configure Solana for local development
        solana config set --url localhost
        
        # Start test validator in background
        solana-test-validator --reset &
        SOLANA_PID=$!
        
        # Wait for Solana validator to be ready
        print_status "Waiting for Solana validator to be ready..."
        max_attempts=60
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if solana cluster-version &>/dev/null; then
                print_success "Solana test validator is ready"
                break
            fi
            
            if [ $attempt -eq $max_attempts ]; then
                print_warning "Solana test validator may not be ready"
                break
            fi
            
            sleep 2
            ((attempt++))
        done
    else
        print_warning "solana-test-validator not found, skipping Solana local network"
    fi
fi

# Start Polkadot local node
if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polkadot" ]; then
    if [ -f "apps/smart-contracts/polkadot/target/release/node-template" ]; then
        print_status "Starting Polkadot local node..."
        
        cd apps/smart-contracts/polkadot
        
        # Start local node in background
        ./target/release/node-template --dev --tmp &
        POLKADOT_PID=$!
        
        # Wait for node to start
        sleep 10
        print_success "Polkadot local node started"
        
        cd ../../..
    else
        print_warning "Polkadot node binary not found. Build with: cd apps/smart-contracts/polkadot && cargo build --release"
    fi
fi

# Deploy contracts if requested
if [ "$DEPLOY_CONTRACTS" = "true" ]; then
    print_status "Deploying contracts to local networks..."
    
    # Wait a bit for networks to be fully ready
    sleep 5
    
    # Deploy contracts
    ./scripts/deploy-contracts.sh --environment development --network "$NETWORK" || print_warning "Contract deployment failed"
fi

# Function to handle shutdown
shutdown_handler() {
    print_status "Shutting down blockchain development environment..."
    
    # Stop all background processes
    if [ -n "$HARDHAT_PID" ]; then
        print_status "Stopping Hardhat node..."
        kill "$HARDHAT_PID" 2>/dev/null || true
    fi
    
    if [ -n "$SOLANA_PID" ]; then
        print_status "Stopping Solana test validator..."
        kill "$SOLANA_PID" 2>/dev/null || true
    fi
    
    if [ -n "$POLKADOT_PID" ]; then
        print_status "Stopping Polkadot local node..."
        kill "$POLKADOT_PID" 2>/dev/null || true
    fi
    
    print_success "Blockchain development environment stopped"
    exit 0
}

trap shutdown_handler SIGINT SIGTERM

print_success "Blockchain development environment ready!"

echo ""
echo "⛓️  Blockchain Networks:"
if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polygon" ]; then
    echo "  Polygon (Hardhat):    http://localhost:8545"
    echo "  Chain ID:             31337"
fi

if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "solana" ]; then
    if command -v solana &> /dev/null; then
        echo "  Solana (Local):       http://localhost:8899"
        echo "  WebSocket:            ws://localhost:8900"
    fi
fi

if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polkadot" ]; then
    echo "  Polkadot (Local):     ws://localhost:9944"
    echo "  HTTP:                 http://localhost:9933"
fi

echo ""
echo "🔧 Development Tools:"
if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polygon" ]; then
    echo "  Hardhat Console:      cd apps/smart-contracts/polygon && pnpm hardhat console --network localhost"
    echo "  Deploy Polygon:       cd apps/smart-contracts/polygon && pnpm deploy:local"
fi

if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "solana" ]; then
    if command -v anchor &> /dev/null; then
        echo "  Anchor Test:          cd apps/smart-contracts/solana && anchor test --skip-local-validator"
        echo "  Deploy Solana:        cd apps/smart-contracts/solana && anchor deploy"
    fi
fi

if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polkadot" ]; then
    echo "  Polkadot Apps:        https://polkadot.js.org/apps/?rpc=ws://localhost:9944"
fi

echo ""
echo "📊 Monitoring:"
echo "  Network Status:       ./scripts/dev-blockchain.sh --status"
echo "  Contract Addresses:   cat build/contracts/addresses.json"
echo ""
echo "Press Ctrl+C to stop all blockchain services"

# Show network status
show_status() {
    echo ""
    print_status "Blockchain Network Status:"
    
    if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polygon" ]; then
        if nc -z localhost 8545 2>/dev/null; then
            echo "  ✅ Polygon (Hardhat) - http://localhost:8545"
        else
            echo "  ❌ Polygon (Hardhat) - Not running"
        fi
    fi
    
    if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "solana" ]; then
        if command -v solana &> /dev/null && solana cluster-version &>/dev/null; then
            echo "  ✅ Solana (Local) - http://localhost:8899"
        else
            echo "  ❌ Solana (Local) - Not running"
        fi
    fi
    
    if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polkadot" ]; then
        if nc -z localhost 9944 2>/dev/null; then
            echo "  ✅ Polkadot (Local) - ws://localhost:9944"
        else
            echo "  ❌ Polkadot (Local) - Not running"
        fi
    fi
}

# Handle status check
if [ "$1" = "--status" ]; then
    show_status
    exit 0
fi

# Monitor networks
while true; do
    sleep 30
    
    # Check if networks are still running
    if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polygon" ]; then
        if [ -n "$HARDHAT_PID" ] && ! kill -0 "$HARDHAT_PID" 2>/dev/null; then
            print_warning "Hardhat node stopped unexpectedly"
        fi
    fi
    
    if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "solana" ]; then
        if [ -n "$SOLANA_PID" ] && ! kill -0 "$SOLANA_PID" 2>/dev/null; then
            print_warning "Solana test validator stopped unexpectedly"
        fi
    fi
    
    if [ "$NETWORK" = "all" ] || [ "$NETWORK" = "polkadot" ]; then
        if [ -n "$POLKADOT_PID" ] && ! kill -0 "$POLKADOT_PID" 2>/dev/null; then
            print_warning "Polkadot local node stopped unexpectedly"
        fi
    fi
done