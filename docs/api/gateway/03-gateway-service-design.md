# 03 Gateway Service Design

## Proposed App Location

```text
apps/api-gateway/
```

## Package Identity

```json
{
  "name": "@todo/api-gateway",
  "version": "0.0.1",
  "private": true
}
```

## Recommended Dependencies

Runtime dependencies:

```text
elysia
@elysiajs/cors
@elysiajs/openapi
@elysiajs/bearer
@elysiajs/jwt
elysia-helmet
elysia-rate-limit
@sinclair/typebox
ioredis
```

Optional when GraphQL is added:

```text
graphql
graphql-yoga
@graphql-tools/schema
```

Development dependencies:

```text
@types/bun
typescript
eslint
@todo/config-eslint
@todo/config-ts
```

## Scripts

```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "build": "bun build src/index.ts --target=bun --outdir=dist",
    "start:prod": "bun dist/index.js",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
    "openapi:export": "bun scripts/export-openapi.ts"
  }
}
```

## Directory Layout

```text
apps/api-gateway/
  package.json
  tsconfig.json
  eslint.config.js
  Dockerfile
  .env.example
  scripts/
    export-openapi.ts
  src/
    index.ts
    app.ts
    config/
      env.ts
      route-table.ts
      upstreams.ts
    plugins/
      cors.ts
      errors.ts
      logging.ts
      openapi.ts
      rate-limit.ts
      request-id.ts
      security.ts
      telemetry.ts
    middleware/
      auth-policy.ts
      body-limit.ts
      trace-context.ts
    proxy/
      proxy.ts
      headers.ts
      upstream-client.ts
      timeout.ts
      response-normalizer.ts
      retry-policy.ts
    routes/
      index.route.ts
      health.route.ts
      rest-proxy.route.ts
      graphql.route.ts
    graphql/
      schema.ts
      context.ts
      resolvers/
        todos.resolver.ts
        user.resolver.ts
    types/
      route.ts
      upstream.ts
      errors.ts
  test/
    health.test.ts
    route-table.test.ts
    proxy.test.ts
    auth-policy.test.ts
```

## Boot Sequence

```text
index.ts
  - load config
  - initialize Redis if rate limiting needs shared storage
  - initialize telemetry
  - create Elysia app
  - register plugins
  - register routes
  - Bun.serve({ port, fetch: app.handle })
  - graceful shutdown
```

## Core Elysia App Shape

```ts
import { Elysia } from 'elysia';

export const app = new Elysia({ normalize: false })
  .use(errors)
  .use(requestId)
  .use(logging)
  .use(corsPlugin)
  .use(security)
  .use(rateLimitPlugin)
  .use(openapi)
  .use(healthRoutes)
  .group('/api/v1', app => app.use(indexRoute).use(restProxyRoutes))
  .use(graphqlRoute);
```

## Environment Variables

```text
NODE_ENV=development
PORT=3003

PUBLIC_API_PREFIX=/api/v1

NEST_API_URL=http://localhost:3001
BUN_API_URL=http://localhost:3002

JWT_SECRET=dev-jwt-secret
AUTH_VALIDATE_LOCALLY=true
AUTH_FORWARD_AUTHORIZATION=true

CORS_ORIGIN=http://localhost:3000,http://localhost:8081

RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300

PROXY_TIMEOUT_MS=10000
PROXY_RETRY_ATTEMPTS=1

ROUTING_MODE=config
ROUTE_TABLE_PATH=

GRAPHQL_ENABLED=false
GRAPHQL_PATH=/graphql

OTEL_SERVICE_NAME=todo-api-gateway
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
JAEGER_ENDPOINT=http://localhost:4318/v1/traces
```

## Configuration Model

Use typed config and fail fast on invalid values.

Recommended config groups:

- `server`: port, environment, public prefix
- `upstreams`: Nest API URL, Bun API URL, future services
- `cors`: origins, credentials, allowed headers
- `auth`: local validation, forwarding, public route list
- `proxy`: timeout, retry policy, body limit
- `routing`: static table, canary rules, route metadata
- `graphql`: enabled flag, path, introspection policy
- `telemetry`: service name, OTLP endpoint, trace sampling

## Route Metadata

Every route should have explicit metadata:

```ts
type GatewayRoute = {
  id: string;
  publicPath: string;
  methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>;
  upstream: 'nest-api' | 'bun-api' | 'gateway';
  upstreamPath?: string;
  auth: 'public' | 'required' | 'optional';
  timeoutMs: number;
  retries: number;
  tags: string[];
  owner: 'gateway' | 'api' | 'api-bun';
};
```

This avoids hidden behavior and makes migration reviewable.

## Error Categories

Gateway errors should distinguish:

- `GW_ROUTE_NOT_FOUND`: no gateway route matched
- `GW_UPSTREAM_TIMEOUT`: upstream exceeded timeout
- `GW_UPSTREAM_UNAVAILABLE`: connection refused or DNS failure
- `GW_AUTH_REQUIRED`: missing required auth
- `GW_AUTH_INVALID`: invalid token at gateway
- `GW_PAYLOAD_TOO_LARGE`: body limit exceeded
- `GW_BAD_UPSTREAM_RESPONSE`: upstream returned invalid gateway-required shape

## Backend Selection Rules

Initial rule:

- Preserve current frontend behavior by routing default app traffic to `apps/api-bun` only where parity is verified.
- Route anything uncertain to `apps/api`.

Recommended initial routing:

```text
Gateway health              -> gateway
Auth register/login         -> api-bun if parity verified, otherwise api
Auth refresh/profile        -> api-bun if JWT behavior matches, otherwise api
Todos read/list/stats       -> api-bun canary, then api-bun default
Todos writes                -> api first, then api-bun after idempotency/error parity checks
Users profile               -> api first unless api-bun shape matches
```

## Avoiding A Gateway Monolith

Add a new handler in the gateway only when at least one is true:

- The frontend contract must differ from the upstream contract.
- The endpoint composes multiple upstream calls.
- The endpoint is a gateway concern such as health, docs, auth exchange, or config.
- The endpoint needs canary or migration policy.

Otherwise use a route table entry and proxy.
