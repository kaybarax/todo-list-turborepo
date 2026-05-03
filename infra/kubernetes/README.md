# Kubernetes Configuration (Non-Production / Reference)

> [!WARNING]
> **These Kubernetes manifests are NOT the primary production deployment path.**
> Production deployment for this repository uses AWS ECS Fargate for the API and Ingestion workers, and Vercel for the Web app.
> These manifests remain in the repository strictly for reference, local development, or legacy platform compatibility. Do not wire production CI pipelines to these manifests.

## Contents

- `namespace.yaml`: Defines the `todo-app` namespace where all resources will be deployed
- `web-deployment.yaml` / `web-service.yaml`: Web frontend
- `api-deployment.yaml` / `api-service.yaml`: API backend
- `ingestion-deployment.yaml`: Ingestion worker
- `redis-deployment.yaml` / `mongodb-deployment.yaml`: Local stateful services
- `secrets.yaml`: ExternalSecrets configuration examples for AWS Secrets Manager integration
- `configmap.yaml`: App configuration
- `ingress.yaml`: Ingress routing examples
- `rbac.yaml`: Service accounts and roles
- `monitoring.yaml`: Prometheus/Grafana service monitors
- `resource-management.yaml`: Quotas and limits

## Usage

If you are evaluating these manifests for a non-production Kubernetes environment:

1. Setup an ingress controller (e.g. NGINX Ingress Controller)
2. Deploy External Secrets Operator to resolve `secrets.yaml` integrations
3. Update `<your-domain.com>` in `configmap.yaml` and `ingress.yaml`
4. Provide templated image tags (e.g., `export TODO_API_IMAGE=...`) and run `envsubst` before applying

```bash
kubectl apply -f namespace.yaml
# (apply envsubst on deployments)
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f rbac.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
```
