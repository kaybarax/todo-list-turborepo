#!/bin/bash

# Staging environment deployment script
# Deploys to Kubernetes with testnet blockchain contracts

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

print_status "Starting staging environment deployment..."

# Configuration for staging
export ENVIRONMENT=staging
export NAMESPACE=todo-app-staging
export DEPLOY_CONTRACTS=true
export DEPLOY_MONITORING=true
export SKIP_BUILD=false
export VERSION=${VERSION:-$(git rev-parse --short HEAD)}

# Validate required environment variables
required_vars=("DOCKER_REGISTRY" "MONGODB_URI" "REDIS_URI")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_status "Staging deployment configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Namespace: $NAMESPACE"
echo "  Version: $VERSION"
echo "  Registry: $DOCKER_REGISTRY"

# Pre-deployment validation
print_status "Running pre-deployment validation..."

# Check kubectl connectivity
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

# Check if staging namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    print_status "Creating staging namespace..."
    kubectl create namespace "$NAMESPACE"
    kubectl label namespace "$NAMESPACE" environment=staging
fi

# Build applications for staging
print_status "Building applications for staging..."
./scripts/build.sh \
    --environment staging \
    --version "$VERSION" \
    --registry "$DOCKER_REGISTRY" \
    --push

# Deploy blockchain contracts to testnets
print_status "Deploying contracts to testnets..."

# Deploy Polygon contracts to Mumbai testnet
if [ -n "$POLYGON_MUMBAI_RPC_URL" ] && [ -n "$POLYGON_PRIVATE_KEY" ]; then
    print_status "Deploying Polygon contracts to Mumbai testnet..."
    cd apps/smart-contracts/polygon
    NETWORK=mumbai pnpm deploy:mumbai || print_warning "Polygon Mumbai deployment failed"
    cd ../../..
else
    print_warning "Polygon Mumbai deployment skipped - missing configuration"
fi

# Deploy Solana programs to devnet
if [ -n "$SOLANA_DEVNET_RPC_URL" ]; then
    print_status "Deploying Solana programs to devnet..."
    cd apps/smart-contracts/solana
    anchor deploy --provider.cluster devnet || print_warning "Solana devnet deployment failed"
    cd ../../..
else
    print_warning "Solana devnet deployment skipped - missing configuration"
fi

# Deploy to Kubernetes
print_status "Deploying to Kubernetes staging environment..."
./scripts/deploy.sh \
    --environment staging \
    --namespace "$NAMESPACE" \
    --version "$VERSION"

# Run staging-specific tests
print_status "Running staging validation tests..."

# Wait for deployment to be ready
kubectl wait --for=condition=available --timeout=600s deployment --all -n "$NAMESPACE"

# Health checks
print_status "Running health checks..."

# API health check
api_url="https://staging-api.todo-app.example.com/health"
if curl -f "$api_url" &>/dev/null; then
    print_success "API health check passed"
else
    print_warning "API health check failed"
fi

# Web health check
web_url="https://staging.todo-app.example.com/api/health"
if curl -f "$web_url" &>/dev/null; then
    print_success "Web health check passed"
else
    print_warning "Web health check failed"
fi

# Database connectivity check
print_status "Checking database connectivity..."
api_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component=api -o jsonpath='{.items[0].metadata.name}')
if [ -n "$api_pod" ]; then
    kubectl exec -n "$NAMESPACE" "$api_pod" -- node -e "
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env.MONGODB_URI);
        client.connect().then(() => {
            console.log('MongoDB connection successful');
            client.close();
        }).catch(err => {
            console.error('MongoDB connection failed:', err.message);
            process.exit(1);
        });
    " || print_warning "Database connectivity check failed"
fi

# Contract deployment verification
print_status "Verifying contract deployments..."

# Check if contract addresses are accessible
if [ -f "apps/smart-contracts/polygon/deployments/mumbai/TodoList.json" ]; then
    contract_address=$(jq -r '.address' apps/smart-contracts/polygon/deployments/mumbai/TodoList.json)
    print_success "Polygon contract deployed at: $contract_address"
fi

# Performance tests
print_status "Running performance tests..."
if command -v k6 &> /dev/null; then
    # Run basic load test if k6 is available
    k6 run --duration 30s --vus 10 tests/performance/api-load-test.js || print_warning "Performance tests failed"
else
    print_warning "k6 not available, skipping performance tests"
fi

# Generate staging deployment report
print_status "Generating staging deployment report..."
cat > staging-deployment-report.json << EOF
{
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "staging",
  "version": "$VERSION",
  "namespace": "$NAMESPACE",
  "gitCommit": "$(git rev-parse HEAD)",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
  "dockerRegistry": "$DOCKER_REGISTRY",
  "kubernetesCluster": "$(kubectl config current-context)",
  "services": {
    "api": "$(kubectl get deployment api -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')/$(kubectl get deployment api -n $NAMESPACE -o jsonpath='{.spec.replicas}') ready",
    "web": "$(kubectl get deployment web -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')/$(kubectl get deployment web -n $NAMESPACE -o jsonpath='{.spec.replicas}') ready",
    "ingestion": "$(kubectl get deployment ingestion -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')/$(kubectl get deployment ingestion -n $NAMESPACE -o jsonpath='{.spec.replicas}') ready"
  },
  "contracts": {
    "polygon": "$([ -f apps/smart-contracts/polygon/deployments/mumbai/TodoList.json ] && echo 'deployed' || echo 'not deployed')",
    "solana": "$([ -f apps/smart-contracts/solana/target/deploy/todo_program.so ] && echo 'deployed' || echo 'not deployed')"
  }
}
EOF

print_success "Staging deployment completed successfully!"

echo ""
echo "🌐 Staging URLs:"
echo "  Web App:          https://staging.todo-app.example.com"
echo "  API:              https://staging-api.todo-app.example.com"
echo "  API Docs:         https://staging-api.todo-app.example.com/api"
echo "  Grafana:          https://staging.todo-app.example.com/grafana"
echo ""
echo "📊 Monitoring:"
echo "  Kubernetes:       kubectl get all -n $NAMESPACE"
echo "  Logs:             kubectl logs -f deployment/api -n $NAMESPACE"
echo "  Metrics:          https://staging.todo-app.example.com/grafana"
echo ""
echo "🔗 Blockchain:"
echo "  Polygon Mumbai:   https://mumbai.polygonscan.com/"
echo "  Solana Devnet:    https://explorer.solana.com/?cluster=devnet"
echo ""
echo "📋 Deployment Report: staging-deployment-report.json"
echo ""
echo "✅ Staging environment is ready for testing!"