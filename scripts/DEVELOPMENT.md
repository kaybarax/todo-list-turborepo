# Development Guide

This guide covers the comprehensive development workflow for the Todo App monorepo, including service management, dependency handling, and development best practices.

## 🚀 Quick Start

### Complete Development Environment

```bash
# Start all services with dependencies
pnpm dev

# Or use the full script
./scripts/startDev.sh
```

### Specific Development Scenarios

```bash
# Frontend development only
pnpm dev:frontend

# Backend development only
pnpm dev:backend

# Blockchain development only
pnpm dev:blockchain

# Individual services
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
```

## 📋 Development Scripts Overview

### Main Development Script (`startDev.sh`)

Comprehensive development environment startup with service dependency management.

**Features:**

- Intelligent service dependency management
- Flexible service selection
- Health monitoring and graceful shutdown
- Database setup and validation
- Infrastructure service management

**Usage:**

```bash
./scripts/startDev.sh [OPTIONS]

Options:
  --services SERVICES   Services to start (all, api, web, mobile, ingestion, contracts, frontend, backend)
  --skip-deps          Skip dependency installation
  --skip-build         Skip building shared packages
  --no-watch           Disable watch mode
  --no-parallel        Disable parallel execution
  --verbose            Enable verbose output
```

### Specialized Development Scripts

#### Frontend Development (`dev-frontend.sh`)

- **Purpose**: Frontend-focused development
- **Services**: Web app + Mobile app + API dependency
- **Features**: Automatic API dependency management

#### Backend Development (`dev-backend.sh`)

- **Purpose**: Backend-focused development
- **Services**: API + Ingestion + Database dependencies
- **Features**: Database setup and monitoring integration

#### Blockchain Development (`dev-blockchain.sh`)

- **Purpose**: Blockchain contract development
- **Services**: Local blockchain networks (Hardhat, Solana, Polkadot)
- **Features**: Multi-network support and contract deployment

#### Service-Specific Development (`dev-services.sh`)

- **Purpose**: Individual service development
- **Services**: Any single service with smart dependency management
- **Features**: Automatic dependency detection and startup

## 🔧 Service Dependencies

### Dependency Graph

```text
Web App ──────┐
              ├─── API ──────┐
Mobile App ───┘              ├─── MongoDB
                              ├─── Redis
Ingestion ────────────────────┘

Contracts ─── Blockchain Networks (Hardhat/Solana/Polkadot)

Storybook ─── UI Packages
```

### Automatic Dependency Management

The development scripts automatically handle service dependencies:

- **Web/Mobile** → Starts API if not running
- **API/Ingestion** → Starts MongoDB and Redis
- **All Services** → Starts complete infrastructure stack

## 🌐 Development URLs

### Application Services

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api
- **Mobile (Expo)**: http://localhost:19000
- **Mobile (Metro)**: http://localhost:8081

### Development Tools

- **Jaeger Tracing**: http://localhost:16686
- **MailHog**: http://localhost:8025
- **Web Storybook**: http://localhost:6006
- **Mobile Storybook**: http://localhost:6007

### Database Access

- **MongoDB**: mongodb://admin:password@localhost:27017/todo-app?authSource=admin
- **Redis**: redis://localhost:6379

### Blockchain Networks

- **Polygon (Hardhat)**: http://localhost:8545
- **Solana (Local)**: http://localhost:8899
- **Polkadot (Local)**: ws://localhost:9944

## 🔄 Development Workflows

### Full-Stack Development

```bash
# Start everything
pnpm dev

# Access applications
open http://localhost:3000  # Web app
open http://localhost:19000 # Mobile app
```

### Frontend-Only Development

```bash
# Start frontend with API dependency
pnpm dev:frontend

# Develop with hot reload
# Edit files in apps/web/ or apps/mobile/
```

### Backend-Only Development

```bash
# Start backend services
pnpm dev:backend

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/todos
```

### Blockchain Development

```bash
# Start blockchain networks
pnpm dev:blockchain

# Deploy contracts
cd apps/smart-contracts/polygon
pnpm deploy:local

# Test contracts
pnpm hardhat console --network localhost
```

### Component Development

```bash
# Web components
pnpm dev:storybook:web

# Mobile components
pnpm dev:storybook:mobile

# Develop components in isolation
```

## 🛠️ Service Management

### Starting Services

#### All Services

```bash
# Complete development environment
pnpm dev

# With specific options
./scripts/startDev.sh --services all --verbose
```

#### Service Groups

```bash
# Frontend applications
pnpm dev:frontend
./scripts/startDev.sh --services frontend

# Backend services
pnpm dev:backend
./scripts/startDev.sh --services backend
```

#### Individual Services

```bash
# API server only
pnpm dev:api
./scripts/dev-services.sh api

# Web app only
pnpm dev:web
./scripts/dev-services.sh web --no-deps

# Mobile app only
pnpm dev:mobile
./scripts/dev-services.sh mobile
```

### Service Status Monitoring

#### Health Checks

```bash
# API health
curl http://localhost:3001/health

# Web app health
curl http://localhost:3000/api/health

# Database connectivity
pnpm db:test
```

#### Service Logs

```bash
# Docker service logs
docker compose -f docker-compose.dev.yml logs -f api

# Application logs
# Check console output from development scripts
```

### Stopping Services

#### Graceful Shutdown

- Press `Ctrl+C` in the terminal running the development script
- Services will shut down gracefully with cleanup

#### Force Stop

```bash
# Stop all Docker services
docker compose -f docker-compose.dev.yml down

# Stop specific services
docker compose -f docker-compose.dev.yml stop mongodb redis
```

## 🔧 Development Configuration

### Environment Variables

Development scripts use these environment variables:

```bash
# Service selection
export SERVICES=all                    # all, api, web, mobile, ingestion, contracts, frontend, backend
export SKIP_DEPS=false                 # Skip dependency installation
export SKIP_BUILD=false                # Skip package builds
export WATCH_MODE=true                 # Enable watch mode
export PARALLEL=true                   # Enable parallel execution
export VERBOSE=false                   # Enable verbose output

# Database configuration
export MONGODB_URI=mongodb://admin:password@localhost:27017/todo-app?authSource=admin
export REDIS_URI=redis://localhost:6379

# Blockchain configuration
export NETWORK=all                     # all, polygon, solana, polkadot
export DEPLOY_CONTRACTS=true           # Deploy contracts on startup
```

### Development Environment Files

```bash
# Main environment file
.env.development

# Service-specific environment files
apps/api/.env.development
apps/web/.env.development
apps/mobile/.env.development
```

## 🧪 Testing During Development

### Running Tests

```bash
# All tests
pnpm test

# Specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Service-specific tests
pnpm --filter @todo/api test
pnpm --filter @todo/web test
```

### Test Watching

```bash
# Watch mode for tests
pnpm test --watch

# Service-specific watch
cd apps/api && pnpm test:watch
```

### Contract Testing

```bash
# Test blockchain contracts
pnpm test:contracts

# Network-specific testing
cd apps/smart-contracts/polygon
pnpm test

cd ../solana
anchor test --skip-local-validator
```

## 🔍 Debugging

### Application Debugging

#### API Debugging

```bash
# Start API in debug mode
cd apps/api
pnpm start:debug

# Attach debugger on port 9229
```

#### Web App Debugging

```bash
# Next.js debugging
cd apps/web
NODE_OPTIONS='--inspect' pnpm dev

# Browser DevTools debugging available
```

#### Mobile App Debugging

```bash
# React Native debugging
cd apps/mobile
pnpm start

# Use Expo DevTools or React Native Debugger
```

### Database Debugging

```bash
# MongoDB shell
mongo-cli

# Redis CLI
redis-cli -h localhost -p 6379

# Database logs
docker compose -f docker-compose.dev.yml logs mongodb
```

### Blockchain Debugging

```bash
# Hardhat console
cd apps/smart-contracts/polygon
pnpm hardhat console --network localhost

# Solana logs
solana logs

# Check network status
./scripts/dev-blockchain.sh --status
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using a port
lsof -i :3000
lsof -i :3001

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Docker Issues

```bash
# Restart Docker services
docker compose -f docker-compose.dev.yml restart

# Clean Docker resources
docker system prune -f

# Rebuild containers
docker compose -f docker-compose.dev.yml build --no-cache
```

#### Database Connection Issues

```bash
# Reset database
pnpm db:reset

# Check database status
docker compose -f docker-compose.dev.yml ps mongodb

# View database logs
docker compose -f docker-compose.dev.yml logs mongodb
```

#### Dependency Issues

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install

# Rebuild packages
pnpm build:packages
```

#### Blockchain Network Issues

```bash
# Reset Hardhat network
cd apps/smart-contracts/polygon
pnpm hardhat clean
pnpm hardhat node

# Reset Solana validator
solana-test-validator --reset

# Check network connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

### Performance Issues

#### Slow Startup

```bash
# Skip dependency installation
./scripts/startDev.sh --skip-deps

# Skip package builds
./scripts/startDev.sh --skip-build

# Start specific services only
./scripts/startDev.sh --services api
```

#### Memory Issues

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Monitor memory usage
docker stats

# Restart services
docker compose -f docker-compose.dev.yml restart
```

## 📈 Development Best Practices

### Code Quality

- Use ESLint and Prettier for consistent code formatting
- Run type checking with `pnpm typecheck`
- Write tests for new features
- Use conventional commits

### Development Workflow

1. Start with `pnpm dev` for full environment
2. Use service-specific scripts for focused development
3. Run tests frequently during development
4. Use hot reload for rapid iteration
5. Monitor application health and logs

### Database Management

- Use `pnpm db:reset` to reset development data
- Run migrations with `pnpm db:migrate`
- Seed data with `pnpm db:seed`
- Backup important development data

### Blockchain Development

- Test contracts on local networks first
- Deploy to testnets before mainnet
- Verify contract deployments
- Monitor gas usage and optimization

## 🔗 Integration with IDEs

### VS Code

- Use the development container for consistent environment
- Install recommended extensions
- Use debugging configurations in `.vscode/launch.json`
- Utilize integrated terminal for development scripts

### Other IDEs

- Configure TypeScript language server
- Set up ESLint and Prettier integration
- Configure debugging for Node.js applications
- Use terminal integration for development scripts

## 📚 Additional Resources

- [Documentation Index](../docs/README.md)
- [API Documentation](../apps/api/README.md)
- [Web App Documentation](../apps/web/README.md)
- [Mobile App Documentation](../apps/mobile/README.md)
- [Blockchain Development Guide](../apps/smart-contracts/README.md)
- [Testing Guide](../docs/testing/testing-strategy.md)
- [Deployment Guide](../docs/deployment/deployment-guide.md)

## 🤝 Support

For development issues:

1. Check this documentation
2. Review service logs and error messages
3. Check the troubleshooting section
4. Restart services if needed
5. Contact the development team
