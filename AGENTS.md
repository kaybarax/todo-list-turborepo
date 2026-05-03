# AI Agent Guide: Todo List Turborepo

## Architecture Overview

**Turborepo monorepo** with pnpm workspaces managing 4 apps + 7 shared packages. Data flows: Web/Mobile → NestJS API → MongoDB/Redis, with background ingestion processing blockchain data. Multi-network blockchain integration (Polygon/Solana/Polkadot/Moonbeam/Base) via factory pattern in `packages/services`.

**Key structural decisions**: Monorepo enables shared UI components (`packages/ui-web/ui-mobile`) and blockchain services while maintaining deployment independence. Ingestion service decouples blockchain data processing from API responses. **Infrastructure is managed via Terraform/Terragrunt**, enabling a decoupled deployment strategy across Vercel (Web), AWS ECS (API/Ingestion), and EAS (Mobile).

## Critical Workflows

### Development Environment

- **Full dev setup**: `pnpm dev` (runs `scripts/startDev.sh` - starts Docker infra + all apps)
- **Service isolation**: `pnpm dev:web|api|mobile|ingestion` (uses `turbo run dev --filter`)
- **Database**: `pnpm db:setup` (MongoDB migrations + seed), `pnpm db:reset` (clean rebuild)
- **Blockchain tools**: `pnpm blockchain:deps:check` (diagnoses missing Rust/Solana/Anchor), `pnpm blockchain:deps:fix` (auto-installs)

### Contract Development

- **Compile all networks**: `pnpm contracts:compile` (runs `scripts/build-contracts.sh --check-deps`)
- **Network-specific**: `pnpm contracts:polygon|solana|polkadot|moonbeam|base` (includes dep validation)
- **Test contracts**: `pnpm test:contracts` (matrix build across all networks)

### Build & Quality

- **Quick dev build**: `pnpm build:quick` (skips Docker/tests)
- **Full CI build**: `pnpm build` (Turborepo orchestration, dependsOn relationships)
- **Code quality**: `pnpm quality` (lint + typecheck), `pnpm format` (Prettier with Solidity plugin)

### Infrastructure as Code (IaC)

- **Root config**: `infra/terragrunt/root.hcl` (central provider and state management)
- **Env planning**: `cd infra/terragrunt/{env}/{provider} && terragrunt run-all plan`
- **Env application**: `terragrunt run-all apply` (requires approval for production)
- **Secrets**: Managed via AWS Secrets Manager and GitHub Environment Secrets
- **Identity**: AWS OIDC roles for secure, credential-less CI/CD access

## Project Conventions

### Package Management

- **Always use pnpm** (enforced in packageManager field)
- **Namespaced packages**: `@todo/*` prefix (e.g., `@todo/services`, `@todo/ui-web`)
- **Path aliases**: `@todo/*` mappings in `tsconfig.json` (root uses `ignoreDeprecations: "6.0"`)

### Code Organization

- **API modules**: `apps/api/src/{auth,todo,user,blockchain,...}` (controllers/services/schemas)
- **Shared services**: `packages/services/src/{api,blockchain,todo,utils}` (Axios clients, blockchain factory)
- **UI components**: `packages/ui-web/ui-mobile` (DaisyUI + Style Dictionary tokens)
- **Blockchain factory**: `packages/services/src/blockchain/BlockchainServiceFactory.ts` (network abstraction)

### Blockchain Integration

- **Multi-network config**: `packages/services/src/blockchain/networkConfig.ts` (RPC URLs, contract addresses)
- **Service factory pattern**: `BlockchainServiceFactory.create(network)` returns network-specific client
- **Contract artifacts**: Stored in `apps/smart-contracts/{network}/artifacts|target|deployments`

### Testing Strategy

- **Turborepo tasks**: `test`, `test:unit`, `test:integration`, `test:e2e`, `test:contracts`
- **Integration tests**: Root-level `test/integration/` (Jest config in `test/integration/jest.config.js`)
- **E2E**: Playwright in `apps/web/e2e/`, mobile testing frameworks
- **Contract tests**: Network-specific test suites in `apps/smart-contracts/{network}/test/`

### Design System

- **Token generation**: `pnpm tokens:build` (Style Dictionary from `packages/ui-web/tokens/`)
- **Theme integration**: DaisyUI + 30+ themes, runtime switching with persistence
- **Component library**: `packages/ui-web/src/components/` (built on DaisyUI foundation)
- **Visual testing**: Chromatic integration via `pnpm --filter @todo/ui-web test:visual`

## Integration Points

### Infrastructure

- **Docker compose**: `docker-compose.dev.yml` (MongoDB:27017, Redis:6379, Jaeger:16686, MailHog:8025)
- **Health checks**: API `/health`, Web `GET /api/health`
- **Tracing**: OTEL in API (`JAEGER_ENDPOINT`, `OTEL_*` env vars) → Collector → Jaeger UI

### External Dependencies

- **Blockchain RPCs**: Configured in `.env` (local Hardhat: `http://localhost:8545`)
- **WalletConnect**: v2 integration for Web3 wallet connections
- **Database**: MongoDB with Mongoose schemas, Redis for caching/API responses

### Cross-Component Communication

- **API ↔ Blockchain**: `packages/services` provides unified client interfaces
- **Web ↔ API**: RESTful endpoints with JWT auth (`apps/api/src/auth/`)
- **Ingestion ↔ DB**: Background processing updates MongoDB with blockchain events
- **UI packages**: Shared components via pnpm workspace linking

## Key Files & Directories

- `scripts/startDev.sh`: Orchestrates full dev environment (infra + apps)
- `scripts/build-contracts.sh`: Multi-network contract compilation with dep checking
- `packages/services/src/blockchain/`: Core blockchain abstraction layer
- `apps/api/src/telemetry/`: OTEL tracing configuration
- `db/`: MongoDB migrations, seeding, setup scripts
- `infra/terraform/modules/`: Reusable IaC modules for AWS and GitHub
- `infra/terragrunt/`: Live environment configurations (dev, staging, prod)
- `turbo.json`: Build orchestration (dependsOn, caching, outputs)
- `pnpm-workspace.yaml`: Workspace config + shared dependency catalog</content>
  <parameter name="filePath">/Users/kevin/workspace/todo-list-turborepo/AGENTS.md
