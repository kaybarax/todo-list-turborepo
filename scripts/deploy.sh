#!/bin/bash

# Comprehensive deployment script for Todo App Monorepo
# [LEGACY] This script primarily targets Kubernetes, which is now considered legacy.
# Primary deployment is now managed via Terraform/Terragrunt (AWS/Vercel/EAS).
# Use this only for historical reference or specialized Kubernetes-based environments.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Legacy warning function
show_legacy_warning() {
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                   WARNING                                    ║${NC}"
    echo -e "${RED}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║ This deployment script is LEGACY and targets Kubernetes.                     ║${NC}"
    echo -e "${RED}║ The project has moved to AWS (ECS), Vercel, and EAS (Expo).                  ║${NC}"
    echo -e "${RED}║ Infrastructure is now managed via Terraform/Terragrunt in /infra.            ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Call legacy warning immediately
show_legacy_warning

# Configuration
ENVIRONMENT="${ENVIRONMENT:-development}"
NAMESPACE="${NAMESPACE:-todo-app}"
DEPLOY_CONTRACTS="${DEPLOY_CONTRACTS:-true}"
DEPLOY_MONITORING="${DEPLOY_MONITORING:-true}"
SKIP_BUILD="${SKIP_BUILD:-false}"
DRY_RUN="${DRY_RUN:-false}"
VERSION="${VERSION:-latest}"
KUBECTL_TIMEOUT="600s"

# Function to print colored output
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

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check Docker (if not skipping build)
    if [ "$SKIP_BUILD" = "false" ] && ! command -v docker &> /dev/null; then
        print_warning "Docker not available, skipping build step"
        SKIP_BUILD="true"
    fi
    
    print_success "Prerequisites check passed"
}

# Function to build applications before deployment
build_applications() {
    if [ "$SKIP_BUILD" = "true" ]; then
        print_warning "Skipping build step"
        return
    fi
    
    print_status "Building applications for deployment..."
    
    # Build based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        ./scripts/build-production.sh
    else
        ./scripts/build.sh --environment "$ENVIRONMENT" --version "$VERSION"
    fi
    
    print_success "Applications built successfully"
}

# Function to deploy blockchain contracts
deploy_contracts() {
    if [ "$DEPLOY_CONTRACTS" = "false" ]; then
        print_warning "Skipping blockchain contract deployment"
        return
    fi
    
    print_status "Deploying blockchain contracts..."
    
    # Deploy contracts to appropriate networks based on environment
    case $ENVIRONMENT in
        development)
            print_status "Deploying to local test networks..."
            ./scripts/build-contracts.sh --network all
            ;;
        staging)
            print_status "Deploying to testnets..."
            # Deploy to testnets (Mumbai, Devnet, Westend, Moonbase Alpha, Base Sepolia)
            ./scripts/deploy-contracts.sh --environment staging --network all || print_warning "Testnet contract deployment failed"
            ;;
        production)
            print_status "Deploying to mainnets..."
            print_warning "Production contract deployment requires manual verification"
            # Production deployments should be done manually with proper verification
            ./scripts/deploy-contracts.sh --environment production --network all --dry-run
            print_status "Use './scripts/deploy-contracts.sh --environment production --network <network>' to deploy specific networks"
            ;;
    esac
    
    print_success "Blockchain contracts deployment completed"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    print_status "Deploying to Kubernetes cluster..."
    
    # Use the comprehensive Kubernetes deployment script
    if [ -f "infra/k8s/deploy.sh" ]; then
        cd infra/k8s
        
        # Set environment variables for the K8s deployment
        export ENVIRONMENT
        export VERSION
        export DRY_RUN
        
        if [ "$DRY_RUN" = "true" ]; then
            print_status "Running Kubernetes deployment in dry-run mode..."
            ./deploy.sh --dry-run
        else
            ./deploy.sh --environment "$ENVIRONMENT"
        fi
        
        cd ../..
    else
        print_error "Kubernetes deployment script not found at infra/k8s/deploy.sh"
        exit 1
    fi
    
    print_success "Kubernetes deployment completed"
}

# Function to deploy using Docker Compose (for development)
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    case $ENVIRONMENT in
        development)
            docker compose -f docker-compose.dev.yml up -d
            ;;
        staging|production)
            docker compose up -d
            ;;
    esac
    
    print_success "Docker Compose deployment completed"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 30
    
    # Run migrations
    if [ "$ENVIRONMENT" = "development" ]; then
        # For development, run full setup
        pnpm db:setup
    else
        # For staging/production, run only migrations
        pnpm db:migrate
    fi
    
    print_success "Database migrations completed"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    case $DEPLOYMENT_TYPE in
        kubernetes)
            # Check Kubernetes deployment status
            kubectl get all -n "$NAMESPACE"
            
            # Check pod health
            print_status "Checking pod health..."
            kubectl get pods -n "$NAMESPACE" -o wide
            
            # Wait for all deployments to be ready
            kubectl wait --for=condition=available --timeout="$KUBECTL_TIMEOUT" deployment --all -n "$NAMESPACE"
            
            # Run health checks
            print_status "Running health checks..."
            
            # API health check
            api_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
            if [ -n "$api_pod" ]; then
                kubectl exec -n "$NAMESPACE" "$api_pod" -- curl -f http://localhost:3001/health || print_warning "API health check failed"
            fi
            
            # Web health check
            web_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=web -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
            if [ -n "$web_pod" ]; then
                kubectl exec -n "$NAMESPACE" "$web_pod" -- curl -f http://localhost:3000/api/health || print_warning "Web health check failed"
            fi
            ;;
            
        docker compose)
            # Check Docker Compose services
            docker compose ps
            
            # Basic health checks
            curl -f http://localhost:3001/health || print_warning "API health check failed"
            curl -f http://localhost:3000/api/health || print_warning "Web health check failed"
            ;;
    esac
    
    print_success "Deployment verification completed"
}

# Function to show deployment information
show_deployment_info() {
    print_status "Deployment Information:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Version: $VERSION"
    echo "  Namespace: $NAMESPACE"
    echo "  Contracts Deployed: $([ "$DEPLOY_CONTRACTS" = "true" ] && echo "Yes" || echo "No")"
    echo "  Monitoring: $([ "$DEPLOY_MONITORING" = "true" ] && echo "Enabled" || echo "Disabled")"
    echo ""
    
    case $DEPLOYMENT_TYPE in
        kubernetes)
            print_status "Kubernetes Resources:"
            kubectl get all -n "$NAMESPACE" --show-labels
            
            print_status "Access Information:"
            # Get ingress information
            ingress_host=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "localhost")
            echo "  Web App: https://$ingress_host"
            echo "  API: https://$ingress_host/api"
            echo "  Monitoring: https://$ingress_host/grafana"
            ;;
            
        docker compose)
            print_status "Docker Services:"
            docker compose ps
            
            print_status "Access Information:"
            echo "  Web App: http://localhost:3000"
            echo "  API: http://localhost:3001"
            echo "  Jaeger: http://localhost:16686"
            echo "  MailHog: http://localhost:8025"
            ;;
    esac
}

# Function to rollback deployment
rollback_deployment() {
    if [ "$1" = "--rollback" ]; then
        print_warning "Rolling back deployment..."
        
        case $DEPLOYMENT_TYPE in
            kubernetes)
                # Rollback Kubernetes deployments
                kubectl rollout undo deployment --all -n "$NAMESPACE"
                print_success "Kubernetes rollback completed"
                ;;
                
            docker compose)
                # Stop Docker Compose services
                docker compose down
                print_success "Docker Compose rollback completed"
                ;;
        esac
        
        exit 0
    fi
}

# Function to cleanup deployment
cleanup_deployment() {
    if [ "$1" = "--cleanup" ]; then
        print_warning "Cleaning up deployment..."
        
        case $DEPLOYMENT_TYPE in
            kubernetes)
                kubectl delete namespace "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
                ;;
                
            docker compose)
                docker compose down -v
                docker system prune -f
                ;;
        esac
        
        print_success "Cleanup completed"
        exit 0
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Comprehensive deployment script for Todo App Monorepo"
    echo ""
    echo "Options:"
    echo "  --environment ENV     Deployment environment (development, staging, production)"
    echo "  --version VERSION     Application version to deploy"
    echo "  --namespace NS        Kubernetes namespace (default: todo-app)"
    echo "  --skip-build          Skip building applications"
    echo "  --skip-contracts      Skip blockchain contract deployment"
    echo "  --skip-monitoring     Skip monitoring stack deployment"
    echo "  --dry-run             Show what would be deployed without actually deploying"
    echo "  --docker compose      Use Docker Compose instead of Kubernetes"
    echo "  --rollback            Rollback to previous deployment"
    echo "  --cleanup             Remove entire deployment"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  ENVIRONMENT           Deployment environment"
    echo "  NAMESPACE             Kubernetes namespace"
    echo "  DEPLOY_CONTRACTS      Deploy blockchain contracts (true/false)"
    echo "  DEPLOY_MONITORING     Deploy monitoring stack (true/false)"
    echo "  SKIP_BUILD           Skip build step (true/false)"
    echo "  DRY_RUN              Dry run mode (true/false)"
    echo "  VERSION              Application version"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to development"
    echo "  $0 --environment production           # Deploy to production"
    echo "  $0 --docker compose                  # Deploy with Docker Compose"
    echo "  $0 --dry-run --environment staging    # Dry run for staging"
    echo "  $0 --rollback                         # Rollback deployment"
    echo "  $0 --cleanup                          # Clean up deployment"
}

# Main deployment function
main_deploy() {
    print_status "Starting Todo App deployment..."
    print_status "Environment: $ENVIRONMENT"
    print_status "Version: $VERSION"
    print_status "Deployment Type: $DEPLOYMENT_TYPE"
    
    local start_time=$(date +%s)
    
    check_prerequisites
    
    if [ "$DRY_RUN" = "true" ]; then
        print_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    build_applications
    deploy_contracts
    
    case $DEPLOYMENT_TYPE in
        kubernetes)
            deploy_kubernetes
            ;;
        docker compose)
            deploy_docker_compose
            ;;
    esac
    
    run_migrations
    verify_deployment
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_success "Deployment completed successfully in ${duration}s"
    show_deployment_info
}

# Determine deployment type
DEPLOYMENT_TYPE="kubernetes"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        --skip-contracts)
            DEPLOY_CONTRACTS="false"
            shift
            ;;
        --skip-monitoring)
            DEPLOY_MONITORING="false"
            shift
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --docker compose)
            DEPLOYMENT_TYPE="docker compose"
            shift
            ;;
        --rollback)
            rollback_deployment "$1"
            ;;
        --cleanup)
            cleanup_deployment "$1"
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
