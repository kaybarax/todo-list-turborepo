# API Gateway Integration Design

This folder documents the proposed API gateway architecture for the Todo List Turborepo.

These documents describe the proposed API Gateway integration and implementation plan.

## Executive Recommendation

Add a new `apps/api-gateway` service and make it the only public HTTP API surface for web, mobile, and future clients.

Preferred implementation:

- Runtime/framework: **Bun + Elysia**
- Role: **API Gateway plus lightweight Backend-for-Frontend (BFF)**
- Public base URL: `http://localhost:3003` in local development
- Public API prefix: `/api/v1`
- Internal upstreams:
  - NestJS API: `apps/api`, local `http://localhost:3001`
  - Bun/Elysia API: `apps/api-bun`, local `http://localhost:3002`
  - Future services: ingestion read models, blockchain services, notifications, search, billing, etc.

The gateway should own:

- One stable frontend-facing API contract
- Routing between NestJS and Bun APIs
- Auth boundary checks and token forwarding
- REST proxying
- Optional GraphQL aggregation
- CORS, rate limiting, request IDs, trace propagation, error normalization
- Canary routing and progressive migration from NestJS to Bun where useful

The gateway should not own:

- Core todo business rules
- User persistence
- Blockchain write logic
- Long-running ingestion
- Direct MongoDB writes except for future gateway-owned metadata such as API keys, consumer config, or persisted query registry

## Why Bun/Elysia For The Gateway

Bun/Elysia is the recommended choice here because this repository already has `apps/api-bun`, Elysia plugins, Bun tests, OpenAPI export, structured error handling, CORS, security, rate limiting, and JWT patterns. A gateway is I/O-heavy and benefits from a fast runtime, low overhead request handling, and first-class TypeScript ergonomics.

The caveat is important: raw benchmark speed is not the deciding factor by itself. Gateway latency will mostly depend on upstream calls, network hops, auth, serialization, caching, and resilience behavior. Elysia is still a strong fit because it keeps the gateway small and fast while matching the existing Bun service.

## Target Architecture

```text
apps/web
apps/mobile
future clients
    |
    | HTTPS, REST, optional GraphQL
    v
apps/api-gateway  (Bun + Elysia)
    |
    | internal HTTP, trace context, auth forwarding
    +--> apps/api      (NestJS canonical API)
    +--> apps/api-bun  (Bun/Elysia high-throughput API)
    +--> future services
```

## Documentation Map

- [01 Decision Record](./01-decision-record.md)
- [02 Target Architecture](./02-target-architecture.md)
- [03 Gateway Service Design](./03-gateway-service-design.md)
- [04 Routing And Proxy Model](./04-routing-and-proxy-model.md)
- [05 REST And GraphQL Strategy](./05-rest-and-graphql-strategy.md)
- [06 Security And Auth](./06-security-and-auth.md)
- [07 Observability And Resilience](./07-observability-and-resilience.md)
- [08 Frontend Migration Plan](./08-frontend-migration-plan.md)
- [09 Local Dev And Monorepo Setup](./09-local-dev-and-monorepo-setup.md)
- [10 Infrastructure And Deployment](./10-infrastructure-and-deployment.md)
- [11 Testing And Rollout](./11-testing-and-rollout.md)
- [12 Implementation Backlog](./12-implementation-backlog.md)
- [13 Execution Todo Lists](./13-execution-todo-lists.md)

## Naming Proposal

Use the following names consistently:

- Folder in this design package: `docs/api/gateway`
- Runtime app folder: `apps/api-gateway`
- Package name: `@todo/api-gateway`
- Docker service: `api-gateway`
- Container name: `todo-api-gateway-dev`
- Local port: `3003`
- Service name in OpenTelemetry: `todo-api-gateway`
