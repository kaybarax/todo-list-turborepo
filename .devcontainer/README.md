# Development Container Configuration

This directory contains a comprehensive development container configuration for the Todo App monorepo. The devcontainer provides a fully configured, enterprise-grade development environment with all necessary tools for full-stack and blockchain development.

## 🎯 Key Accomplishments

### Complete Development Environment

- **Multi-Language Support**: Node.js 20, Rust, Python 3.11 for all development needs
- **Blockchain Tools**: Solana CLI, Anchor framework, and Rust toolchain pre-installed
- **DevOps Integration**: Docker-in-Docker, kubectl, Helm, and Minikube ready
- **Database Tools**: MongoDB and Redis clients with connection helpers

### Advanced IDE Integration

- **50+ VS Code Extensions**: Curated extensions for all technologies in the stack
- **Debugging Configurations**: Pre-configured debugging for all applications
- **IntelliSense**: Complete TypeScript, React, Rust, and Solidity support
- **Testing Integration**: Jest, Playwright, and blockchain testing frameworks

### Automation & Productivity

- **Post-Create Scripts**: Automated environment setup and dependency installation
- **Shell Customization**: Enhanced bash/zsh with development aliases and functions
- **Port Forwarding**: Automatic forwarding for all development services
- **Development Helpers**: Custom commands for common development tasks

## Features

### 🛠️ Development Tools

- **Node.js 20** with pnpm package manager
- **TypeScript** with comprehensive configurations
- **Docker** and Docker Compose for containerized development
- **Kubernetes** tools (kubectl, helm, minikube)
- **Git** with useful aliases and configurations

### ⛓️ Blockchain Development

- **Rust** toolchain with Cargo
- **Solana CLI** and development tools
- **Anchor Framework** for Solana program development
- **Hardhat** for Ethereum/Polygon smart contract development

### 🗄️ Database Tools

- **MongoDB** client tools
- **Redis** client tools
- Pre-configured database connections

### 🔧 IDE Integration

- **VS Code** extensions for all technologies
- **ESLint** and **Prettier** configurations
- **Debugging** configurations for all applications
- **Testing** framework integration
- **IntelliSense** for TypeScript, React, and blockchain development

### 📊 Monitoring & Observability

- **Jaeger** for distributed tracing
- **OpenTelemetry** instrumentation
- **MailHog** for email testing

## Quick Start

### Prerequisites

- **Docker Desktop** or **Docker Engine** with Docker Compose
- **VS Code** with the **Dev Containers** extension

### Starting the Development Environment

1. **Open in VS Code**:

   ```bash
   code .
   ```

2. **Reopen in Container**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Select "Dev Containers: Reopen in Container"
   - Wait for the container to build and start

3. **Start Development Services**:
   ```bash
   pnpm dev
   ```

### Alternative: Command Line Setup

```bash
# Build and start the development container
docker compose -f docker-compose.dev.yml up devcontainer -d

# Attach to the container
docker exec -it todo-devcontainer bash

# Install dependencies and start development
pnpm install
pnpm dev
```

## Container Structure

### Base Image

- **Node.js 20** on Debian Bullseye
- **Non-root user** (node) for security
- **System dependencies** for all development tools

### Installed Tools

#### Core Development

- Node.js 20 with npm and pnpm
- TypeScript and ts-node
- Git with useful configurations
- Zsh with Oh My Zsh

#### Blockchain Development

- Rust toolchain with Cargo
- Solana CLI and test validator
- Anchor framework for Solana
- Hardhat for Ethereum development

#### DevOps Tools

- Docker CLI (Docker-in-Docker)
- Kubernetes CLI (kubectl)
- Helm package manager
- Minikube for local Kubernetes

#### Database Clients

- MongoDB shell (mongosh)
- Redis CLI
- Connection helpers and aliases

### VS Code Extensions

The container includes extensions for:

- **Language Support**: TypeScript, JavaScript, Rust, Solidity
- **Frameworks**: React, Next.js, NestJS, React Native
- **Blockchain**: Solidity, Rust Analyzer
- **DevOps**: Docker, Kubernetes, YAML
- **Database**: MongoDB, Redis
- **Testing**: Jest, Test Explorer
- **Productivity**: GitLens, TODO Tree, Thunder Client

## Development Workflow

### Starting Services

```bash
# Start all development servers
pnpm dev

# Start individual services
pnpm dev:web      # Next.js web app (port 3000)
pnpm dev:api      # NestJS API (port 3001)
pnpm dev:mobile   # React Native/Expo (port 8081, 19000-19002)
pnpm dev:ingestion # Ingestion service
pnpm dev:contracts # Hardhat node (port 8545)
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific application
pnpm test:web
pnpm test:api
pnpm test:mobile
pnpm test:contracts
```

### Building

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build:web
pnpm build:api
pnpm build:packages
```

### Database Access

```bash
# Connect to MongoDB
mongo-cli

# Connect to Redis
redis-cli

# Or use full connection strings
mongosh mongodb://admin:password@mongodb:27017/todo-app?authSource=admin
redis-cli -h redis -p 6379
```

### Blockchain Development

```bash
# Solana development
solana config set --url localhost
solana-test-validator  # Start local validator
anchor test           # Run Anchor tests

# Ethereum/Polygon development
npx hardhat node      # Start local node
npx hardhat test      # Run contract tests
npx hardhat console --network localhost
```

## Port Forwarding

The following ports are automatically forwarded:

| Port  | Service            | URL                       |
| ----- | ------------------ | ------------------------- |
| 3000  | Next.js Web App    | http://localhost:3000     |
| 3001  | NestJS API         | http://localhost:3001     |
| 8081  | React Native Metro | http://localhost:8081     |
| 19000 | Expo Dev Tools     | http://localhost:19000    |
| 27017 | MongoDB            | mongodb://localhost:27017 |
| 6379  | Redis              | redis://localhost:6379    |
| 8545  | Hardhat Node       | http://localhost:8545     |
| 16686 | Jaeger UI          | http://localhost:16686    |
| 8025  | MailHog UI         | http://localhost:8025     |

## Useful Commands

### Package Management

```bash
dev                   # Start all development servers
test                  # Run all tests
build                 # Build all applications
clean                 # Clean build artifacts
dev-clean             # Clean and reinstall dependencies
```

### Docker Management

```bash
dc <command>          # Docker compose shortcut
dcu                   # Start all services
dcd                   # Stop all services
dcl <service>         # View service logs
dev-logs <service>    # Follow service logs
dev-restart <service> # Restart specific service
dev-status            # Show environment status
```

### Development Helpers

```bash
dev-help              # Show all available commands
dev-status            # Show development environment status
mongo-cli             # Connect to MongoDB
redis-cli             # Connect to Redis
```

## Debugging

### VS Code Debugging

The container includes debug configurations for:

- **API**: Debug NestJS application
- **Web**: Debug Next.js application
- **Ingestion**: Debug ingestion service

Use `F5` or the Debug panel to start debugging.

### Application Logs

```bash
# View logs for specific services
dev-logs api
dev-logs web
dev-logs mobile
dev-logs mongodb
dev-logs redis
```

### Health Checks

```bash
# Check service health
curl http://localhost:3001/health  # API health
curl http://localhost:3000/api/health  # Web app health

# Check database connections
mongo-cli --eval "db.adminCommand('ping')"
redis-cli ping
```

## Customization

### Adding Extensions

Edit `.devcontainer/devcontainer.json` to add VS Code extensions:

```json
{
  "customizations": {
    "vscode": {
      "extensions": ["your.extension.id"]
    }
  }
}
```

### Environment Variables

Create or modify `.env.development` for custom environment variables:

```bash
# Custom environment variables
CUSTOM_API_URL=http://localhost:3001
CUSTOM_FEATURE_FLAG=true
```

### Shell Configuration

- **Bash**: Modify `.devcontainer/bashrc`
- **Zsh**: Modify `.devcontainer/zshrc`

### Post-Create Scripts

Modify `.devcontainer/post-create.sh` to add custom setup steps that run when the container is created.

## Troubleshooting

### Container Won't Start

1. **Check Docker**: Ensure Docker is running
2. **Check Ports**: Ensure required ports aren't in use
3. **Rebuild Container**: Use "Dev Containers: Rebuild Container"

### Dependencies Issues

```bash
# Clean and reinstall
dev-clean

# Or manually
rm -rf node_modules
pnpm install
```

### Database Connection Issues

```bash
# Check if databases are running
dev-status

# Restart database services
dev-restart mongodb
dev-restart redis
```

### Blockchain Development Issues

```bash
# Reset Solana configuration
rm -rf ~/.config/solana
solana-keygen new --no-bip39-passphrase

# Reset Hardhat network
rm -rf apps/smart-contracts/cache
rm -rf apps/smart-contracts/artifacts
```

## Performance Optimization

### Resource Allocation

The container is configured with:

- **Memory**: Optimized for Node.js development
- **CPU**: Efficient resource usage
- **Storage**: Cached volumes for node_modules

### Development Speed

- **Hot Reload**: All applications support hot reload
- **Incremental Builds**: TypeScript incremental compilation
- **Cached Dependencies**: Persistent node_modules volume

## Security

### Container Security

- **Non-root user**: All processes run as the `node` user
- **Read-only filesystem**: Where possible
- **Minimal attack surface**: Only necessary tools installed

### Development Security

- **Environment isolation**: Development secrets don't affect host
- **Network isolation**: Services communicate through Docker network
- **Secret management**: Use environment variables for sensitive data

## Contributing

When modifying the devcontainer configuration:

1. **Test changes** in a clean environment
2. **Update documentation** if adding new features
3. **Verify all applications** still work correctly
4. **Check resource usage** doesn't exceed reasonable limits

## Support

For issues with the development container:

1. **Check this README** for common solutions
2. **Review container logs**: `docker logs todo-devcontainer`
3. **Rebuild container**: "Dev Containers: Rebuild Container"
4. **Check Docker resources**: Ensure sufficient memory/disk space
