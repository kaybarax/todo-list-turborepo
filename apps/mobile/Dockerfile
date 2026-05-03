# Dockerfile for React Native Mobile Application (for building and testing)
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install Expo CLI
RUN npm install -g @expo/cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development

# Copy source code
COPY . .

# Expose Metro bundler port
EXPOSE 8081

# Expose Expo dev tools port
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Start development server
CMD ["pnpm", "dev:mobile"]

# Build stage for web export
FROM base AS build-web

# Copy source code
COPY . .

# Build for web
RUN pnpm build:mobile:web

# Web production stage
FROM nginx:alpine AS web-production

# Copy built web assets
COPY --from=build-web /app/apps/mobile/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/mobile/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Test stage
FROM base AS test

# Copy source code
COPY . .

# Run tests
CMD ["pnpm", "--filter", "@todo/mobile", "test"]
