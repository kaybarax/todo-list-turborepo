# @todo/api-bun

Bun + Elysia API service.

## Local Development

```bash
pnpm dev:api-bun
```

## Environment Variables

| Variable          | Description                                               | Default                                       | Required |
| ----------------- | --------------------------------------------------------- | --------------------------------------------- | -------- |
| `NODE_ENV`        | Environment name (development, production, test, staging) | `development`                                 | No       |
| `PORT`            | Port for the server                                       | `3002`                                        | No       |
| `MONGODB_URI`     | MongoDB connection string                                 | -                                             | **Yes**  |
| `JWT_SECRET`      | Secret for signing JWT tokens                             | -                                             | **Yes**  |
| `REDIS_URI`       | Redis connection string for caching                       | -                                             | No       |
| `CORS_ORIGIN`     | Allowed CORS origins (comma-separated)                    | `http://localhost:3000,http://localhost:5173` | No       |
| `JAEGER_ENDPOINT` | OpenTelemetry Jaeger endpoint for tracing                 | -                                             | No       |
