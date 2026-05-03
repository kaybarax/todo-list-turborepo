#!/bin/bash

# Comprehensive development environment startup script
# Manages service dependencies and provides flexible development options

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
# shellcheck disable=SC2034
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICES="${SERVICES:-all}"
SKIP_DEPS="${SKIP_DEPS:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
WATCH_MODE="${WATCH_MODE:-true}"
PARALLEL="${PARALLEL:-true}"
VERBOSE="${VERBOSE:-false}"

# Function to print colored output
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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking development prerequisites..."
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    # Check if turbo is available
    if ! command -v turbo &> /dev/null && ! npx turbo --version &> /dev/null; then
        print_warning "Turbo not found globally, will use npx"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    if [ "$SKIP_DEPS" = "true" ]; then
        print_warning "Skipping dependency installation"
        return
    fi
    
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ] || [ ! -f "pnpm-lock.yaml" ]; then
        print_status "Installing workspace dependencies..."
        pnpm install --frozen-lockfile
    else
        print_status "Dependencies already installed, checking for updates..."
        pnpm install --frozen-lockfile --prefer-offline
    fi
    
    print_success "Dependencies installed"
}

# Function to build shared packages
build_packages() {
    if [ "$SKIP_BUILD" = "true" ]; then
        print_warning "Skipping package builds"
        return
    fi
    
    print_status "Building shared packages..."
    
    # Build packages in dependency order
    pnpm turbo run build --filter="./packages/*"
    
    print_success "Shared packages built"
}

# Function to start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    # Start database and cache services first
    print_status "Starting MongoDB and Redis..."
    docker compose -f docker-compose.dev.yml up -d mongodb redis
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    local max_attempts
    max_attempts=30
    local attempt
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Try mongosh first, then mongo (legacy)
        if docker compose -f docker-compose.dev.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null || \
           docker compose -f docker-compose.dev.yml exec -T mongodb mongo --eval "db.adminCommand('ping')" &>/dev/null; then
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
    
    # Start monitoring services
    print_status "Starting monitoring services..."
    docker compose -f docker-compose.dev.yml up -d jaeger otel-collector mailhog
    
    # Start blockchain development services if needed
    if [[ "$SERVICES" == *"contracts"* ]] || [ "$SERVICES" = "all" ]; then
        print_status "Starting blockchain development services..."
        docker compose -f docker-compose.dev.yml up -d hardhat-node
        
        # Wait for Hardhat node
        sleep 5
        if nc -z localhost 8545 2>/dev/null; then
            print_success "Hardhat node is ready"
        else
            print_warning "Hardhat node may not be ready"
        fi
    fi
    
    print_success "Infrastructure services started"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Wait a bit more for MongoDB to be fully ready
    sleep 5
    
    # Run database setup
    if pnpm db:setup; then
        print_success "Database setup completed"
    else
        print_warning "Database setup failed, continuing anyway"
    fi
}

# Function to start application services
start_applications() {
    print_status "Starting application services..."
    
    local turbo_cmd
    turbo_cmd="turbo run dev"
    local turbo_args
    turbo_args=""
    
    # Configure turbo arguments
    if [ "$PARALLEL" = "true" ]; then
        turbo_args="$turbo_args --parallel"
    fi
    
    if [ "$VERBOSE" = "true" ]; then
        turbo_args="$turbo_args --verbose"
    fi
    
    # Start services based on selection
    case $SERVICES in
        all)
            print_status "Starting all development servers..."
            if command -v turbo &> /dev/null; then
                # shellcheck disable=SC2086
                turbo $turbo_cmd $turbo_args
            else
                # shellcheck disable=SC2086
                npx turbo $turbo_cmd $turbo_args
            fi
            ;;
        api)
            print_status "Starting API server only..."
            pnpm dev:api
            ;;
        web)
            print_status "Starting web application only..."
            pnpm dev:web
            ;;
        mobile)
            print_status "Starting mobile application only..."
            pnpm dev:mobile
            ;;
        ingestion)
            print_status "Starting ingestion service only..."
            pnpm dev:ingestion
            ;;
        contracts)
            print_status "Starting contract development environment..."
            pnpm dev:contracts
            ;;
        frontend)
            print_status "Starting frontend applications (web + mobile)..."
            if command -v turbo &> /dev/null; then
                # shellcheck disable=SC2086
                turbo run dev --filter="@todo/web" --filter="@todo/mobile" $turbo_args
            else
                # shellcheck disable=SC2086
                npx turbo run dev --filter="@todo/web" --filter="@todo/mobile" $turbo_args
            fi
            ;;
        backend)
            print_status "Starting backend services (api + ingestion)..."
            if command -v turbo &> /dev/null; then
                # shellcheck disable=SC2086
                turbo run dev --filter="@todo/api" --filter="@todo/ingestion" $turbo_args
            else
                # shellcheck disable=SC2086
                npx turbo run dev --filter="@todo/api" --filter="@todo/ingestion" $turbo_args
            fi
            ;;
        *)
            print_error "Unknown service selection: $SERVICES"
            show_help
            exit 1
            ;;
    esac
}

# Function to show development URLs
show_development_urls() {
    print_status "Development environment is ready!"
    echo ""
    echo "🌐 Application URLs:"
    echo "  Web App:          http://localhost:3000"
    echo "  API:              http://localhost:3001"
    echo "  API Docs:         http://localhost:3001/api"
    echo "  Mobile (Expo):    http://localhost:8081"
    echo ""
    echo "🔧 Development Tools:"
    echo "  Jaeger Tracing:   http://localhost:16686"
    echo "  MailHog:          http://localhost:8025"
    echo "  Hardhat Console:  npx hardhat console --network localhost"
    echo ""
    echo "💾 Database Access:"
    echo "  MongoDB:          mongodb://admin:password@localhost:27017/todo-app?authSource=admin"
    echo "  Redis:            redis://localhost:6379"
    echo ""
    echo "📊 Monitoring:"
    echo "  Health Check:     curl http://localhost:3001/health"
    echo "  Metrics:          curl http://localhost:3001/metrics"
    echo ""
}

# Function to setup graceful shutdown
setup_shutdown() {
    print_status "Setting up graceful shutdown handlers..."
    
    # Function to handle shutdown
    shutdown_handler() {
        print_warning "Shutting down development environment..."
        
        # Stop application processes (they should be in background)
        if [ -n "$APP_PID" ]; then
            kill "$APP_PID" 2>/dev/null || true
        fi
        
        # Stop Docker services
        print_status "Stopping Docker services..."
        docker compose -f docker-compose.dev.yml down
        
        print_success "Development environment stopped"
        exit 0
    }
    
    # Trap signals for graceful shutdown
    trap shutdown_handler SIGINT SIGTERM
}

# Function to monitor services
monitor_services() {
    print_status "Monitoring services..."
    
    while true; do
        # Check if critical services are still running
        if ! docker compose -f docker-compose.dev.yml ps mongodb | grep -q "Up"; then
            print_error "MongoDB service stopped unexpectedly"
            break
        fi
        
        if ! docker compose -f docker-compose.dev.yml ps redis | grep -q "Up"; then
            print_error "Redis service stopped unexpectedly"
            break
        fi
        
        # Check application health
        if [ "$SERVICES" = "all" ] || [ "$SERVICES" = "api" ] || [ "$SERVICES" = "backend" ]; then
            if ! curl -f http://localhost:3001/health &>/dev/null; then
                print_warning "API health check failed"
            fi
        fi
        
        sleep 30
    done
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Start Todo App development environment with service dependency management"
    echo ""
    echo "Options:"
    echo "  --services SERVICES   Services to start (all, api, web, mobile, ingestion, contracts, frontend, backend)"
    echo "  --skip-deps          Skip dependency installation"
    echo "  --skip-build         Skip building shared packages"
    echo "  --no-watch           Disable watch mode"
    echo "  --no-parallel        Disable parallel execution"
    echo "  --verbose            Enable verbose output"
    echo "  --help               Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  SERVICES             Services to start (default: all)"
    echo "  SKIP_DEPS           Skip dependency installation (default: false)"
    echo "  SKIP_BUILD          Skip package builds (default: false)"
    echo "  WATCH_MODE          Enable watch mode (default: true)"
    echo "  PARALLEL            Enable parallel execution (default: true)"
    echo "  VERBOSE             Enable verbose output (default: false)"
    echo ""
    echo "Service Options:"
    echo "  all                 Start all services (default)"
    echo "  api                 Start only API server"
    echo "  web                 Start only web application"
    echo "  mobile              Start only mobile application"
    echo "  ingestion           Start only ingestion service"
    echo "  contracts           Start only contract development"
    echo "  frontend            Start web and mobile applications"
    echo "  backend             Start API and ingestion services"
    echo ""
    echo "Examples:"
    echo "  $0                              # Start all services"
    echo "  $0 --services frontend          # Start only frontend applications"
    echo "  $0 --services api --verbose     # Start API with verbose output"
    echo "  $0 --skip-deps --skip-build     # Quick start without deps/build"
}

# Function to show service status
show_service_status() {
    print_status "Service Status:"
    
    echo "🐳 Docker Services:"
    docker compose -f docker-compose.dev.yml ps
    
    echo ""
    echo "🌐 Port Status:"
    local ports
    ports=("3000:Web" "3001:API" "8081:Mobile" "19000:Expo" "27017:MongoDB" "6379:Redis" "8545:Hardhat" "16686:Jaeger")
    
    for port_info in "${ports[@]}"; do
        IFS=':' read -r port name <<< "$port_info"
        if nc -z localhost "$port" 2>/dev/null; then
            echo "  ✅ $name (port $port)"
        else
            echo "  ❌ $name (port $port)"
        fi
    done
}

# Main development startup function
main_start() {
    print_status "Starting Todo App development environment..."
    print_status "Services: $SERVICES"
    
    local start_time
    start_time=$(date +%s)
    
    check_prerequisites
    install_dependencies
    build_packages
    start_infrastructure
    setup_database
    setup_shutdown
    
    show_development_urls
    show_service_status
    
    # Start applications in background if running all services
    if [ "$SERVICES" = "all" ]; then
        start_applications &
        APP_PID=$!
        
        # Monitor services
        monitor_services
    else
        # Start specific services in foreground
        start_applications
    fi
    
    local end_time
    end_time=$(date +%s)
    local duration
    duration=$((end_time - start_time))
    
    print_success "Development environment started in ${duration}s"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --services)
            SERVICES="$2"
            shift 2
            ;;
        --skip-deps)
            SKIP_DEPS="true"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        --no-watch)
            WATCH_MODE="false"
            shift
            ;;
        --no-parallel)
            PARALLEL="false"
            shift
            ;;
        --verbose)
            VERBOSE="true"
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

# Execute main startup
main_start
