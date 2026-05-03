# Multi-stage build for NestJS API
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Development stage
FROM base AS development

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

# Copy full workspace and install only production dependencies
COPY . .
RUN pnpm install --no-frozen-lockfile --prod

# Production build stage
FROM base AS build

# Copy source code and install deps
COPY . .
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm build:api

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/v1/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "apps/api/dist/main.js"]
