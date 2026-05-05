# 06 Security And Auth

## Security Recommendation

The API gateway should be the public security boundary.

It should:

- Enforce CORS.
- Apply rate limits.
- Validate request body size.
- Normalize security headers.
- Understand route auth policy.
- Forward authorization to upstreams.
- Optionally validate JWT locally.

The backend APIs should continue enforcing auth too. Gateway auth is not a replacement for upstream auth.

## Defense In Depth

```text
Client
  -> Gateway auth/policy check
  -> Upstream API auth/ownership check
  -> Database/domain authorization
```

This prevents a private upstream from accidentally becoming unsafe if exposed internally or called by another service.

## Public Routes

Initial public routes:

```text
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/health/ready
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Protected routes:

```text
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

## JWT Strategy

Recommended initial strategy:

- Gateway verifies JWT signature locally for protected routes.
- Gateway forwards original `authorization: Bearer <token>` to upstream.
- Upstream APIs continue verifying JWT and user ownership.
- `JWT_SECRET` must be identical across gateway and APIs until a JWKS/key rotation model is introduced.

Why validate at gateway:

- Rejects invalid requests before upstream fanout.
- Enables auth-aware routing/canaries.
- Enables GraphQL auth context.
- Gives consistent 401 handling.

Why keep upstream validation:

- Defense in depth.
- Internal callers still need authorization.
- Prevents gateway bugs from bypassing domain protections.

## Future Auth Upgrade

Move from shared `JWT_SECRET` to key-based verification:

```text
Auth issuer signs token with private key.
Gateway and APIs verify with JWKS public keys.
```

Benefits:

- Safer rotation.
- No shared symmetric secret in every service.
- Better multi-environment hygiene.

## Header Security

Use Elysia helmet/security plugin to set:

```text
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: no-referrer
cross-origin-resource-policy: same-site
```

Content Security Policy is mostly a web frontend concern, but gateway docs and GraphQL explorer should not weaken it.

## CORS Policy

Local:

```text
http://localhost:3000
http://localhost:8081
```

Staging/production:

```text
https://<staging-web-domain>
https://<production-web-domain>
```

Mobile apps do not rely on browser CORS in the same way, but Expo web and development tooling do.

Allowed headers:

```text
content-type
authorization
x-request-id
x-api-version
x-environment
traceparent
tracestate
baggage
```

Allowed methods:

```text
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

## Rate Limiting

Apply route-specific limits.

Suggested defaults:

```text
Auth login/register:       10 requests/min/IP
Auth refresh:              30 requests/min/user
Todo reads:               300 requests/min/user
Todo writes:               60 requests/min/user
GraphQL:                  120 requests/min/user
Gateway health:           600 requests/min/IP
```

For distributed deployment, use Redis-backed rate limiting. In local development, in-memory limits are acceptable.

## Abuse Controls

Add:

- Maximum request body size.
- Maximum URL length.
- Maximum query parameter count.
- GraphQL depth and complexity limits if GraphQL is enabled.
- Login brute-force limits by IP and email.
- Consistent audit logging for auth failures.

## Secrets

Gateway secrets:

```text
JWT_SECRET or JWKS_URL
REDIS_URI
NEST_API_URL
BUN_API_URL
OTEL_EXPORTER_OTLP_ENDPOINT
```

Production secrets should be managed through:

- AWS Secrets Manager
- GitHub Environment Secrets
- Terraform/Terragrunt modules already used in the repo

Do not expose internal upstream URLs through `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`.

## Service-To-Service Trust

When backends become private:

- Gateway reaches APIs through VPC/internal service discovery.
- APIs reject public internet traffic at network level.
- Optional: add service token or mTLS between gateway and APIs.

Suggested internal header:

```text
x-internal-gateway: todo-api-gateway
```

Do not trust this header by itself unless network access is restricted or it is cryptographically signed.
