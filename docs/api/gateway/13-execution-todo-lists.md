# 13 Execution Todo Lists

This is the granular execution tracker for delivering the API Gateway integration end to end.

Use this file as the implementation checklist. Each phase has:

- Objective
- Dependencies
- Todo list
- Validation
- Exit criteria
- Rollback or risk notes where relevant

## Phase 0: Alignment And Baseline

### Objective

Confirm current behavior before adding the gateway so regressions are easy to identify.

### Dependencies

- Repository dependencies install successfully with `pnpm`.
- Docker Desktop or equivalent container runtime is available for local infrastructure.
- Existing APIs can run on ports `3001` and `3002`.

### Todo

- [x] Confirm current branch and working tree state with `git status --short`.
- [x] Confirm package manager version with `pnpm --version`.
- [x] Confirm Bun is available with `bun --version`.
- [x] Confirm root scripts exist for current APIs:
  - [x] `pnpm dev:api`
  - [x] `pnpm dev:api-bun`
  - [x] `pnpm build:api`
  - [x] `pnpm build:api-bun`
  - [x] `pnpm test:api-bun`
- [x] Start local infrastructure:
  - [x] MongoDB
  - [x] Redis
  - [x] OTEL Collector
  - [x] Jaeger
- [x] Run existing NestJS API health check:
  - [x] `GET http://localhost:3001/api/v1/health`
  - [x] `GET http://localhost:3001/api/v1/health/ready`
- [x] Run existing Bun API health check:
  - [x] `GET http://localhost:3002/api/v1/health`
  - [x] `GET http://localhost:3002/api/v1/health/ready`
- [ ] Export or inspect current API contracts:
  - [ ] NestJS OpenAPI via `apps/api/scripts/dump-openapi.ts`
  - [ ] Bun OpenAPI via `apps/api-bun/scripts/export-openapi.ts`
- [ ] Capture current frontend env references:
  - [ ] `NEXT_PUBLIC_API_URL`
  - [ ] `NEXT_PUBLIC_API_BUN_URL`
  - [ ] `NEXT_PUBLIC_API_MODE`
  - [ ] `EXPO_PUBLIC_API_URL`
  - [ ] `EXPO_PUBLIC_API_BUN_URL`
  - [ ] `EXPO_PUBLIC_API_MODE`
- [ ] Identify runtime frontend call sites using `@todo/services`.
- [ ] Identify tests with hardcoded `localhost:3001`.
- [ ] Identify tests with hardcoded `localhost:3002`.

### Validation

```bash
pnpm typecheck
pnpm --filter @todo/api-bun test
```

Run broader validation only if the repo is already green enough:

```bash
pnpm quality
```

### Exit Criteria

- Existing APIs are understood and reachable.
- Existing frontend API selection behavior is documented.
- Known baseline failures, if any, are recorded before gateway work begins.

## Phase 1: Gateway App Scaffold

### Objective

Create a runnable `apps/api-gateway` workspace app using Bun + Elysia.

### Dependencies

- Phase 0 complete.
- `apps/api-bun` can be used as the closest local convention.

### Todo

- [ ] Create `apps/api-gateway/`.
- [ ] Add `apps/api-gateway/package.json`.
- [ ] Set package name to `@todo/api-gateway`.
- [ ] Add scripts:
  - [ ] `dev`
  - [ ] `start`
  - [ ] `build`
  - [ ] `start:prod`
  - [ ] `typecheck`
  - [ ] `test`
  - [ ] `lint`
  - [ ] `openapi:export`
- [ ] Add runtime dependencies:
  - [ ] `elysia`
  - [ ] `@elysiajs/cors`
  - [ ] `@elysiajs/openapi`
  - [ ] `@elysiajs/bearer`
  - [ ] `@elysiajs/jwt`
  - [ ] `elysia-helmet`
  - [ ] `elysia-rate-limit`
  - [ ] `@sinclair/typebox`
  - [ ] `ioredis`
- [ ] Add optional GraphQL dependencies only if implementing GraphQL in this phase:
  - [ ] `graphql`
  - [ ] `graphql-yoga`
  - [ ] `@graphql-tools/schema`
- [ ] Add dev dependencies:
  - [ ] `@types/bun`
  - [ ] `typescript`
  - [ ] `eslint`
  - [ ] `@todo/config-eslint`
  - [ ] `@todo/config-ts`
- [ ] Add `apps/api-gateway/tsconfig.json`.
- [ ] Add `apps/api-gateway/eslint.config.js`.
- [ ] Add `apps/api-gateway/.env.example`.
- [ ] Add `apps/api-gateway/src/index.ts`.
- [ ] Add `apps/api-gateway/src/app.ts`.
- [ ] Add `apps/api-gateway/src/config/env.ts`.
- [ ] Add `apps/api-gateway/src/routes/index.route.ts`.
- [ ] Add `GET /api/v1` returning gateway metadata.
- [ ] Add graceful shutdown handling.
- [ ] Add root package scripts:
  - [ ] `dev:api-gateway`
  - [ ] `build:api-gateway`
  - [ ] `test:api-gateway`
- [ ] Confirm workspace discovery with `pnpm --filter @todo/api-gateway`.

### Validation

```bash
pnpm --filter @todo/api-gateway typecheck
pnpm --filter @todo/api-gateway build
pnpm dev:api-gateway
curl http://localhost:3003/api/v1
```

### Exit Criteria

- Gateway starts on `3003`.
- Gateway returns a basic `/api/v1` response.
- Build and typecheck pass for the new app.

## Phase 2: Core Middleware And Runtime Policy

### Objective

Add the non-negotiable gateway middleware: request ID, logging, errors, CORS, security headers, rate limiting, body limits, and config validation.

### Dependencies

- Phase 1 complete.

### Todo

- [ ] Add typed environment config.
- [ ] Fail fast when required env values are invalid.
- [ ] Add `PORT`, default `3003`.
- [ ] Add `PUBLIC_API_PREFIX`, default `/api/v1`.
- [ ] Add `NEST_API_URL`, default `http://localhost:3001`.
- [ ] Add `BUN_API_URL`, default `http://localhost:3002`.
- [ ] Add `JWT_SECRET`.
- [ ] Add `CORS_ORIGIN`.
- [ ] Add `PROXY_TIMEOUT_MS`.
- [ ] Add `RATE_LIMIT_ENABLED`.
- [ ] Add request ID plugin.
- [ ] Reuse valid incoming `x-request-id`.
- [ ] Generate `x-request-id` when missing.
- [ ] Add `x-request-id` to every response.
- [ ] Add structured logging plugin.
- [ ] Log method, path, route ID, status, duration, request ID, and upstream.
- [ ] Add error classes:
  - [ ] `GatewayRouteNotFoundError`
  - [ ] `GatewayAuthRequiredError`
  - [ ] `GatewayAuthInvalidError`
  - [ ] `GatewayPayloadTooLargeError`
  - [ ] `GatewayUpstreamTimeoutError`
  - [ ] `GatewayUpstreamUnavailableError`
- [ ] Add error response normalizer.
- [ ] Add CORS plugin.
- [ ] Add allowed origins from env.
- [ ] Add credentials support.
- [ ] Add allowed headers:
  - [ ] `content-type`
  - [ ] `authorization`
  - [ ] `x-request-id`
  - [ ] `x-api-version`
  - [ ] `x-environment`
  - [ ] `traceparent`
  - [ ] `tracestate`
  - [ ] `baggage`
- [ ] Add allowed methods:
  - [ ] `GET`
  - [ ] `POST`
  - [ ] `PUT`
  - [ ] `PATCH`
  - [ ] `DELETE`
  - [ ] `OPTIONS`
- [ ] Add security headers.
- [ ] Add request body size guard.
- [ ] Set default JSON body limit to `1 MB`.
- [ ] Add rate limiting.
- [ ] Use in-memory rate limiting for initial local mode if Redis integration is not ready.
- [ ] Add Redis-backed rate limiting path for multi-instance deployment.

### Validation

```bash
pnpm --filter @todo/api-gateway test
pnpm --filter @todo/api-gateway typecheck
curl -i http://localhost:3003/api/v1
curl -i -X OPTIONS http://localhost:3003/api/v1/todos
```

### Exit Criteria

- All responses include `x-request-id`.
- CORS preflight behaves correctly.
- Errors use a consistent JSON shape.
- Basic security headers are present.
- Request logging includes enough fields for debugging.

## Phase 3: Route Table And Proxy Engine

### Objective

Implement deterministic route matching and safe HTTP proxying to NestJS and Bun upstreams.

### Dependencies

- Phase 2 complete.
- NestJS and Bun APIs are locally reachable.

### Todo

- [ ] Add `src/types/route.ts`.
- [ ] Add `src/types/upstream.ts`.
- [ ] Define route metadata fields:
  - [ ] `id`
  - [ ] `publicPath`
  - [ ] `methods`
  - [ ] `upstream`
  - [ ] `upstreamPath`
  - [ ] `auth`
  - [ ] `timeoutMs`
  - [ ] `retries`
  - [ ] `fallback`
  - [ ] `tags`
  - [ ] `owner`
- [ ] Add `src/config/upstreams.ts`.
- [ ] Add `nest-api` upstream.
- [ ] Add `bun-api` upstream.
- [ ] Add `src/config/route-table.ts`.
- [ ] Add gateway-owned route entries:
  - [ ] `GET /api/v1`
  - [ ] `GET /api/v1/health`
  - [ ] `GET /api/v1/health/ready`
- [ ] Add proxied route entries:
  - [ ] `POST /api/v1/auth/register`
  - [ ] `POST /api/v1/auth/login`
  - [ ] `POST /api/v1/auth/refresh`
  - [ ] `GET /api/v1/auth/profile`
  - [ ] `GET /api/v1/users/profile`
  - [ ] `GET /api/v1/todos`
  - [ ] `POST /api/v1/todos`
  - [ ] `GET /api/v1/todos/stats`
  - [ ] `GET /api/v1/todos/:id`
  - [ ] `PATCH /api/v1/todos/:id`
  - [ ] `PUT /api/v1/todos/:id`
  - [ ] `PATCH /api/v1/todos/:id/toggle`
  - [ ] `DELETE /api/v1/todos/:id`
- [ ] Add route matcher.
- [ ] Support exact routes.
- [ ] Support parameterized routes.
- [ ] Support wildcard routes only where explicitly needed.
- [ ] Return 404 for no route.
- [ ] Return 405 for matched path with unsupported method if feasible.
- [ ] Add proxy URL builder using `URL`.
- [ ] Preserve query strings.
- [ ] Preserve path params.
- [ ] Add header allowlist.
- [ ] Add hop-by-hop header denylist.
- [ ] Add gateway headers:
  - [ ] `x-gateway-service`
  - [ ] `x-gateway-route`
  - [ ] `x-forwarded-host`
  - [ ] `x-forwarded-proto`
  - [ ] `x-forwarded-for`
- [ ] Add timeout wrapper with `AbortController`.
- [ ] Add retry helper for idempotent methods.
- [ ] Disable mutating retries by default.
- [ ] Preserve upstream status codes.
- [ ] Preserve upstream response body in phase 1 migration.
- [ ] Add development-only debug headers:
  - [ ] `x-gateway-upstream`
  - [ ] `x-gateway-route`

### Validation

```bash
pnpm --filter @todo/api-gateway test
curl -i http://localhost:3003/api/v1
curl -i http://localhost:3003/api/v1/health
curl -i http://localhost:3003/api/v1/todos
```

Expected unauthenticated protected route result:

```text
401 Unauthorized
```

or upstream-equivalent protected response while auth policy is being finished.

### Exit Criteria

- Gateway can route public and protected paths.
- Gateway can proxy to both upstream services.
- Query strings and headers are handled intentionally.
- Route table tests cover every route.

## Phase 4: Health And Readiness Aggregation

### Objective

Make gateway health endpoints useful for local dev, containers, ECS/Kubernetes, and deployment checks.

### Dependencies

- Phase 3 complete.

### Todo

- [ ] Implement `GET /api/v1/health`.
- [ ] Return gateway service name.
- [ ] Return gateway version if available.
- [ ] Return timestamp.
- [ ] Return uptime.
- [ ] Return telemetry config status.
- [ ] Implement `GET /api/v1/health/ready`.
- [ ] Check `nest-api` readiness at `/api/v1/health/ready`.
- [ ] Check `bun-api` readiness at `/api/v1/health/ready`.
- [ ] Check Redis if used by gateway rate limiting.
- [ ] Mark required upstream failures as readiness failure.
- [ ] Allow optional upstream configuration for routes no longer in use.
- [ ] Include per-upstream latency.
- [ ] Add timeout for readiness checks.
- [ ] Add health tests for all-up, partial-down, all-down states.

### Validation

```bash
curl http://localhost:3003/api/v1/health
curl http://localhost:3003/api/v1/health/ready
```

### Exit Criteria

- Health works without upstreams.
- Readiness reflects required upstream availability.
- Container/deployment systems can rely on readiness.

## Phase 5: Authentication And Authorization Boundary

### Objective

Make gateway auth-aware while preserving upstream auth as defense in depth.

### Dependencies

- Phase 3 complete.
- JWT behavior in `apps/api` and `apps/api-bun` understood.

### Todo

- [ ] Define public routes in route metadata.
- [ ] Define protected routes in route metadata.
- [ ] Add auth policy middleware.
- [ ] Allow public routes without token.
- [ ] Reject protected routes without token at gateway.
- [ ] Validate Bearer token format.
- [ ] Validate JWT locally with shared `JWT_SECRET`.
- [ ] Extract user ID and email from token where available.
- [ ] Do not log raw JWT.
- [ ] Add user ID hash to logs, not raw sensitive data.
- [ ] Forward original `authorization` header to upstream.
- [ ] Keep upstream auth validation active.
- [ ] Add tests:
  - [ ] Public route without token.
  - [ ] Protected route without token.
  - [ ] Protected route with invalid token.
  - [ ] Protected route with valid token.
  - [ ] Authorization header is forwarded.
- [ ] Document future JWKS migration in gateway README or auth docs.

### Validation

```bash
curl -i http://localhost:3003/api/v1/todos
curl -i http://localhost:3003/api/v1/todos -H "Authorization: Bearer invalid"
curl -i http://localhost:3003/api/v1/todos -H "Authorization: Bearer $TOKEN"
```

### Exit Criteria

- Gateway blocks unauthenticated protected traffic.
- Gateway forwards valid auth to upstreams.
- Upstreams still enforce auth and ownership.

## Phase 6: REST Route Parity And Migration Coverage

### Objective

Ensure every current frontend REST call works through the gateway with unchanged response semantics.

### Dependencies

- Phase 5 complete.
- Valid test user/token available.

### Todo

- [ ] Test `POST /api/v1/auth/register` through gateway.
- [ ] Test `POST /api/v1/auth/login` through gateway.
- [ ] Test `POST /api/v1/auth/refresh` through gateway.
- [ ] Test `GET /api/v1/auth/profile` through gateway.
- [ ] Test `GET /api/v1/users/profile` through gateway.
- [ ] Test `GET /api/v1/todos` through gateway.
- [ ] Test `POST /api/v1/todos` through gateway.
- [ ] Test `GET /api/v1/todos/stats` through gateway.
- [ ] Test `GET /api/v1/todos/:id` through gateway.
- [ ] Test `PATCH /api/v1/todos/:id` through gateway.
- [ ] Test `PUT /api/v1/todos/:id` through gateway.
- [ ] Test `PATCH /api/v1/todos/:id/toggle` through gateway.
- [ ] Test `DELETE /api/v1/todos/:id` through gateway.
- [ ] Compare gateway responses against direct NestJS API for Nest-owned routes.
- [ ] Compare gateway responses against direct Bun API for Bun-owned routes.
- [ ] Confirm status codes are preserved.
- [ ] Confirm response bodies are preserved.
- [ ] Confirm error bodies are acceptable for frontend clients.
- [ ] Confirm `packages/services` clients work with gateway base URL.

### Validation

```bash
pnpm --filter @todo/api-gateway test
pnpm --filter @todo/services test
```

Manual smoke:

```bash
curl http://localhost:3003/api/v1/todos -H "Authorization: Bearer $TOKEN"
```

### Exit Criteria

- Every frontend-used API route works through the gateway.
- Shared API clients require no consumer-facing API changes.
- Gateway can become frontend base URL.

## Phase 7: Web Frontend Migration

### Objective

Move `apps/web` from direct API selection to gateway-only API access.

### Dependencies

- Phase 6 complete.
- Gateway running on `3003`.

### Todo

- [ ] Update `apps/web/src/config/api.ts`.
- [ ] Prefer `NEXT_PUBLIC_API_GATEWAY_URL`.
- [ ] Fall back to `NEXT_PUBLIC_API_URL`.
- [ ] Remove runtime dependency on `NEXT_PUBLIC_API_MODE`.
- [ ] Remove runtime dependency on `NEXT_PUBLIC_API_BUN_URL`.
- [ ] Update `apps/web/.env.example`.
- [ ] Add `NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3003`.
- [ ] Add `NEXT_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003`.
- [ ] Point compatibility `NEXT_PUBLIC_API_URL` to `http://localhost:3003`.
- [ ] Point compatibility `NEXT_PUBLIC_WS_URL` to `ws://localhost:3003`.
- [ ] Update `apps/web/.env.local`.
- [ ] Update web API integration tests from `localhost:3001` to `localhost:3003`.
- [ ] Update web deploy smoke test to prefer `NEXT_PUBLIC_API_GATEWAY_URL`.
- [ ] Search for remaining web runtime references to:
  - [ ] `NEXT_PUBLIC_API_BUN_URL`
  - [ ] `NEXT_PUBLIC_API_MODE`
  - [ ] `localhost:3001`
  - [ ] `localhost:3002`
- [ ] Keep direct API references only in docs or explicit backend comparison tests.
- [ ] Run web unit/integration tests.
- [ ] Run web e2e todo flows through gateway.

### Validation

```bash
pnpm --filter @todo/web typecheck
pnpm --filter @todo/web test
pnpm --filter @todo/web test:e2e
```

### Exit Criteria

- Web runtime calls only the gateway URL.
- Web tests use gateway as public API surface.
- Existing todo/auth workflows still work.

## Phase 8: Mobile Frontend Migration

### Objective

Move `apps/mobile` from direct API selection to gateway-only API access.

### Dependencies

- Phase 6 complete.
- Gateway reachable from simulator/device.

### Todo

- [ ] Update `apps/mobile/src/config/api.ts`.
- [ ] Prefer `EXPO_PUBLIC_API_GATEWAY_URL`.
- [ ] Fall back to `EXPO_PUBLIC_API_URL`.
- [ ] Remove runtime dependency on `EXPO_PUBLIC_API_MODE`.
- [ ] Remove runtime dependency on `EXPO_PUBLIC_API_BUN_URL`.
- [ ] Update `apps/mobile/.env.example`.
- [ ] Add `EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:3003`.
- [ ] Add `EXPO_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003`.
- [ ] Point compatibility `EXPO_PUBLIC_API_URL` to `http://localhost:3003`.
- [ ] Update `apps/mobile/.env`.
- [ ] Decide simulator URL guidance:
  - [ ] iOS simulator can use `localhost` in many cases.
  - [ ] Android emulator may need `10.0.2.2`.
  - [ ] Physical device needs developer machine LAN IP.
- [ ] Document physical device example:
  - [ ] `EXPO_PUBLIC_API_GATEWAY_URL=http://<lan-ip>:3003`
- [ ] Search for remaining mobile runtime references to:
  - [ ] `EXPO_PUBLIC_API_BUN_URL`
  - [ ] `EXPO_PUBLIC_API_MODE`
  - [ ] `localhost:3001`
  - [ ] `localhost:3002`
- [ ] Update mobile tests/mocks as needed.
- [ ] Run mobile test suite.
- [ ] Run Expo smoke workflow.

### Validation

```bash
pnpm --filter @todo/mobile typecheck
pnpm --filter @todo/mobile test
```

### Exit Criteria

- Mobile runtime calls only the gateway URL.
- Local simulator/device networking path is documented.
- Mobile todo/auth flows work through gateway.

## Phase 9: Local Development And Docker Integration

### Objective

Make the gateway part of the normal local development workflow.

### Dependencies

- Phase 1 scaffold complete.
- Phase 6 route coverage complete.

### Todo

- [ ] Add `api-gateway` to `docker-compose.dev.yml`.
- [ ] Expose port `3003:3003`.
- [ ] Configure container env:
  - [ ] `PORT=3003`
  - [ ] `NEST_API_URL=http://api:3001`
  - [ ] `BUN_API_URL=http://api-bun:3002`
  - [ ] `JWT_SECRET=dev-jwt-secret`
  - [ ] `CORS_ORIGIN=http://localhost:3000`
  - [ ] `OTEL_SERVICE_NAME=todo-api-gateway`
  - [ ] `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318/v1/traces`
- [ ] Add Dockerfile for `apps/api-gateway`.
- [ ] Add development stage.
- [ ] Add production stage.
- [ ] Update web Docker env to gateway URL.
- [ ] Update mobile Docker env to gateway URL.
- [ ] Update web `depends_on` to include gateway.
- [ ] Ensure gateway depends on:
  - [ ] `api`
  - [ ] `api-bun`
  - [ ] `redis` if rate limiting uses Redis
- [ ] Update `scripts/startDev.sh`.
- [ ] Ensure `pnpm dev` starts gateway by default.
- [ ] Update `scripts/dev-backend.sh` if present.
- [ ] Add service-specific startup support:
  - [ ] `SERVICES=api-gateway`
  - [ ] `SERVICES=backend`
  - [ ] `SERVICES=all`
- [ ] Test local full startup.

### Validation

```bash
docker compose -f docker-compose.dev.yml up -d mongodb redis api api-bun api-gateway
curl http://localhost:3003/api/v1/health/ready
pnpm dev
```

### Exit Criteria

- Gateway runs in Docker Compose.
- `pnpm dev` includes gateway.
- Web and mobile local envs point at gateway.

## Phase 10: Observability And Telemetry

### Objective

Make gateway traffic visible through logs, request IDs, and traces.

### Dependencies

- Phase 2 middleware complete.
- OTEL Collector/Jaeger available locally.

### Todo

- [ ] Add OTEL initialization.
- [ ] Set service name to `todo-api-gateway`.
- [ ] Forward `traceparent`.
- [ ] Forward `tracestate`.
- [ ] Forward `baggage`.
- [ ] Add gateway span for each request.
- [ ] Add proxy/upstream span for each upstream call.
- [ ] Add span attributes:
  - [ ] `gateway.route_id`
  - [ ] `gateway.upstream`
  - [ ] `http.method`
  - [ ] `http.route`
  - [ ] `http.status_code`
  - [ ] `gateway.retry_count`
  - [ ] `gateway.fallback_used`
- [ ] Add request ID to every log.
- [ ] Add request ID to every gateway-generated error response.
- [ ] Add upstream latency to logs.
- [ ] Add route ID to logs.
- [ ] Add metrics design or implementation:
  - [ ] Request count.
  - [ ] Request duration.
  - [ ] Upstream error count.
  - [ ] Auth failure count.
  - [ ] Rate-limit count.
- [ ] Validate traces in Jaeger.
- [ ] Validate logs during error scenarios.

### Validation

```bash
curl -H "x-request-id: req_manual_test" http://localhost:3003/api/v1/health/ready
```

Then inspect:

- Gateway logs contain `req_manual_test`.
- Upstream logs contain same request ID.
- Jaeger shows gateway and upstream spans linked.

### Exit Criteria

- A frontend request can be traced through gateway to upstream.
- Errors include useful request IDs.
- Gateway routing decisions are visible in logs.

## Phase 11: OpenAPI, Contract Tests, And Drift Control

### Objective

Make the gateway public contract explicit and prevent silent route drift.

### Dependencies

- Phase 6 route coverage complete.

### Todo

- [ ] Add Elysia OpenAPI plugin to gateway.
- [ ] Add route metadata for public gateway routes.
- [ ] Add `apps/api-gateway/scripts/export-openapi.ts`.
- [ ] Export gateway OpenAPI to a known path.
- [ ] Decide whether generated OpenAPI is committed.
- [ ] Add test ensuring every route table entry has OpenAPI metadata.
- [ ] Add test ensuring every proxied route has an upstream configured.
- [ ] Add contract test for response shape used by `@todo/services`.
- [ ] Add comparison against NestJS OpenAPI for Nest-owned routes.
- [ ] Add comparison against Bun OpenAPI for Bun-owned routes.
- [ ] Add CI command:
  - [ ] `pnpm --filter @todo/api-gateway openapi:export`
- [ ] Add route table drift test.
- [ ] Document process for changing public API routes.

### Validation

```bash
pnpm --filter @todo/api-gateway openapi:export
pnpm --filter @todo/api-gateway test
```

### Exit Criteria

- Gateway public REST contract is documented.
- Proxied routes cannot silently point at missing upstreams.
- Contract drift is caught in tests or CI.

## Phase 12: Canary Routing, Fallback, And Migration Controls

### Objective

Allow controlled migration between NestJS and Bun APIs without frontend changes.

### Dependencies

- Phase 6 route coverage complete.
- Phase 10 observability complete enough to compare behavior.

### Todo

- [ ] Add route-level default upstream.
- [ ] Add environment override for route upstreams.
- [ ] Add development header override:
  - [ ] `x-api-backend: nest`
  - [ ] `x-api-backend: bun`
- [ ] Restrict override header to development or trusted internal users.
- [ ] Add percentage canary config.
- [ ] Add sticky canary by user ID hash.
- [ ] Add read fallback from Bun to Nest for selected routes.
- [ ] Explicitly disable write fallback by default.
- [ ] Add optional idempotency key support for future write fallback.
- [ ] Add shadow read traffic support.
- [ ] Ensure shadow traffic is non-blocking.
- [ ] Ensure shadow traffic excludes writes.
- [ ] Add canary metrics.
- [ ] Add fallback metrics.
- [ ] Add canary tests:
  - [ ] Header override.
  - [ ] Percentage selection.
  - [ ] Sticky user selection.
  - [ ] Read fallback.
  - [ ] Write fallback disabled.

### Validation

```bash
curl http://localhost:3003/api/v1/todos -H "Authorization: Bearer $TOKEN" -H "x-api-backend: bun"
curl http://localhost:3003/api/v1/todos -H "Authorization: Bearer $TOKEN" -H "x-api-backend: nest"
```

### Exit Criteria

- Route traffic can shift between NestJS and Bun at the gateway.
- Read fallback is safe and observable.
- Write fallback is not enabled accidentally.

## Phase 13: Optional GraphQL Gateway

### Objective

Add GraphQL only where it improves frontend data access, without replacing simple REST endpoints unnecessarily.

### Dependencies

- REST gateway stable.
- A concrete frontend use case exists, such as a dashboard aggregation.

### Todo

- [ ] Add `GRAPHQL_ENABLED=false` default.
- [ ] Add `GRAPHQL_PATH=/graphql`.
- [ ] Add GraphQL server integration.
- [ ] Add GraphQL context builder.
- [ ] Read user identity from validated JWT.
- [ ] Add upstream REST clients for resolvers.
- [ ] Add schema:
  - [ ] `User`
  - [ ] `Todo`
  - [ ] `TodoStats`
  - [ ] `Dashboard`
  - [ ] `Query`
  - [ ] `Mutation` only if needed
- [ ] Add `me` query.
- [ ] Add `todos` query.
- [ ] Add `todoStats` query.
- [ ] Add `dashboard` query.
- [ ] Add depth limit.
- [ ] Add complexity limit.
- [ ] Disable production introspection by default.
- [ ] Add resolver tests.
- [ ] Add GraphQL auth tests.
- [ ] Add docs explaining when frontends should use GraphQL versus REST.

### Validation

```bash
curl http://localhost:3003/graphql
```

Run resolver tests:

```bash
pnpm --filter @todo/api-gateway test
```

### Exit Criteria

- GraphQL is feature-flagged.
- GraphQL has security controls.
- GraphQL solves a real aggregation use case.

## Phase 14: Infrastructure And Deployment

### Objective

Deploy the gateway as the public backend entrypoint and make backend APIs internal.

### Dependencies

- Local gateway is stable.
- Frontend migration is complete.
- Observability is adequate.

### Todo

- [ ] Add ECR repository for gateway.
- [ ] Add ECS service for gateway.
- [ ] Add gateway task definition.
- [ ] Add gateway container env vars.
- [ ] Add gateway Secrets Manager values.
- [ ] Add CloudWatch log group.
- [ ] Add ALB target group for gateway.
- [ ] Add ALB listener rule for public API domain/path.
- [ ] Add health check path:
  - [ ] `/api/v1/health/ready`
- [ ] Add security group allowing ALB to gateway.
- [ ] Add security group allowing gateway to NestJS API.
- [ ] Add security group allowing gateway to Bun API.
- [ ] Restrict public access to NestJS API.
- [ ] Restrict public access to Bun API.
- [ ] Update Terragrunt dev environment.
- [ ] Update Terragrunt staging environment.
- [ ] Update Terragrunt production environment.
- [ ] Add GitHub Actions deployment support for gateway image.
- [ ] Add staging frontend env:
  - [ ] `NEXT_PUBLIC_API_GATEWAY_URL`
  - [ ] `EXPO_PUBLIC_API_GATEWAY_URL`
- [ ] Add production frontend env:
  - [ ] `NEXT_PUBLIC_API_GATEWAY_URL`
  - [ ] `EXPO_PUBLIC_API_GATEWAY_URL`
- [ ] Update Kubernetes manifests if Kubernetes deployment remains supported.
- [ ] Add deployment rollback notes.

### Validation

```bash
cd infra/terragrunt/dev/<provider>
terragrunt run-all plan
```

After deploy:

```bash
curl https://api.dev.<domain>/api/v1/health/ready
```

### Exit Criteria

- Gateway is deployed and public.
- Backend APIs are private or restricted.
- Web/mobile deployed environments use gateway URL.

## Phase 15: CI, Quality Gates, And Release Safety

### Objective

Make gateway quality checks part of regular development.

### Dependencies

- Gateway app and tests exist.

### Todo

- [ ] Add CI step for gateway install/build.
- [ ] Add CI step:
  - [ ] `pnpm build:api-gateway`
- [ ] Add CI step:
  - [ ] `pnpm test:api-gateway`
- [ ] Add CI step:
  - [ ] `pnpm --filter @todo/api-gateway typecheck`
- [ ] Add CI step:
  - [ ] `pnpm --filter @todo/api-gateway openapi:export`
- [ ] Add CI route table drift check.
- [ ] Add CI contract test check.
- [ ] Add e2e workflow with gateway.
- [ ] Ensure web e2e uses gateway URL.
- [ ] Ensure mobile smoke tests use gateway URL.
- [ ] Add production deployment approval gate.
- [ ] Add rollback runbook link to deployment docs.

### Validation

CI must pass:

```bash
pnpm quality
pnpm test
pnpm test:e2e
```

Where full repo checks are too slow, at minimum:

```bash
pnpm --filter @todo/api-gateway lint
pnpm --filter @todo/api-gateway typecheck
pnpm --filter @todo/api-gateway test
pnpm --filter @todo/web typecheck
pnpm --filter @todo/mobile typecheck
```

### Exit Criteria

- Gateway cannot regress silently.
- Frontend tests exercise gateway route.
- Public API contract changes are reviewed.

## Phase 16: Production Rollout

### Objective

Move real client traffic to the gateway safely.

### Dependencies

- Staging gateway validated.
- Frontends configured for gateway.
- Rollback path tested.

### Todo

- [ ] Deploy gateway to production.
- [ ] Verify production readiness.
- [ ] Point production web to gateway.
- [ ] Point production mobile to gateway in next EAS release/update.
- [ ] Keep route defaults conservative.
- [ ] Route uncertain traffic to NestJS API first.
- [ ] Enable Bun routing for verified routes.
- [ ] Monitor gateway 4xx and 5xx rates.
- [ ] Monitor upstream 4xx and 5xx rates.
- [ ] Monitor p95 and p99 latency.
- [ ] Monitor auth failures.
- [ ] Monitor rate limiting.
- [ ] Monitor Jaeger traces for representative flows.
- [ ] Gradually increase Bun canary percentages.
- [ ] Remove direct API public exposure after stable period.
- [ ] Remove deprecated frontend env vars after stable period:
  - [ ] `NEXT_PUBLIC_API_BUN_URL`
  - [ ] `NEXT_PUBLIC_API_MODE`
  - [ ] `EXPO_PUBLIC_API_BUN_URL`
  - [ ] `EXPO_PUBLIC_API_MODE`

### Validation

Production checks:

- [ ] Register/login works.
- [ ] Auth refresh works.
- [ ] Profile works.
- [ ] Todo create works.
- [ ] Todo list works.
- [ ] Todo update works.
- [ ] Todo toggle works.
- [ ] Todo delete works.
- [ ] Request IDs appear in production logs.
- [ ] Traces include gateway and upstream spans.

### Exit Criteria

- Production clients use gateway as the only public backend API.
- Backend selection is controlled server-side.
- Direct API exposure is removed or restricted.

## Phase 17: Cleanup And Hardening

### Objective

Remove temporary compatibility paths and harden the gateway for long-term ownership.

### Dependencies

- Production rollout stable.

### Todo

- [ ] Remove frontend API mode switches.
- [ ] Remove direct Bun API public env vars from frontend platforms.
- [ ] Remove direct Nest API public env vars from frontend platforms where safe.
- [ ] Remove obsolete docs mentioning frontend backend selection.
- [ ] Update AGENTS.md if desired with gateway architecture.
- [ ] Add gateway ownership rules to contributor docs.
- [ ] Add public route change checklist.
- [ ] Add service runbook.
- [ ] Add incident response notes.
- [ ] Add performance baseline:
  - [ ] Gateway p50 latency.
  - [ ] Gateway p95 latency.
  - [ ] Gateway p99 latency.
  - [ ] Upstream error rate.
- [ ] Evaluate JWT JWKS migration.
- [ ] Evaluate Redis-backed distributed rate limiting if not already enabled.
- [ ] Evaluate circuit breaker implementation.
- [ ] Evaluate GraphQL persisted queries if GraphQL is enabled.
- [ ] Archive migration-only flags when no longer needed.

### Validation

```bash
rg -n "API_BUN_URL|API_MODE|localhost:3001|localhost:3002" apps/web apps/mobile packages/services
```

Expected result:

- No runtime frontend references to backend-specific URLs.
- Remaining references are explicit tests, docs, or backend-only config.

### Exit Criteria

- Gateway is the durable frontend-facing contract boundary.
- Temporary migration configuration is gone.
- Long-term docs and runbooks exist.

## Cross-Phase Master Checklist

### Code

- [ ] `apps/api-gateway` exists.
- [ ] `@todo/api-gateway` package scripts work.
- [ ] Gateway builds.
- [ ] Gateway typechecks.
- [ ] Gateway tests pass.
- [ ] Gateway Docker image builds.

### Routing

- [ ] Route table covers all frontend-used routes.
- [ ] Route table has owners.
- [ ] Route table has auth policy.
- [ ] Route table has timeout policy.
- [ ] Route table has retry policy.
- [ ] Route table has upstream mapping.

### Security

- [ ] CORS configured.
- [ ] Security headers configured.
- [ ] Rate limits configured.
- [ ] Body limits configured.
- [ ] JWT validation configured.
- [ ] Auth forwarding configured.
- [ ] Upstream auth remains active.

### Frontends

- [ ] Web uses gateway URL.
- [ ] Mobile uses gateway URL.
- [ ] Web tests use gateway URL.
- [ ] Mobile tests use gateway URL.
- [ ] Direct frontend backend selection removed.

### Observability

- [ ] Request IDs generated.
- [ ] Request IDs forwarded.
- [ ] Trace context forwarded.
- [ ] Gateway spans emitted.
- [ ] Upstream spans linked.
- [ ] Errors include request ID.
- [ ] Logs include route and upstream.

### Deployment

- [ ] Gateway deploys to dev.
- [ ] Gateway deploys to staging.
- [ ] Gateway deploys to production.
- [ ] API services are private or restricted.
- [ ] Frontend deployment envs point to gateway.
- [ ] Rollback path tested.

## Suggested PR Breakdown

### PR 1: Gateway Skeleton And Health

- [ ] Scaffold `apps/api-gateway`.
- [ ] Add root scripts.
- [ ] Add config.
- [ ] Add request ID/log/error/CORS/security middleware.
- [ ] Add `/api/v1`, `/health`, `/health/ready`.
- [ ] Add tests.

### PR 2: REST Proxy And Auth

- [ ] Add upstream config.
- [ ] Add route table.
- [ ] Add proxy engine.
- [ ] Add auth policy.
- [ ] Proxy auth/user/todo routes.
- [ ] Add route/proxy/auth tests.

### PR 3: Frontend Migration And Local Dev

- [ ] Update web config/env/tests.
- [ ] Update mobile config/env/tests.
- [ ] Add Docker Compose service.
- [ ] Update dev scripts.
- [ ] Run e2e through gateway.

### PR 4: Observability And Contracts

- [ ] Add trace propagation.
- [ ] Add gateway spans.
- [ ] Add OpenAPI export.
- [ ] Add route drift tests.
- [ ] Add contract tests.

### PR 5: Canary Controls

- [ ] Add route overrides.
- [ ] Add header override for development.
- [ ] Add percentage canary.
- [ ] Add read fallback.
- [ ] Add canary metrics.

### PR 6: Infrastructure

- [ ] Add ECR/ECS/ALB/Secrets changes.
- [ ] Add staging deployment.
- [ ] Add production deployment.
- [ ] Restrict direct API exposure.

### PR 7: Optional GraphQL

- [ ] Add feature-flagged GraphQL endpoint.
- [ ] Add dashboard query.
- [ ] Add security limits.
- [ ] Add resolver tests.

### PR 8: Cleanup And Hardening

- [ ] Remove deprecated frontend env vars.
- [ ] Update docs/runbooks.
- [ ] Add production performance baseline.
- [ ] Add long-term security improvements.
