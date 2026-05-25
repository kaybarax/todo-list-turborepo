# Multi-stage build for NestJS API
FROM node:26-alpine AS base

WORKDIR /app

# Development stage
FROM base AS development

# Install native build tooling and pnpm for development
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev bash && npm install -g pnpm

# Copy source code and install deps
COPY . .
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm build:api

# Expose port
EXPOSE 3001

# Start development server
CMD ["pnpm", "dev:api"]

# Production dependencies stage
FROM base AS prod-deps

# Install native build tooling and pnpm temporarily for dependency installation
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev bash && npm install -g pnpm

# Copy full workspace and install only production dependencies
COPY . .
RUN pnpm install --no-frozen-lockfile --prod

# Production build stage
FROM base AS build

# Install native build tooling and pnpm for build
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev bash && npm install -g pnpm

# Copy source code and install deps
COPY . .
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm build:api

# Production stage
FROM node:26-alpine AS production

# Install curl for health checks (ECS requires a reliable health check)
RUN apk add --no-cache curl

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files (only what's needed)
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/api/package.json ./apps/api/

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy built application
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages ./packages

# Change ownership to nodejs user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Health check - uses curl to check the health endpoint
# Non-mutating: only reads from /api/v1/health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1

# Start the application
CMD ["node", "apps/api/dist/main.js"]
