# Bun + Elysia API Documentation

This document provides technical details, operational guides, and parity notes for the Bun-based API service (`apps/api-bun`).

## Overview

The Bun API is a high-performance replica of the original NestJS API. It is built using the Bun runtime and ElysiaJS framework, designed for lower latency and better resource efficiency while maintaining 100% contract parity with the legacy service.

## Local Development

### Prerequisites

- [Bun](https://bun.sh) (v1.0 or higher)
- [pnpm](https://pnpm.io) (v8 or higher)
- Docker (for infrastructure)

### Setup

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Start infrastructure**:

   ```bash
   docker compose -f docker-compose.dev.yml up mongodb redis -d
   ```

3. **Run the service**:
   ```bash
   pnpm dev:api-bun
   ```

The service will be available at `http://localhost:3002`.

### Testing

Run the full suite of unit and integration tests:

```bash
pnpm test:api-bun
```

## Configuration

| Variable          | Description                                              | Default                                       | Required |
| ----------------- | -------------------------------------------------------- | --------------------------------------------- | -------- |
| `NODE_ENV`        | Environment (development, production, test, staging)     | `development`                                 | No       |
| `PORT`            | Port for the server                                      | `3002`                                        | No       |
| `MONGODB_URI`     | MongoDB connection string                                | -                                             | **Yes**  |
| `JWT_SECRET`      | Secret for signing JWT tokens                            | -                                             | **Yes**  |
| `REDIS_URI`       | Redis connection string (optional, falls back to memory) | -                                             | No       |
| `CORS_ORIGIN`     | Allowed CORS origins (comma-separated)                   | `http://localhost:3000,http://localhost:5173` | No       |
| `JAEGER_ENDPOINT` | OpenTelemetry Jaeger endpoint for tracing                | -                                             | No       |

## API Documentation

The API documentation is automatically generated using the OpenAPI (Swagger) plugin.

- **Swagger UI**: `http://localhost:3002/api/docs`
- **Raw OpenAPI JSON**: `http://localhost:3002/api/docs/json`

## Side-by-Side Operation

During the migration phase, both the NestJS and Bun APIs can run simultaneously:

- **NestJS API**: `http://localhost:3001`
- **Bun API**: `http://localhost:3002`

They share the same MongoDB and Redis instances, allowing for seamless testing of both services against the same data.

## Known Parity Exceptions

While the goal is 100% parity, some minor implementation details differ:

1. **Internal Error Messages**: While the HTTP status codes match exactly, the internal text of some error messages might differ slightly due to framework-specific validation libraries (Elysia's TypeBox vs. NestJS's class-validator).
2. **Response Performance**: The Bun API typically exhibits lower latency and lower memory footprint compared to the NestJS version.
3. **OpenTelemetry**: Basic tracing is implemented, but full parity with NestJS's advanced interceptor-based telemetry is a follow-up task.

## Rollout and Rollback

### Rollout Strategy

1. **Stage 1 (Local/CI)**: All integration tests and OpenAPI parity checks pass. (COMPLETED)
2. **Stage 2 (Staging)**: Deploy Bun API alongside NestJS. Configure a subset of traffic or specific clients to use port `3002`.
3. **Stage 3 (Production Canary)**: Deploy Bun API to a small percentage of production nodes.
4. **Stage 4 (Full Cutover)**: Route all traffic to the Bun API.

### Rollback Strategy

Since both services use the same data schema and authentication mechanism:

1. Revert the Load Balancer / Ingress configuration to point back to the NestJS API service.
2. The NestJS service (`apps/api`) should remain active and healthy during the entire rollout process.

## Architecture Highlights

- **Framework**: ElysiaJS for fast, type-safe routing.
- **Validation**: TypeBox for schema-first validation and OpenAPI generation.
- **Cache**: Dual-layer caching (Redis with in-memory fallback).
- **Security**: Strict schema validation (no extra fields), sanitization of user input, and standard security headers.
