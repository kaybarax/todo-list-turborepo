#!/bin/bash

# Post-start script for Todo App Development Container
# This script runs every time the container starts

set -e

echo "🔄 Starting Todo App development environment..."

# Ensure we're in the workspace directory
cd /workspace

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Start background services if they're not running
echo "🔍 Checking background services..."

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    if nc -z localhost $port 2>/dev/null; then
        echo "✅ $service_name is running on port $port"
        return 0
    else
        echo "❌ $service_name is not running on port $port"
        return 1
    fi
}

# Check database services
check_service "MongoDB" 27017 || echo "⚠️  MongoDB not available - make sure docker compose services are running"
check_service "Redis" 6379 || echo "⚠️  Redis not available - make sure docker compose services are running"

# Check if Hardhat node is running
check_service "Hardhat Node" 8545 || echo "ℹ️  Hardhat node not running - start with 'pnpm dev:contracts'"

# Check if Solana test validator is running
if command -v solana &> /dev/null; then
    if solana cluster-version &> /dev/null; then
        echo "✅ Solana cluster is accessible"
    else
        echo "ℹ️  Solana test validator not running - start with 'solana-test-validator'"
    fi
fi

# Update PATH for current session
export PATH="~/.local/share/solana/install/active_release/bin:$PATH"
export PATH="~/.cargo/bin:$PATH"

# Display development status
echo ""
echo "🎯 Development Environment Status:"
echo "  Workspace:        /workspace"
echo "  Node.js:          $(node --version)"
echo "  pnpm:             $(pnpm --version)"
echo "  TypeScript:       $(npx tsc --version)"

if command -v solana &> /dev/null; then
    echo "  Solana CLI:       $(solana --version | head -n1)"
fi

if command -v anchor &> /dev/null; then
    echo "  Anchor CLI:       $(anchor --version)"
fi

if command -v rustc &> /dev/null; then
    echo "  Rust:             $(rustc --version)"
fi

if command -v docker &> /dev/null; then
    echo "  Docker:           $(docker --version)"
fi

if command -v kubectl &> /dev/null; then
    echo "  kubectl:          $(kubectl version --client --short 2>/dev/null || echo 'Not connected to cluster')"
fi

echo ""
echo "🚀 Ready for development!"
echo ""
echo "💡 Quick start commands:"
echo "  pnpm dev          - Start all development servers"
echo "  pnpm test         - Run tests"
echo "  pnpm build        - Build applications"
echo ""
echo "🔧 Individual services:"
echo "  pnpm dev:web      - Start Next.js web app"
echo "  pnpm dev:api      - Start NestJS API"
echo "  pnpm dev:mobile   - Start React Native/Expo"
echo "  pnpm dev:ingestion - Start ingestion service"
echo "  pnpm dev:contracts - Start Hardhat node"
echo ""
echo "📊 Monitoring & Tools:"
echo "  http://localhost:16686  - Jaeger tracing UI"
echo "  http://localhost:8025   - MailHog email UI"
echo ""

# Create a welcome message file
cat > /tmp/welcome.txt << EOF
╔══════════════════════════════════════════════════════════════════════════════╗
║                        Todo App Development Environment                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🚀 Welcome to the Todo App monorepo development environment!               ║
║                                                                              ║
║  This container includes everything you need for full-stack development:    ║
║                                                                              ║
║  📱 Frontend: Next.js 14 with App Router + React Native with Expo          ║
║  🔧 Backend: NestJS with MongoDB and Redis                                  ║
║  ⛓️  Blockchain: Solana, Polkadot, and Polygon smart contracts             ║
║  🐳 DevOps: Docker, Kubernetes, and monitoring tools                       ║
║                                                                              ║
║  Quick Commands:                                                             ║
║  • pnpm dev     - Start all development servers                             ║
║  • pnpm test    - Run comprehensive test suite                              ║
║  • pnpm build   - Build all applications                                    ║
║  • dev-clean    - Clean and reinstall dependencies                          ║
║                                                                              ║
║  🌐 Development URLs:                                                        ║
║  • Web App: http://localhost:3000                                           ║
║  • API: http://localhost:3001                                               ║
║  • Mobile: http://localhost:19000                                           ║
║  • Jaeger: http://localhost:16686                                           ║
║                                                                              ║
║  📚 Documentation: Check README.md files in each app directory              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF

# Display welcome message
cat /tmp/welcome.txt

echo ""
echo "🎉 Environment ready! Happy coding! 🎉"
echo ""