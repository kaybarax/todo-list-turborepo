#!/bin/bash

# Todo App Kubernetes Deployment Script
# [LEGACY] This script and the manifests in this directory are legacy.
# The project has migrated to AWS ECS, Vercel, and Expo EAS.
# Infrastructure is now managed via Terraform/Terragrunt.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Legacy warning function
show_legacy_warning() {
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                   WARNING                                    ║${NC}"
    echo -e "${RED}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║ This script and the Kubernetes manifests are LEGACY.                         ║${NC}"
    echo -e "${RED}║ The project has moved to AWS (ECS), Vercel, and EAS (Expo).                  ║${NC}"
    echo -e "${RED}║ Infrastructure is now managed via Terraform/Terragrunt in /infra.            ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Call legacy warning immediately
show_legacy_warning

# Configuration
NAMESPACE="todo-app"
KUBECTL_TIMEOUT="300s"

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

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_success "kubectl is available and connected to cluster"
}

# Function to check if namespace exists
check_namespace() {
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace $NAMESPACE already exists"
    else
        print_status "Creating namespace $NAMESPACE"
        kubectl apply -f namespace.yaml
        print_success "Namespace $NAMESPACE created"
    fi
}

# Function to apply Kubernetes manifests
apply_manifests() {
    local manifest_file=$1
    local description=$2
    
    print_status "Applying $description..."
    
    if kubectl apply -f "$manifest_file" --timeout="$KUBECTL_TIMEOUT"; then
        print_success "$description applied successfully"
    else
        print_error "Failed to apply $description"
        exit 1
    fi
}

# Function to wait for deployment to be ready
wait_for_deployment() {
    local deployment_name=$1
    local timeout=${2:-300s}
    
    print_status "Waiting for deployment $deployment_name to be ready..."
    
    if kubectl wait --for=condition=available --timeout="$timeout" deployment/"$deployment_name" -n "$NAMESPACE"; then
        print_success "Deployment $deployment_name is ready"
    else
        print_error "Deployment $deployment_name failed to become ready within $timeout"
        return 1
    fi
}

# Function to wait for StatefulSet to be ready
wait_for_statefulset() {
    local statefulset_name=$1
    local timeout=${2:-300s}
    
    print_status "Waiting for StatefulSet $statefulset_name to be ready..."
    
    if kubectl wait --for=condition=ready --timeout="$timeout" pod -l app.kubernetes.io/name="$statefulset_name" -n "$NAMESPACE"; then
        print_success "StatefulSet $statefulset_name is ready"
    else
        print_error "StatefulSet $statefulset_name failed to become ready within $timeout"
        return 1
    fi
}

# Function to check pod status
check_pod_status() {
    print_status "Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -o wide
    
    # Check for any failed pods
    failed_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Failed --no-headers 2>/dev/null | wc -l)
    if [ "$failed_pods" -gt 0 ]; then
        print_warning "Found $failed_pods failed pods"
        kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Failed
    fi
}

# Function to display service information
show_services() {
    print_status "Service information:"
    kubectl get services -n "$NAMESPACE" -o wide
    
    print_status "Ingress information:"
    kubectl get ingress -n "$NAMESPACE" -o wide
}

# Function to show application URLs
show_urls() {
    print_status "Application URLs:"
    
    # Get ingress host
    ingress_host=$(kubectl get ingress todo-app-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "<your-domain.com>")
    
    echo "Main Application: https://$ingress_host"
    echo "API: https://$ingress_host/api"
    echo "Mobile App: https://$ingress_host/mobile"
    echo "Jaeger Tracing: https://$ingress_host/jaeger"
    
    # Check if LoadBalancer service has external IP
    external_ip=$(kubectl get service nginx-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$external_ip" ]; then
        echo "External IP: $external_ip"
    else
        print_warning "LoadBalancer external IP not yet assigned"
    fi
}

# Function to run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check API health
    api_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=api -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$api_pod" ]; then
        if kubectl exec -n "$NAMESPACE" "$api_pod" -- curl -f http://localhost:3001/health &>/dev/null; then
            print_success "API health check passed"
        else
            print_warning "API health check failed"
        fi
    fi
    
    # Check Web health
    web_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=web -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$web_pod" ]; then
        if kubectl exec -n "$NAMESPACE" "$web_pod" -- curl -f http://localhost:3000/api/health &>/dev/null; then
            print_success "Web health check passed"
        else
            print_warning "Web health check failed"
        fi
    fi
    
    # Check database connectivity
    mongodb_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$mongodb_pod" ]; then
        if kubectl exec -n "$NAMESPACE" "$mongodb_pod" -- mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
            print_success "MongoDB health check passed"
        else
            print_warning "MongoDB health check failed"
        fi
    fi
    
    redis_pod=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$redis_pod" ]; then
        if kubectl exec -n "$NAMESPACE" "$redis_pod" -- redis-cli ping &>/dev/null; then
            print_success "Redis health check passed"
        else
            print_warning "Redis health check failed"
        fi
    fi
}

# Function to show logs for debugging
show_logs() {
    if [ "$1" = "--logs" ]; then
        print_status "Showing recent logs..."
        
        echo "=== API Logs ==="
        kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/name=api --tail=20 || true
        
        echo "=== Web Logs ==="
        kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/name=web --tail=20 || true
        
        echo "=== Ingestion Logs ==="
        kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/name=ingestion --tail=20 || true
    fi
}

# Function to cleanup deployment
cleanup() {
    if [ "$1" = "--cleanup" ]; then
        print_warning "Cleaning up deployment..."
        kubectl delete namespace "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
        print_success "Cleanup completed"
        exit 0
    fi
}

# Main deployment function
main() {
    print_status "Starting Todo App Kubernetes deployment..."
    
    # Handle command line arguments
    cleanup "$1"
    
    # Pre-deployment checks
    check_kubectl
    check_namespace
    
    # Deploy in order of dependencies
    print_status "Deploying RBAC and security configurations..."
    apply_manifests "rbac.yaml" "RBAC configurations"
    
    print_status "Deploying configuration and secrets..."
    apply_manifests "configmap.yaml" "ConfigMaps"
    apply_manifests "secrets.yaml" "Secrets"
    
    print_status "Deploying database services..."
    apply_manifests "mongodb-deployment.yaml" "MongoDB"
    apply_manifests "redis-deployment.yaml" "Redis"
    apply_manifests "services.yaml" "Database services"
    
    # Wait for databases to be ready
    wait_for_statefulset "mongodb" "600s"
    wait_for_statefulset "redis" "300s"
    
    print_status "Deploying application services..."
    apply_manifests "api-deployment.yaml" "API deployment"
    apply_manifests "api-service.yaml" "API service"
    
    # Wait for API to be ready before deploying dependent services
    wait_for_deployment "api-deployment" "300s"
    
    apply_manifests "web-deployment.yaml" "Web deployment"
    apply_manifests "web-service.yaml" "Web service"
    apply_manifests "ingestion-deployment.yaml" "Ingestion deployment"
    apply_manifests "mobile-web-deployment.yaml" "Mobile web deployment"
    
    print_status "Deploying monitoring and proxy services..."
    apply_manifests "monitoring.yaml" "Monitoring services"
    
    print_status "Deploying resource management..."
    apply_manifests "resource-management.yaml" "Resource quotas and limits"
    
    print_status "Deploying ingress and networking..."
    apply_manifests "ingress.yaml" "Ingress and network policies"
    
    # Wait for all deployments to be ready
    print_status "Waiting for all deployments to be ready..."
    wait_for_deployment "web-deployment" "300s"
    wait_for_deployment "ingestion-deployment" "300s"
    wait_for_deployment "mobile-web-deployment" "300s"
    wait_for_deployment "jaeger-deployment" "300s"
    wait_for_deployment "nginx-deployment" "300s"
    
    # Post-deployment checks
    check_pod_status
    show_services
    show_urls
    health_check
    show_logs "$1"
    
    print_success "Todo App deployment completed successfully!"
    print_status "You can monitor the deployment with: kubectl get all -n $NAMESPACE"
    print_status "To view logs: kubectl logs -f deployment/api-deployment -n $NAMESPACE"
    print_status "To access the application, configure DNS to point to the LoadBalancer IP"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --cleanup    Remove the entire deployment"
    echo "  --logs       Show application logs after deployment"
    echo "  --help       Show this help message"
    exit 1
}

# Handle help
if [ "$1" = "--help" ]; then
    usage
fi

# Run main function
main "$1"