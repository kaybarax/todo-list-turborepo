# 09 Local Dev And Monorepo Setup

## Add Workspace App

Create:

```text
apps/api-gateway
```

`pnpm-workspace.yaml` likely already includes `apps/*`. If so, no workspace change is needed.

## Root Package Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "dev:api-gateway": "pnpm --filter @todo/api-gateway dev",
    "build:api-gateway": "turbo run build --filter=@todo/api-gateway",
    "test:api-gateway": "pnpm --filter @todo/api-gateway test"
  }
}
```

## Turborepo

The existing `turbo.json` generic `build`, `lint`, `test`, and `typecheck` tasks should cover the new app if the app defines matching scripts.

If needed, add a no-cache override for gateway typecheck only if Bun/Elysia types create environment-specific issues. Prefer not to add overrides unless required.

## Local Ports

```text
3000 web
3001 NestJS API
3002 Bun API
3003 API Gateway
```

## Docker Compose

Add service:

```yaml
api-gateway:
  build:
    context: .
    dockerfile: apps/api-gateway/Dockerfile
    target: development
  container_name: todo-api-gateway-dev
  restart: unless-stopped
  ports:
    - '3003:3003'
  environment:
    NODE_ENV: development
    PORT: 3003
    NEST_API_URL: http://api:3001
    BUN_API_URL: http://api-bun:3002
    JWT_SECRET: dev-jwt-secret
    CORS_ORIGIN: http://localhost:3000
    OTEL_SERVICE_NAME: todo-api-gateway
    OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4318/v1/traces
  volumes:
    - ./apps/api-gateway:/app/apps/api-gateway
    - ./packages:/app/packages
    - /app/node_modules
    - /app/apps/api-gateway/node_modules
  depends_on:
    - api
    - api-bun
    - redis
  networks:
    - todo-network
  command: pnpm dev:api-gateway
```

Update web service env:

```yaml
web:
  environment:
    NEXT_PUBLIC_API_GATEWAY_URL: http://localhost:3003
    NEXT_PUBLIC_API_URL: http://localhost:3003
    NEXT_PUBLIC_WS_GATEWAY_URL: ws://localhost:3003
    NEXT_PUBLIC_WS_URL: ws://localhost:3003
  depends_on:
    - api-gateway
```

Update mobile service env:

```yaml
mobile:
  environment:
    EXPO_PUBLIC_API_GATEWAY_URL: http://localhost:3003
    EXPO_PUBLIC_API_URL: http://localhost:3003
```

## Dockerfile Shape

Use the same monorepo Docker approach as the existing APIs.

Expected stages:

```text
base
development
builder
production
```

Development command:

```text
pnpm dev:api-gateway
```

Production command:

```text
pnpm --filter @todo/api-gateway start:prod
```

## startDev.sh Integration

Current full dev starts infra and apps. Add gateway as a backend app after `api` and `api-bun`.

Recommended behavior:

- `pnpm dev` starts gateway by default.
- `pnpm dev:backend` starts `api`, `api-bun`, `api-gateway`, and `ingestion`.
- `SERVICES=api-gateway ./scripts/startDev.sh` starts gateway and required infrastructure.

## Local Startup Order

```text
MongoDB
Redis
OTEL Collector / Jaeger
NestJS API
Bun API
API Gateway
Web
Mobile
Ingestion
```

Gateway can technically start before upstreams if readiness reports unavailable upstreams, but developer experience is cleaner if APIs start first.

## Local Smoke Commands

```bash
pnpm dev:api
pnpm dev:api-bun
pnpm dev:api-gateway
```

Health:

```bash
curl http://localhost:3003/api/v1/health
curl http://localhost:3003/api/v1/health/ready
```

Proxy:

```bash
curl http://localhost:3003/api/v1
curl http://localhost:3003/api/v1/auth/profile -H "Authorization: Bearer $TOKEN"
curl http://localhost:3003/api/v1/todos -H "Authorization: Bearer $TOKEN"
```

## OpenAPI Exports

Add:

```bash
pnpm --filter @todo/api-gateway openapi:export
```

Recommended output:

```text
apps/api-gateway/openapi.json
```

Do not commit generated OpenAPI unless the repo already commits generated API specs. If committed, update docs and CI checks accordingly.

## Developer Debugging

Useful headers:

```text
x-request-id
x-gateway-route
x-gateway-upstream
```

In development only, the gateway may return:

```json
{
  "debug": {
    "routeId": "todos",
    "upstream": "bun-api",
    "upstreamUrl": "http://localhost:3002/api/v1/todos"
  }
}
```

Do not expose upstream URLs in production responses.
