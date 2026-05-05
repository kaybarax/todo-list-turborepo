# 12 Implementation Backlog

## Phase A: Scaffold Gateway

1. Create `apps/api-gateway`.
2. Add `@todo/api-gateway` package metadata.
3. Add TypeScript config based on `apps/api-bun`.
4. Add ESLint config based on `apps/api-bun`.
5. Add Bun/Elysia dependencies.
6. Add `src/index.ts`.
7. Add `src/app.ts`.
8. Add `.env.example`.
9. Add Dockerfile.
10. Add root scripts:
    - `dev:api-gateway`
    - `build:api-gateway`
    - `test:api-gateway`

## Phase B: Core Gateway Middleware

1. Add request ID plugin.
2. Add structured logger plugin.
3. Add error plugin.
4. Add CORS plugin.
5. Add security headers plugin.
6. Add rate limit plugin.
7. Add body size guard.
8. Add telemetry plugin.
9. Add trace propagation helpers.

## Phase C: Routing And Proxy

1. Add upstream config.
2. Add route metadata type.
3. Add static route table.
4. Add route matcher.
5. Add header filter.
6. Add upstream URL builder.
7. Add timeout wrapper.
8. Add retry helper for idempotent requests.
9. Add response passthrough.
10. Add gateway-generated error responses.
11. Add gateway debug headers in development.

## Phase D: Health

1. Add `GET /api/v1`.
2. Add `GET /api/v1/health`.
3. Add `GET /api/v1/health/ready`.
4. Readiness checks:
   - NestJS `/api/v1/health/ready`
   - Bun `/api/v1/health/ready`
   - Redis if used by gateway
5. Add health tests.

## Phase E: Auth

1. Add public route policy.
2. Add protected route policy.
3. Validate JWT locally with current shared secret.
4. Forward `authorization` header.
5. Add route-level auth metadata.
6. Add auth failure logs.
7. Add auth tests.
8. Document future JWKS migration.

## Phase F: REST Route Coverage

1. Proxy auth register.
2. Proxy auth login.
3. Proxy auth refresh.
4. Proxy auth profile.
5. Proxy users profile.
6. Proxy todo create.
7. Proxy todo list.
8. Proxy todo stats.
9. Proxy todo by ID.
10. Proxy todo patch.
11. Proxy todo put.
12. Proxy todo toggle.
13. Proxy todo delete.

## Phase G: Frontend Migration

1. Update `apps/web/src/config/api.ts`.
2. Update `apps/mobile/src/config/api.ts`.
3. Update `apps/web/.env.example`.
4. Update `apps/web/.env.local`.
5. Update `apps/mobile/.env.example`.
6. Update `apps/mobile/.env`.
7. Update web API integration tests.
8. Update web deploy smoke test.
9. Search for direct API URLs:
   - `localhost:3001`
   - `localhost:3002`
   - `NEXT_PUBLIC_API_BUN_URL`
   - `NEXT_PUBLIC_API_MODE`
   - `EXPO_PUBLIC_API_BUN_URL`
   - `EXPO_PUBLIC_API_MODE`

## Phase H: Docker And Dev Scripts

1. Add `api-gateway` service to `docker-compose.dev.yml`.
2. Update web service env to gateway URL.
3. Update mobile service env to gateway URL.
4. Update `scripts/startDev.sh`.
5. Update `scripts/dev-backend.sh` if present.
6. Confirm `pnpm dev` starts gateway.
7. Confirm isolated `pnpm dev:api-gateway` works.

## Phase I: Observability

1. Add OTEL service name.
2. Propagate `traceparent`.
3. Add route/upstream span attributes.
4. Include `requestId` in logs.
5. Include `requestId` in gateway errors.
6. Add metrics endpoint if the repo standardizes on Prometheus.
7. Validate traces in Jaeger.

## Phase J: Contract And OpenAPI

1. Add gateway OpenAPI plugin.
2. Document public routes.
3. Add `scripts/export-openapi.ts`.
4. Compare upstream OpenAPI route availability.
5. Add CI check for gateway OpenAPI export.
6. Add route table drift tests.

## Phase K: Canary And Routing Controls

1. Add route override via environment variable.
2. Add header-based override for development.
3. Add percentage canary.
4. Add sticky user hash.
5. Add read fallback from Bun to Nest where safe.
6. Add shadow read traffic for parity checks.
7. Add canary metrics.

## Phase L: Optional GraphQL

1. Add GraphQL feature flag.
2. Add GraphQL endpoint at `/graphql`.
3. Add context builder from JWT.
4. Add `me` query.
5. Add `todos` query.
6. Add `todoStats` query.
7. Add `dashboard` query.
8. Add depth/complexity limits.
9. Disable production introspection unless explicitly enabled.
10. Add resolver tests.

## Phase M: Infrastructure

1. Add ECR repo for gateway.
2. Add ECS service for gateway.
3. Add ALB listener rule to gateway.
4. Add security group from ALB to gateway.
5. Add security group from gateway to internal APIs.
6. Add gateway secrets.
7. Add gateway logs.
8. Add staging/prod env values.
9. Restrict direct public access to APIs.
10. Update deployment docs.

## Recommended First Pull Request

Keep the first PR scoped:

- Add `apps/api-gateway`.
- Add health endpoints.
- Add static route table.
- Add REST proxy.
- Add tests for route matching and proxy behavior.
- Add root scripts.
- Add local env examples.

Avoid in first PR:

- GraphQL
- Full canary routing
- Terraform production changes
- Major frontend rewrites

## Recommended Second Pull Request

- Update web/mobile API config.
- Update frontend env examples.
- Update tests to gateway URL.
- Add gateway to Docker Compose.
- Add `startDev.sh` integration.

## Recommended Third Pull Request

- Add OpenAPI export.
- Add contract tests.
- Add trace propagation.
- Add route metrics.
- Add canary routing.

## Recommended Fourth Pull Request

- Add infrastructure deployment.
- Make backend APIs private.
- Roll out staging.
- Roll out production.
