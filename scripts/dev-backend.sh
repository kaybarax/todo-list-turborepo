#!/bin/bash

# Backend development script
# Starts API and ingestion services with database dependencies

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting backend development environment..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start database services
print_status "Starting database services..."
docker compose -f docker-compose.dev.yml up -d mongodb redis

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
local max_attempts=30
local attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker compose -f docker-compose.dev.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
        print_success "MongoDB is ready"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "MongoDB failed to start within timeout"
        exit 1
    fi
    
    sleep 2
    ((attempt++))
done

# Check Redis
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker compose -f docker-compose.dev.yml exec -T redis redis-cli ping &>/dev/null; then
        print_success "Redis is ready"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Redis failed to start within timeout"
        exit 1
    fi
    
    sleep 2
    ((attempt++))
done

# Setup database if needed
print_status "Setting up database..."
sleep 2
pnpm db:setup || print_warning "Database setup failed, continuing anyway"

# Start monitoring services
print_status "Starting monitoring services..."
docker compose -f docker-compose.dev.yml up -d jaeger otel-collector

# Function to handle shutdown
shutdown_handler() {
    print_status "Shutting down backend development..."
    
    # Stop Docker services
    docker compose -f docker-compose.dev.yml down
    
    exit 0
}

trap shutdown_handler SIGINT SIGTERM

# Start backend services
print_status "Starting backend services..."
pnpm turbo run dev --filter="@todo/api" --filter="@todo/ingestion" --parallel

print_success "Backend development environment ready!"

echo ""
echo "🔧 Backend Services:"
echo "  API:              http://localhost:3001"
echo "  API Docs:         http://localhost:3001/api"
echo "  Ingestion:        Background service"
echo ""
echo "💾 Database Access:"
echo "  MongoDB:          mongodb://admin:password@localhost:27017/todo-app?authSource=admin"
echo "  Redis:            redis://localhost:6379"
echo ""
echo "📊 Monitoring:"
echo "  Jaeger Tracing:   http://localhost:16686"
echo "  Health Check:     curl http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait