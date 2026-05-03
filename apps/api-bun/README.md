# @todo/api-bun

Bun + Elysia API service.

## Local Development

```bash
pnpm dev:api-bun
```

## Environment Variables

- `PORT`: (Optional) Port for the server. Defaults to 3002.
- `MONGODB_URI`: (Required) MongoDB connection string.
- `JWT_SECRET`: (Required) Secret for signing JWT tokens.
- `REDIS_URI`: (Optional) Redis connection string for caching.
