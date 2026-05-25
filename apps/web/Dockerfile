# Multi-stage build for Next.js Web Application
FROM node:26-alpine AS base

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
RUN pnpm build:web

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "dev:web"]

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

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build:web

# Production stage
FROM node:26-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files (only what's needed)
COPY --from=build /app/package.json ./
COPY --from=build /app/apps/web/package.json ./apps/web/

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=build /app/packages ./packages

# Copy Next.js configuration
COPY --from=build /app/apps/web/next.config.js ./apps/web/

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the application
CMD ["pnpm", "--dir", "apps/web", "start"]
