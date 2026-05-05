# 10 Infrastructure And Deployment

## Deployment Goal

Expose one public backend entrypoint:

```text
https://api.<domain>
```

or:

```text
https://gateway.<domain>
```

The frontend should never need public URLs for `apps/api` or `apps/api-bun`.

## Local, Staging, Production

### Local

```text
web -> localhost:3003 -> localhost:3001 / localhost:3002
```

All services may expose ports for debugging.

### Staging

```text
staging web/mobile -> staging gateway -> private staging APIs
```

Direct API URLs can remain temporarily reachable only to internal networks or CI if required.

### Production

```text
production web/mobile -> production gateway -> private production APIs
```

Direct API public exposure should be removed.

## AWS ECS Shape

Recommended ECS services:

```text
todo-api-gateway
todo-api
todo-api-bun
todo-ingestion
```

Public ALB target:

```text
api-gateway
```

Private/internal target groups:

```text
api
api-bun
```

Gateway environment:

```text
NEST_API_URL=http://todo-api.internal:3001
BUN_API_URL=http://todo-api-bun.internal:3002
```

## Terraform/Terragrunt Updates

Expected changes:

- Add an ECR repository for `api-gateway`.
- Add an ECS service for `api-gateway`.
- Add ALB listener rule for public API host/path.
- Add security group allowing public ALB to gateway only.
- Add security group allowing gateway to call `api` and `api-bun`.
- Add Secrets Manager entries for gateway config.
- Add CloudWatch log group for gateway.
- Add OTEL service name/env vars.

Likely modules to reuse:

```text
infra/terraform/modules/aws-ecr-repository
infra/terraform/modules/aws-ecs-service
infra/terraform/modules/aws-alb
infra/terraform/modules/api-secrets
infra/terraform/modules/aws-observability
```

## Kubernetes Shape

If using `infra/kubernetes`, add:

```text
api-gateway-deployment.yaml
api-gateway-service.yaml
```

Ingress should route public API traffic to `api-gateway`, not directly to `api`.

Example:

```text
/api/*   -> api-gateway
/graphql -> api-gateway
```

The existing `api-service` and future `api-bun-service` should be internal `ClusterIP` services.

## Vercel Web Configuration

Set:

```text
NEXT_PUBLIC_API_GATEWAY_URL=https://api.<domain>
NEXT_PUBLIC_API_URL=https://api.<domain>
```

Remove from frontend project settings after migration:

```text
NEXT_PUBLIC_API_BUN_URL
NEXT_PUBLIC_API_MODE
```

## EAS Mobile Configuration

Set:

```text
EXPO_PUBLIC_API_GATEWAY_URL=https://api.<domain>
EXPO_PUBLIC_API_URL=https://api.<domain>
```

Remove after migration:

```text
EXPO_PUBLIC_API_BUN_URL
EXPO_PUBLIC_API_MODE
```

## DNS And TLS

Recommended:

```text
api.dev.<domain>
api.staging.<domain>
api.<domain>
```

TLS terminates at ALB/API edge.

Gateway receives:

```text
x-forwarded-proto=https
x-forwarded-host=api.<domain>
```

## Secrets

Gateway secrets:

```text
JWT_SECRET or JWKS_URL
REDIS_URI
NEST_API_URL
BUN_API_URL
OTEL_EXPORTER_OTLP_ENDPOINT
```

Do not store public frontend variables as secrets unless platform requires it. They are public by design.

## Network Access

Production target:

```text
Internet -> ALB -> api-gateway
api-gateway -> api
api-gateway -> api-bun
api/api-bun -> MongoDB/Redis
ingestion -> MongoDB/Redis/blockchain RPCs
```

Disallow:

```text
Internet -> api
Internet -> api-bun
Internet -> ingestion
```

## Rollback

Rollback levels:

1. Gateway route rollback: change route table from Bun to Nest.
2. Gateway deployment rollback: deploy previous gateway image.
3. Frontend env rollback: point frontend back to old API URL temporarily.
4. Infrastructure rollback: restore direct API ALB route temporarily.

Preferred rollback is level 1 because it does not require frontend changes.

## Production Readiness Checklist

- Gateway has health/readiness endpoints.
- Gateway has structured logs.
- Gateway has request ID and trace propagation.
- Gateway uses production CORS allowlist.
- Gateway has route-level rate limits.
- Gateway timeout policy is configured.
- Gateway secrets are not hardcoded.
- Direct backend APIs are private or restricted.
- Frontends point to gateway URL.
- E2E tests pass against gateway.
- Rollback route table is documented.
