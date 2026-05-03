#!/bin/bash

# Frontend development script
# Starts web and mobile applications with shared infrastructure

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Starting frontend development environment..."

# Check if API is running
if ! nc -z localhost 3001 2>/dev/null; then
    print_warning "API server not detected on port 3001"
    print_status "Starting API server in background..."
    pnpm dev:api &
    API_PID=$!
    
    # Wait for API to be ready
    print_status "Waiting for API to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost 3001 2>/dev/null; then
            print_success "API server is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_warning "API server may not be ready, continuing anyway"
            break
        fi
        
        sleep 2
        ((attempt++))
    done
fi

# Start frontend applications
print_status "Starting frontend applications..."

# Function to handle shutdown
shutdown_handler() {
    print_status "Shutting down frontend development..."
    
    if [ -n "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    
    exit 0
}

trap shutdown_handler SIGINT SIGTERM

# Start web and mobile in parallel
pnpm turbo run dev --filter="@todo/web" --filter="@todo/mobile" --parallel

print_success "Frontend development environment ready!"

echo ""
echo "🌐 Frontend URLs:"
echo "  Web App:          http://localhost:3000"
echo "  Mobile (Expo):    http://localhost:19000"
echo "  API:              http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait