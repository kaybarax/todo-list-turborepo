# Multi-stage build for Bun/Elysia API
FROM node:22-alpine AS base

WORKDIR /app

# Development stage
FROM base AS development

# Install bun and pnpm for development
RUN apk add --no-cache python3 make g++ && npm install -g pnpm bun

# Copy source code and install deps
COPY . .
RUN pnpm install --no-frozen-lockfile

# Expose port
EXPOSE 3002

# Start development server
CMD ["pnpm", "dev:api-bun"]

# Production dependencies stage
FROM base AS prod-deps

# Install bun and pnpm temporarily for dependency installation
RUN apk add --no-cache python3 make g++ && npm install -g pnpm bun

# Copy full workspace and install only production dependencies
COPY . .
RUN pnpm install --no-frozen-lockfile --prod

# Production build stage
FROM base AS build

# Install bun and pnpm for build
RUN apk add --no-cache python3 make g++ && npm install -g pnpm bun

# Copy source code and install deps
COPY . .
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm build:api-bun

# Production stage
FROM oven/bun:1.1-alpine AS production

# Install curl for health checks (ECS requires a reliable health check)
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S bunjs
RUN adduser -S elysia -u 1001

# Copy package files (only what's needed)
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/api-bun/package.json ./apps/api-bun/

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api-bun/node_modules ./apps/api-bun/node_modules

# Copy built application
COPY --from=build /app/apps/api-bun/dist ./apps/api-bun/dist
COPY --from=build /app/packages ./packages

# Change ownership to bunjs user
RUN chown -R elysia:bunjs /app
USER elysia

# Expose port
EXPOSE 3002

# Health check - uses curl to check the health endpoint
# Non-mutating: only reads from /api/v1/health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/api/v1/health || exit 1

# Start the application
CMD ["bun", "apps/api-bun/dist/index.js"]
