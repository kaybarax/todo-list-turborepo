# Multi-stage build for Ingestion Service
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
RUN pnpm build:ingestion

# Start development server
CMD ["pnpm", "dev:ingestion"]

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
RUN pnpm build:ingestion

# Production stage
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ingestion -u 1001

# Copy package files (only what's needed)
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/ingestion/package.json ./apps/ingestion/

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/ingestion/node_modules ./apps/ingestion/node_modules

# Copy built application
COPY --from=build /app/apps/ingestion/dist ./apps/ingestion/dist
COPY --from=build /app/packages ./packages

# Change ownership to ingestion user
RUN chown -R ingestion:nodejs /app
USER ingestion

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the application
CMD ["node", "apps/ingestion/dist/index.js"]
