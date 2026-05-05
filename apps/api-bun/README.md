# @todo/api-bun

High-performance Bun + Elysia replica of the NestJS Todo API.

## Features

- **Runtime**: Bun (v1.0+)
- **Framework**: ElysiaJS
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis with in-memory fallback
- **Security**: JWT Auth, TypeBox validation, Input sanitization
- **Documentation**: OpenAPI (Swagger) built-in

## Local Development

### Prerequisites

- [Bun](https://bun.sh)
- [pnpm](https://pnpm.io)

### Commands

```bash
# Start development server with hot-reload
pnpm dev:api-bun

# Run unit and integration tests
pnpm test:api-bun

# Build for production
pnpm build:api-bun

# Start production build
pnpm start:api-bun
```

## Documentation

Full technical documentation and parity notes can be found in [docs/api/bun-elysia-api-guide.md](../../docs/api/bun-elysia-api-guide.md).

- **Swagger UI**: `/api/docs` (when running: `http://localhost:3002/api/docs`)
- **OpenAPI JSON**: `/api/docs/json`

## Environment Variables

| Variable          | Description                                | Default                                       |
| ----------------- | ------------------------------------------ | --------------------------------------------- |
| `NODE_ENV`        | Environment (development, production, etc) | `development`                                 |
| `PORT`            | Port to listen on                          | `3002`                                        |
| `MONGODB_URI`     | MongoDB connection string (**Required**)   | -                                             |
| `JWT_SECRET`      | JWT signing secret (**Required**)          | -                                             |
| `REDIS_URI`       | Redis connection string                    | -                                             |
| `CORS_ORIGIN`     | Allowed CORS origins                       | `http://localhost:3000,http://localhost:5173` |
| `JAEGER_ENDPOINT` | OpenTelemetry Jaeger endpoint              | -                                             |
