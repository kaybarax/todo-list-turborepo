# 02 Target Architecture

## High-Level Flow

```text
Client request
  |
  v
API Gateway
  |
  +-- request ID
  +-- trace context
  +-- CORS
  +-- rate limit
  +-- auth policy
  +-- route match
  +-- upstream proxy or composition
  |
  v
Selected upstream API
  |
  v
Gateway response normalizer
  |
  v
Client response
```

## Service Topology

```text
apps/web                  apps/mobile
   |                          |
   | NEXT_PUBLIC_API_         | EXPO_PUBLIC_API_
   | GATEWAY_URL              | GATEWAY_URL
   v                          v
------------------------------------------------
apps/api-gateway
  Runtime: Bun
  Framework: Elysia
  Local port: 3003
  Public prefix: /api/v1
  Optional GraphQL: /graphql
------------------------------------------------
   |                      |
   | NEST_API_URL         | BUN_API_URL
   v                      v
apps/api              apps/api-bun
NestJS                Bun/Elysia
Port 3001             Port 3002
Canonical modules     High-throughput modules
------------------------------------------------
MongoDB, Redis, OTEL Collector, Jaeger
```

## Logical Layers

### 1. Client Contract Layer

This is the API surface the frontends know.

Recommended public endpoints:

```text
GET    /api/v1
GET    /api/v1/health
GET    /api/v1/health/ready
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/profile
GET    /api/v1/users/profile
GET    /api/v1/todos
POST   /api/v1/todos
GET    /api/v1/todos/stats
GET    /api/v1/todos/:id
PATCH  /api/v1/todos/:id
PUT    /api/v1/todos/:id
PATCH  /api/v1/todos/:id/toggle
DELETE /api/v1/todos/:id
```

The gateway may proxy these unchanged at first. Later it can normalize response bodies or compose richer frontend-specific responses.

### 2. Policy Layer

Applied before upstream selection:

- Generate or read `x-request-id`
- Start gateway span
- Validate origin through CORS policy
- Enforce body size limits
- Apply rate limit buckets
- Determine whether route is public or protected
- Optionally validate JWT locally
- Forward `authorization` header to upstream
- Add `x-forwarded-*`, `x-gateway-route`, and trace headers

### 3. Routing Layer

The routing layer maps a request to:

- A direct upstream proxy target
- A gateway-owned handler
- A composed BFF handler
- A GraphQL resolver
- A static gateway health response

Example:

```text
/api/v1/auth/*       -> bun-api by default
/api/v1/users/*      -> nest-api until parity is verified
/api/v1/todos/*      -> bun-api for canary users, otherwise nest-api
/api/v1/health       -> gateway aggregate health
/graphql             -> gateway GraphQL resolvers
```

### 4. Upstream Client Layer

Gateway upstream clients should use the native `fetch` API on Bun.

Responsibilities:

- Build upstream URL safely
- Preserve method, query, selected headers, and body
- Apply timeout with `AbortController`
- Retry only idempotent operations by default
- Translate upstream failures into consistent gateway errors
- Emit metrics per upstream and route

### 5. Response Layer

The gateway should preserve existing response shapes during the first migration.

After stable migration, normalize incrementally:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "timestamp": "2026-05-05T12:00:00.000Z",
  "requestId": "req_..."
}
```

Error response target:

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required",
  "statusCode": 401,
  "timestamp": "2026-05-05T12:00:00.000Z",
  "requestId": "req_..."
}
```

## Runtime Ownership

### Gateway Owns

- Public API route contract
- Route-to-upstream mapping
- Gateway-specific middleware
- CORS allowlists
- Rate limit policy
- Trace propagation
- Optional GraphQL schema/resolvers
- Canary/migration policy
- Public OpenAPI aggregation

### NestJS API Owns

- Existing canonical business modules
- User and todo domain behavior
- Database schemas and business validation
- Any current behavior not yet ported to Bun
- Swagger source for Nest-owned routes

### Bun API Owns

- High-throughput implementations
- Elysia schema-driven routes
- Candidate replacements for Nest routes
- Bun-native auth/todo/user modules
- Bun OpenAPI source for Bun-owned routes

### Ingestion Owns

- Blockchain event processing
- Background writes
- Read model updates
- Long-running jobs

## Suggested Port Map

```text
3000  web
3001  api
3002  api-bun
3003  api-gateway
8081  mobile Metro
16686 Jaeger
27017 MongoDB
6379  Redis
```

## Public Versus Internal Access

Local development can expose all services for debugging.

Staging/production should expose:

- Public: web frontend
- Public: API gateway
- Private: NestJS API
- Private: Bun API
- Private: ingestion
- Private: MongoDB/Redis
- Private or restricted: Jaeger/monitoring
