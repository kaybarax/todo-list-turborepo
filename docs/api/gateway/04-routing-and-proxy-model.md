# 04 Routing And Proxy Model

## Routing Principles

1. Frontends call stable gateway paths.
2. Gateway route config decides the upstream.
3. Routing decisions are observable.
4. Route behavior should be deterministic unless a canary rule explicitly applies.
5. The gateway should preserve method, query, request body, authorization, and trace context by default.
6. Mutating requests should not be retried unless they are explicitly idempotent.

## Initial Static Route Table

```ts
export const routes = [
  {
    id: 'gateway.index',
    publicPath: '/api/v1',
    methods: ['GET'],
    upstream: 'gateway',
    auth: 'public',
    timeoutMs: 1000,
    retries: 0,
    tags: ['gateway'],
    owner: 'gateway',
  },
  {
    id: 'gateway.health',
    publicPath: '/api/v1/health',
    methods: ['GET'],
    upstream: 'gateway',
    auth: 'public',
    timeoutMs: 2000,
    retries: 0,
    tags: ['health'],
    owner: 'gateway',
  },
  {
    id: 'auth.register',
    publicPath: '/api/v1/auth/register',
    methods: ['POST'],
    upstream: 'bun-api',
    upstreamPath: '/api/v1/auth/register',
    auth: 'public',
    timeoutMs: 10000,
    retries: 0,
    tags: ['auth'],
    owner: 'api-bun',
  },
  {
    id: 'auth.login',
    publicPath: '/api/v1/auth/login',
    methods: ['POST'],
    upstream: 'bun-api',
    upstreamPath: '/api/v1/auth/login',
    auth: 'public',
    timeoutMs: 10000,
    retries: 0,
    tags: ['auth'],
    owner: 'api-bun',
  },
  {
    id: 'auth.protected',
    publicPath: '/api/v1/auth/*',
    methods: ['GET', 'POST'],
    upstream: 'bun-api',
    upstreamPath: '/api/v1/auth/*',
    auth: 'required',
    timeoutMs: 10000,
    retries: 0,
    tags: ['auth'],
    owner: 'api-bun',
  },
  {
    id: 'users.profile',
    publicPath: '/api/v1/users/profile',
    methods: ['GET'],
    upstream: 'nest-api',
    upstreamPath: '/api/v1/users/profile',
    auth: 'required',
    timeoutMs: 10000,
    retries: 1,
    tags: ['users'],
    owner: 'api',
  },
  {
    id: 'todos',
    publicPath: '/api/v1/todos/*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    upstream: 'bun-api',
    upstreamPath: '/api/v1/todos/*',
    auth: 'required',
    timeoutMs: 10000,
    retries: 0,
    tags: ['todos'],
    owner: 'api-bun',
  },
];
```

## Upstream Definitions

```ts
export const upstreams = {
  'nest-api': {
    baseUrl: process.env.NEST_API_URL ?? 'http://localhost:3001',
    healthPath: '/api/v1/health/ready',
    serviceName: 'todo-api',
  },
  'bun-api': {
    baseUrl: process.env.BUN_API_URL ?? 'http://localhost:3002',
    healthPath: '/api/v1/health/ready',
    serviceName: 'todo-api-bun',
  },
};
```

## Header Policy

Forward by default:

```text
authorization
content-type
accept
accept-language
user-agent
x-request-id
traceparent
tracestate
baggage
x-environment
x-api-version
```

Add at gateway:

```text
x-gateway-service: todo-api-gateway
x-gateway-route: <route-id>
x-forwarded-host: <original-host>
x-forwarded-proto: <http|https>
x-forwarded-for: <client-ip>
```

Do not forward:

```text
host
connection
keep-alive
transfer-encoding
upgrade
proxy-authenticate
proxy-authorization
te
trailer
```

## Query And Path Handling

The gateway must preserve query parameters exactly unless a route explicitly transforms them.

Example:

```text
GET /api/v1/todos?page=2&limit=20&completed=false
  -> http://localhost:3002/api/v1/todos?page=2&limit=20&completed=false
```

Wildcard replacement:

```text
Public:   /api/v1/todos/:id/toggle
Upstream: /api/v1/todos/:id/toggle
```

The implementation should avoid manual string concatenation where possible. Use `URL`:

```ts
const upstreamUrl = new URL(upstreamPath, upstream.baseUrl);
upstreamUrl.search = incomingUrl.search;
```

## Request Body Policy

For proxied requests:

- `GET` and `HEAD`: no body
- `POST`, `PUT`, `PATCH`, `DELETE`: stream or forward body
- Preserve `content-type`
- Enforce body limits before forwarding

Recommended local body limit:

```text
JSON/API requests: 1 MB
Future upload endpoints: route-specific explicit limits
```

## Timeout Policy

Default:

```text
Gateway health:       1000-2000 ms
Read endpoints:       5000-10000 ms
Write endpoints:      10000 ms
Blockchain endpoints: 15000-30000 ms if added
GraphQL:              10000 ms default, resolver-specific limits
```

Implementation pattern:

```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), route.timeoutMs);

try {
  return await fetch(url, { signal: controller.signal, ...init });
} finally {
  clearTimeout(timeout);
}
```

## Retry Policy

Default:

```text
GET / HEAD / OPTIONS: retry once on network failure or 502/503/504
POST / PUT / PATCH / DELETE: no retry
```

Allow mutating retries only when:

- The endpoint supports an idempotency key.
- The gateway forwards or generates `idempotency-key`.
- The upstream guarantees deduplication.

## Canary Routing

Canary routing enables migration between NestJS and Bun without frontend changes.

Useful selectors:

- Header: `x-api-backend: bun`
- Cookie: `api_backend=bun`
- User ID hash percentage
- Environment flag
- Route-specific percentage

Example:

```ts
{
  id: 'todos.canary',
  publicPath: '/api/v1/todos/*',
  defaultUpstream: 'nest-api',
  canary: {
    upstream: 'bun-api',
    percentage: 10,
    stickyBy: 'user-id',
  },
}
```

## Shadow Traffic

Optional advanced rollout:

- Send the real request to the canonical upstream.
- Send a non-blocking duplicate read request to the candidate upstream.
- Compare status and response shape.
- Never shadow mutating requests unless using isolated test data.

Good first shadow candidates:

- `GET /api/v1/health/ready`
- `GET /api/v1/todos`
- `GET /api/v1/todos/stats`
- `GET /api/v1/users/profile`

## Fallback Policy

Read fallback can be allowed carefully:

```text
If bun-api read route fails with 502/503/504, retry nest-api once.
```

Write fallback should be disabled unless idempotency is implemented. Falling back writes can create duplicate side effects.

## Route Ownership Checklist

Every route entry should answer:

- What public path does the frontend call?
- Which methods are allowed?
- Is auth public, optional, or required?
- Which upstream owns the behavior?
- What is the timeout?
- Are retries allowed?
- Is fallback allowed?
- Does the route preserve or transform response shape?
- Which OpenAPI source documents it?
- What tests prove it?
