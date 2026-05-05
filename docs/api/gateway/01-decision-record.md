# 01 Decision Record

## Decision

Create a dedicated API gateway service at `apps/api-gateway` using Bun + Elysia.

All frontends should send future API traffic to the gateway instead of choosing between `apps/api` and `apps/api-bun` directly.

## Status

Proposed.

## Context

The repository currently has:

- `apps/api`: NestJS API on local port `3001`
- `apps/api-bun`: Bun/Elysia API on local port `3002`
- `apps/web`: Next.js frontend
- `apps/mobile`: Expo frontend
- `packages/services`: shared Axios API clients and blockchain service abstractions
- `apps/ingestion`: background blockchain/event processing
- Docker infrastructure for MongoDB, Redis, Jaeger, OTEL Collector, MailHog, and local blockchain nodes

The current frontend configuration exposes multiple API choices:

- Web:
  - `NEXT_PUBLIC_API_URL=http://localhost:3001`
  - `NEXT_PUBLIC_API_BUN_URL=http://localhost:3002`
  - `NEXT_PUBLIC_API_MODE=bun`
- Mobile:
  - `EXPO_PUBLIC_API_URL=http://localhost:3001`
  - `EXPO_PUBLIC_API_BUN_URL=http://localhost:3002`
  - `EXPO_PUBLIC_API_MODE=standard`

That mode switch is useful for experiments, but it leaks backend topology into clients. As more APIs appear, every frontend would need to know too much about backend deployment details.

## Chosen Direction

Move backend selection behind a gateway.

Frontend clients should use one base URL:

```text
Web:    NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3003
Mobile: EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:3003
```

The gateway decides whether each request goes to the NestJS API, the Bun API, GraphQL resolvers, or future services.

## Why Not Only Vercel / ALB / NGINX Routing

External infrastructure routing is useful, but it is too limited for the application-level needs here.

Infrastructure load balancers are good for:

- TLS termination
- Host/path routing
- Health-based target selection
- Basic WAF/rate limits
- Service exposure

This project also needs:

- Auth-aware routing
- API version mediation
- Response normalization
- GraphQL aggregation
- Per-user or per-feature canaries
- Request/response shaping for web and mobile
- Trace, request ID, and error envelope consistency
- Backend migration without frontend changes

Those belong in an application gateway/BFF.

## Why Bun/Elysia Instead Of NestJS For The Gateway

Use Bun/Elysia because:

- The repo already has an Elysia API with plugins for CORS, security, rate limiting, JWT, logging, OpenAPI, and schema validation.
- Gateway workloads are mostly I/O-bound and benefit from low overhead request handling.
- Elysia makes small composable route/proxy modules easy to keep lightweight.
- Bun has excellent startup time for horizontally scaled services.
- The gateway can share conventions with `apps/api-bun`.

Use NestJS if the team decides the gateway will become a large policy engine with many domain modules, complex DI, decorators, and enterprise workflows. That is not the recommended first shape. Start thin and fast.

## Consequences

Positive:

- Frontends get one stable API base URL.
- Backend APIs can evolve independently.
- Bun API adoption can be gradual and reversible.
- Observability and policy become consistent at the edge of the backend.
- Future clients do not need to learn internal service topology.

Tradeoffs:

- Adds another service to run, test, deploy, and observe.
- Adds one network hop for proxied requests.
- Gateway code must be intentionally kept thin to avoid becoming a monolith.
- Requires a clear ownership model for route contracts and upstream routing.

## Guardrails

- Gateway logic must be contract, policy, routing, or composition logic.
- Business rules stay in `apps/api`, `apps/api-bun`, or shared packages.
- Direct database access from the gateway is disallowed for todo/user domain writes.
- Every gateway route must have an explicit owner, upstream, auth policy, timeout, and observability label.
- GraphQL should be added incrementally, not as a forced replacement for all REST endpoints.
