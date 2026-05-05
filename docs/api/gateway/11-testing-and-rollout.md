# 11 Testing And Rollout

## Testing Pyramid

```text
Unit tests
  route matching
  header filtering
  auth policy
  timeout/retry helpers
  error normalization

Integration tests
  gateway proxy to mock upstreams
  gateway health aggregation
  auth forwarding
  CORS preflight
  OpenAPI export

Contract tests
  gateway routes match public contract
  upstream parity between NestJS and Bun
  response shape stability

E2E tests
  web -> gateway -> upstream
  mobile -> gateway -> upstream
  login and todo flows
```

## Unit Test Examples

Route table:

- `GET /api/v1/health` resolves to gateway handler.
- `POST /api/v1/auth/login` resolves to configured auth upstream.
- `GET /api/v1/todos/abc` resolves to todo upstream.
- Unsupported methods return 405 or route-not-found behavior consistently.

Headers:

- `authorization` is forwarded.
- `host` is not forwarded.
- `x-request-id` is created when missing.
- `traceparent` is preserved.

Auth policy:

- Public route works without token.
- Protected route without token returns 401 before upstream call.
- Protected route with token forwards request.

Timeout:

- Slow upstream returns 504.
- Timeout logs include route ID and upstream.

## Integration Tests

Use Bun tests and local mock upstreams.

Scenarios:

- Gateway proxies JSON body.
- Gateway preserves query string.
- Gateway preserves status code.
- Gateway forwards auth header.
- Gateway maps upstream unavailable to 503.
- Gateway maps upstream timeout to 504.
- Gateway readiness reports degraded upstream.

## Contract Tests

Contract tests should compare gateway public contract against upstream behavior.

Initial checks:

- Every public gateway REST route is documented.
- Every proxied route has an upstream route.
- Auth routes return expected status codes.
- Todo response fields match shared `@todo/services` schemas.

Useful existing assets:

- `apps/api/scripts/dump-openapi.ts`
- `apps/api-bun/scripts/export-openapi.ts`
- `apps/api-bun/scripts/compare-openapi.ts`
- `packages/services/src/api/types.ts`

## Frontend Test Updates

Web:

- Update API integration mocks to gateway origin.
- Run component tests that use `TodoApiClient`.
- Run Playwright todo flows through gateway.

Mobile:

- Update API config tests if present.
- Run todo store tests with gateway base URL.
- Run Expo smoke tests with gateway reachable.

## Rollout Plan

### Step 1: Build Gateway Skeleton

- Add `apps/api-gateway`.
- Add health endpoints.
- Add route table.
- Add proxy client.
- Add request ID/logging/error plugins.
- Add test coverage.

Exit criteria:

- `pnpm --filter @todo/api-gateway test`
- `pnpm --filter @todo/api-gateway typecheck`
- `curl http://localhost:3003/api/v1/health`

### Step 2: Proxy Existing REST Routes

- Add auth routes.
- Add user routes.
- Add todo routes.
- Preserve response shapes.
- Forward JWT.

Exit criteria:

- Login through gateway works.
- Todo list through gateway works.
- Todo create/update/delete through gateway works.

### Step 3: Move Web To Gateway

- Update web env and config.
- Update web tests.
- Run web e2e.

Exit criteria:

- No web runtime reference to Bun API URL.
- Web todo workflows pass through gateway.

### Step 4: Move Mobile To Gateway

- Update mobile env and config.
- Validate simulator and physical device URL strategy.
- Run mobile tests.

Exit criteria:

- No mobile runtime reference to Bun API URL.
- Mobile todo workflows pass through gateway.

### Step 5: Add Canary Routing

- Route selected read endpoints to Bun.
- Compare error rate and latency.
- Expand gradually.

Suggested sequence:

```text
GET /api/v1/health/ready
GET /api/v1/todos/stats
GET /api/v1/todos
GET /api/v1/todos/:id
PATCH /api/v1/todos/:id/toggle
POST /api/v1/todos
PATCH /api/v1/todos/:id
DELETE /api/v1/todos/:id
```

### Step 6: Optional GraphQL

- Add `/graphql` behind a feature flag.
- Start with dashboard read query.
- Add persisted query support later.

## Rollback Tests

Before production rollout, test:

- Change route table from `bun-api` to `nest-api`.
- Restart or reload gateway.
- Confirm frontend behavior is unchanged.
- Simulate `api-bun` outage and verify reads fallback only where configured.
- Simulate `api` outage and verify affected routes fail clearly.

## CI Additions

Root commands:

```bash
pnpm build:api-gateway
pnpm test:api-gateway
pnpm --filter @todo/api-gateway typecheck
pnpm --filter @todo/api-gateway openapi:export
```

Full quality:

```bash
pnpm quality
pnpm test:e2e
```

## Definition Of Done

- Gateway service exists and runs locally.
- Gateway route table covers current frontend API calls.
- Web points to gateway.
- Mobile points to gateway.
- Gateway has health/readiness.
- Gateway emits request IDs.
- Gateway forwards trace context.
- Gateway handles auth routes and protected routes correctly.
- Gateway tests cover route matching, proxying, and error behavior.
- Direct frontend references to `localhost:3001` and `localhost:3002` are removed from runtime config.
- Deployment docs and rollback plan are complete.
