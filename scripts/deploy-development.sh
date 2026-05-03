#!/bin/bash

# Development environment deployment script
# Optimized for local development with Docker Compose

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
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

print_status "Starting development environment deployment..."

# Configuration for development
export ENVIRONMENT=development
export DEPLOY_CONTRACTS=true
export DEPLOY_MONITORING=true
export SKIP_BUILD=false

# Check if Docker is running
if ! docker info &> /dev/null; then
    print_warning "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Stop any existing services
print_status "Stopping existing services..."
docker compose -f docker-compose.dev.yml down || true

# Build applications
print_status "Building applications for development..."
pnpm build:quick

# Start database services first
print_status "Starting database services..."
docker compose -f docker-compose.dev.yml up -d mongodb redis

# Wait for databases to be ready
print_status "Waiting for databases to be ready..."
sleep 10

# Setup database
print_status "Setting up database with sample data..."
pnpm db:setup

# Start all services
print_status "Starting all development services..."
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 15

# Deploy contracts to local networks
print_status "Deploying contracts to local test networks..."
./scripts/build-contracts.sh --network all || print_warning "Contract deployment failed"

# Verify deployment
print_status "Verifying development deployment..."

# Check service health
services=("mongodb:27017" "redis:6379" "api:3001" "web:3000")
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if nc -z localhost "$port" 2>/dev/null; then
        print_success "$name is running on port $port"
    else
        print_warning "$name is not responding on port $port"
    fi
done

print_success "Development environment deployed successfully!"

echo ""
echo "🌐 Development URLs:"
echo "  Web App:          http://localhost:3000"
echo "  API:              http://localhost:3001"
echo "  API Docs:         http://localhost:3001/api"
echo "  Mobile (Expo):    http://localhost:19000"
echo "  Jaeger Tracing:   http://localhost:16686"
echo "  MailHog:          http://localhost:8025"
echo ""
echo "💾 Database Access:"
echo "  MongoDB:          mongodb://admin:password@localhost:27017/todo-app?authSource=admin"
echo "  Redis:            redis://localhost:6379"
echo ""
echo "🔧 Development Commands:"
echo "  Start dev servers: pnpm dev"
echo "  View logs:         docker compose -f docker-compose.dev.yml logs -f"
echo "  Stop services:     docker compose -f docker-compose.dev.yml down"
echo "  Reset database:    pnpm db:reset"
echo ""
echo "🎉 Happy coding!"