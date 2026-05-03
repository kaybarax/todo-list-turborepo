#!/bin/bash

# Post-create script for Todo App Development Container
# This script runs after the container is created

set -e

echo "🚀 Setting up Todo App development environment..."

# Ensure we're in the workspace directory
cd /workspace

# Install dependencies using pnpm
echo "📦 Installing dependencies with pnpm..."
if [ -f "package.json" ]; then
    pnpm install --frozen-lockfile
else
    echo "⚠️  No package.json found, skipping dependency installation"
fi

# Set up git hooks if husky is configured
if [ -d ".husky" ]; then
    echo "🪝 Setting up git hooks..."
    pnpm husky install || echo "⚠️  Husky not available, skipping git hooks setup"
fi

# Build shared packages first
echo "🔧 Building shared packages..."
pnpm build:packages || echo "⚠️  Failed to build packages, continuing..."

# Set up blockchain development environment
echo "⛓️  Setting up blockchain development environment..."

# Initialize Solana keypair for development
if command -v solana &> /dev/null; then
    echo "🔑 Setting up Solana development keypair..."
    solana config set --url localhost
    if [ ! -f ~/.config/solana/id.json ]; then
        solana-keygen new --no-bip39-passphrase --silent
    fi
    echo "Solana public key: $(solana address)"
fi

# Set up Anchor workspace if available
if [ -d "apps/smart-contracts/solana" ] && command -v anchor &> /dev/null; then
    echo "⚓ Setting up Anchor workspace..."
    cd apps/smart-contracts/solana
    anchor keys list || echo "⚠️  No Anchor keys found, run 'anchor keys sync' when ready"
    cd /workspace
fi

# Create development environment file if it doesn't exist
if [ ! -f ".env.development" ]; then
    echo "📝 Creating development environment file..."
    cat > .env.development << EOF
# Development Environment Configuration
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://admin:password@mongodb:27017/todo-app?authSource=admin
REDIS_URI=redis://redis:6379

# API Configuration
API_PORT=3001
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=dev-jwt-secret-change-in-production

# Blockchain Configuration
POLYGON_RPC_URL=http://hardhat-node:8545
SOLANA_RPC_URL=http://localhost:8899
POLKADOT_RPC_URL=ws://localhost:9944

# Development Tools
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces

# Email Configuration (MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EOF
fi

# Set up VS Code workspace settings
echo "⚙️  Setting up VS Code workspace settings..."
mkdir -p .vscode

# Create launch.json for debugging
cat > .vscode/launch.json << EOF
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/apps/api/src/main.ts",
      "outFiles": ["\${workspaceFolder}/apps/api/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Debug Web App",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "\${workspaceFolder}/apps/web",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Ingestion Service",
      "type": "node",
      "request": "launch",
      "program": "\${workspaceFolder}/apps/ingestion/src/main.ts",
      "outFiles": ["\${workspaceFolder}/apps/ingestion/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
EOF

# Create tasks.json for common tasks
cat > .vscode/tasks.json << EOF
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development",
      "type": "shell",
      "command": "pnpm",
      "args": ["dev"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "pnpm",
      "args": ["test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Build All",
      "type": "shell",
      "command": "pnpm",
      "args": ["build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Clean & Install",
      "type": "shell",
      "command": "pnpm",
      "args": ["clean", "&&", "pnpm", "install"],
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start Hardhat Node",
      "type": "shell",
      "command": "pnpm",
      "args": ["dev:contracts"],
      "options": {
        "cwd": "\${workspaceFolder}/apps/smart-contracts"
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "dedicated"
      }
    },
    {
      "label": "Deploy Contracts",
      "type": "shell",
      "command": "pnpm",
      "args": ["deploy:local"],
      "options": {
        "cwd": "\${workspaceFolder}/apps/smart-contracts"
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "dedicated"
      }
    }
  ]
}
EOF

# Create settings.json for workspace-specific settings
cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "javascript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "eslint.workingDirectories": [
    "apps/web",
    "apps/api",
    "apps/mobile",
    "apps/ingestion",
    "apps/smart-contracts",
    "packages"
  ],
  "jest.jestCommandLine": "pnpm test",
  "jest.autoRun": "off",
  "files.associations": {
    "*.env.*": "dotenv"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "solidity.compileUsingRemoteVersion": "v0.8.19",
  "solidity.formatter": "prettier",
  "rust-analyzer.checkOnSave.command": "clippy"
}
EOF

# Set up useful development aliases
echo "🔧 Setting up development aliases..."
cat >> ~/.bashrc << EOF

# Todo App Development Aliases
alias dev='pnpm dev'
alias test='pnpm test'
alias build='pnpm build'
alias clean='pnpm clean'
alias lint='pnpm lint'
alias format='pnpm format'

# Application-specific aliases
alias dev-web='pnpm dev:web'
alias dev-api='pnpm dev:api'
alias dev-mobile='pnpm dev:mobile'
alias dev-ingestion='pnpm dev:ingestion'
alias dev-contracts='pnpm dev:contracts'

# Database aliases
alias mongo-cli='mongosh mongodb://admin:password@mongodb:27017/todo-app?authSource=admin'
alias redis-cli='redis-cli -h redis'

# Docker aliases
alias dc='docker compose -f docker-compose.dev.yml'
alias dcu='docker compose -f docker-compose.dev.yml up'
alias dcd='docker compose -f docker-compose.dev.yml down'
alias dcl='docker compose -f docker-compose.dev.yml logs'

# Kubernetes aliases
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgd='kubectl get deployments'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline'
alias gb='git branch'
alias gco='git checkout'

# Blockchain development aliases
alias solana-logs='solana logs'
alias anchor-test='anchor test'
alias hardhat-console='npx hardhat console --network localhost'
EOF

# Display helpful information
echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "🔧 Available commands:"
echo "  pnpm dev          - Start all development servers"
echo "  pnpm test         - Run all tests"
echo "  pnpm build        - Build all applications"
echo "  pnpm clean        - Clean all build artifacts"
echo ""
echo "🌐 Development URLs (after starting services):"
echo "  Web App:          http://localhost:3000"
echo "  API:              http://localhost:3001"
echo "  Mobile (Expo):    http://localhost:19000"
echo "  Jaeger UI:        http://localhost:16686"
echo "  MailHog UI:       http://localhost:8025"
echo ""
echo "💾 Database connections:"
echo "  MongoDB:          mongodb://admin:password@mongodb:27017/todo-app?authSource=admin"
echo "  Redis:            redis://redis:6379"
echo ""
echo "⛓️  Blockchain development:"
echo "  Hardhat Node:     http://localhost:8545"
echo "  Solana Localnet:  http://localhost:8899"
echo ""
echo "🚀 To get started, run: pnpm dev"
echo ""