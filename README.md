# Todo List Turborepo

A full-stack Todo application built as a pnpm + Turborepo monorepo. The repository includes web, mobile, two API runtimes, background ingestion, shared UI and service packages, multi-network blockchain contracts, Docker-based local infrastructure, and Terraform/Terragrunt infrastructure.

## What Is Included

- **Web app**: Next.js 15 App Router, TypeScript, Tailwind CSS, DaisyUI, and the shared web design system.
- **Mobile app**: Expo React Native with shared mobile UI components and theming.
- **NestJS API**: The primary Node.js API service with MongoDB, Redis, JWT auth, Swagger, validation, and OpenTelemetry.
- **Bun API**: A high-performance Bun + Elysia API implementation with MongoDB, Redis/in-memory cache fallback, JWT auth, TypeBox schemas, OpenAPI docs, rate limiting, and security middleware.
- **Ingestion service**: Background worker for blockchain data ingestion and database updates.
- **Smart contracts**: Polygon, Solana, Polkadot, Moonbeam, and Base contract workspaces.
- **Shared packages**: UI libraries, blockchain/API services, utilities, and shared ESLint, TypeScript, Jest, and release configuration.
- **Infrastructure**: Docker Compose for local dependencies, Terraform modules, Terragrunt live environments, GitHub Actions, AWS ECS deployment assets, and Vercel/EAS deployment paths.

## Repository Structure

```text
.
├── apps/
│   ├── web/                 # Next.js 15 web app
│   ├── mobile/              # Expo React Native app
│   ├── api/                 # NestJS API service
│   ├── api-bun/             # Bun + Elysia API service
│   ├── ingestion/           # Blockchain ingestion worker
│   └── smart-contracts/     # Multi-network contracts
│       ├── polygon/         # Solidity / Hardhat contracts
│       ├── solana/          # Rust / Anchor programs
│       ├── polkadot/        # Substrate pallets
│       ├── moonbeam/        # Moonbeam EVM contracts
│       └── base/            # Base L2 contracts
├── packages/
│   ├── ui-web/              # React component library, DaisyUI, Style Dictionary tokens
│   ├── ui-mobile/           # React Native component library
│   ├── services/            # API clients and blockchain service factory
│   ├── utils/               # Shared utility helpers
│   ├── config-eslint/       # Shared ESLint config
│   ├── config-ts/           # Shared TypeScript config
│   ├── config-jest/         # Shared Jest config
│   └── config-release/      # Shared release config
├── db/                      # MongoDB setup, migrations, and seed scripts
├── docs/                    # Architecture, API, blockchain, deployment, and design docs
├── infra/
│   ├── terraform/           # Reusable Terraform modules
│   ├── terragrunt/          # Dev/staging/prod live infrastructure config
│   ├── kubernetes/          # Reference Kubernetes manifests
│   ├── nginx/               # NGINX config
│   └── redis/               # Redis config
├── scripts/                 # Development, build, deployment, blockchain, and cleanup scripts
├── test/                    # Root integration and dependency-management tests
├── docker-compose.dev.yml   # Local MongoDB, Redis, tracing, mail, and blockchain services
├── docker-compose.yml       # Production-oriented Compose file
├── turbo.json               # Turborepo task graph
├── pnpm-workspace.yaml      # Workspace package definitions and catalog
├── package.json             # Root scripts and workspace metadata
└── README.md
```

## Architecture

The user-facing clients call an API service, which persists application data in MongoDB, uses Redis for caching where available, and delegates blockchain-specific behavior to shared services in `packages/services`.

```text
Web / Mobile
    |
    | REST + JWT
    v
NestJS API or Bun API
    |
    | Mongoose / Redis
    v
MongoDB / Redis
    ^
    |
Ingestion worker
    |
    v
Blockchain networks
```

The repository currently contains two API implementations:

- `apps/api` (`@todo/api`) is the NestJS API and remains the default full-stack backend used by the existing backend dev orchestration.
- `apps/api-bun` (`@todo/api-bun`) is the Bun + Elysia API. It runs on port `3002` by default and is useful for performance-focused development, parity testing, and Bun runtime deployment experiments.

Both API services use the same local MongoDB and Redis infrastructure, so they can be run independently or side by side as long as their ports are distinct.

## Prerequisites

- **Node.js >= 22.18.0**. The root `engines` field is authoritative.
- **pnpm >= 9.0.0**. The repo currently pins `pnpm@9.12.0` in `packageManager`.
- **Bun** for `apps/api-bun`.
- **Docker Desktop** or Docker Engine with Docker Compose.
- **Git**.

Optional blockchain tooling:

- Rust and Cargo.
- Solana CLI.
- Anchor CLI.
- Substrate tooling.

Use the repo scripts to inspect or install optional blockchain tools:

```bash
pnpm blockchain:deps:check
pnpm blockchain:deps:fix
```

## Quick Start

```bash
pnpm install

# Start local infrastructure: MongoDB, Redis, Jaeger, MailHog, OTEL collector, Hardhat node
docker compose -f docker-compose.dev.yml up -d

# Prepare MongoDB with migrations and seed data
pnpm db:setup

# Start the standard development environment
pnpm dev
```

Default local URLs:

| Service              | URL                                                                  |
| -------------------- | -------------------------------------------------------------------- |
| Web app              | `http://localhost:3000`                                              |
| NestJS API           | `http://localhost:3001`                                              |
| NestJS API health    | `http://localhost:3001/health`                                       |
| NestJS API docs      | `http://localhost:3001/api`                                          |
| Bun API              | `http://localhost:3002`                                              |
| Bun API health       | `http://localhost:3002/api/v1/health`                                |
| Bun API docs         | `http://localhost:3002/api/docs`                                     |
| Bun API OpenAPI JSON | `http://localhost:3002/api/docs/json`                                |
| Expo Metro           | `http://localhost:8081`                                              |
| Jaeger               | `http://localhost:16686`                                             |
| MailHog              | `http://localhost:8025`                                              |
| MongoDB              | `mongodb://admin:password@localhost:27017/todo-app?authSource=admin` |
| Redis                | `redis://localhost:6379`                                             |

## Development Commands

### All Apps

```bash
pnpm dev             # Full dev setup through scripts/startDev.sh
pnpm dev:frontend    # Web + mobile
pnpm dev:backend     # NestJS API + ingestion
```

`pnpm dev` runs `scripts/startDev.sh`, which checks prerequisites, installs dependencies when needed, starts Docker infrastructure, sets up the database, builds shared packages, and runs Turborepo dev tasks.

### Individual Apps

```bash
pnpm dev:web         # Next.js web app
pnpm dev:mobile      # Expo app
pnpm dev:api         # NestJS API on port 3001
pnpm dev:api-bun     # Bun + Elysia API on port 3002
pnpm dev:ingestion   # Ingestion worker
```

### Bun API

The Bun API lives in `apps/api-bun` and is exposed at `/api/v1/*`.

```bash
pnpm dev:api-bun       # Hot reload with bun --watch
pnpm build:api-bun     # Bun production bundle
pnpm test:api-bun      # Bun test suite

# Package-local OpenAPI workflows
pnpm --filter @todo/api-bun openapi:export
pnpm --filter @todo/api-bun openapi:compare
```

Required environment variables for `@todo/api-bun`:

| Variable          | Required | Default                                       | Notes                                                          |
| ----------------- | -------- | --------------------------------------------- | -------------------------------------------------------------- |
| `NODE_ENV`        | No       | `development`                                 | `development`, `test`, `staging`, or `production`              |
| `PORT`            | No       | `3002`                                        | HTTP port                                                      |
| `MONGODB_URI`     | Yes      | none                                          | MongoDB connection string                                      |
| `JWT_SECRET`      | Yes      | none                                          | JWT signing secret                                             |
| `REDIS_URI`       | No       | none                                          | Uses Redis when provided; cache code has an in-memory fallback |
| `CORS_ORIGIN`     | No       | `http://localhost:3000,http://localhost:5173` | Comma-separated origins                                        |
| `JAEGER_ENDPOINT` | No       | none                                          | OpenTelemetry/Jaeger endpoint                                  |

With the local Docker Compose defaults:

```bash
export MONGODB_URI='mongodb://admin:password@localhost:27017/todo-app?authSource=admin'
export REDIS_URI='redis://localhost:6379'
export JWT_SECRET='local-development-secret'
pnpm dev:api-bun
```

## Build Commands

```bash
pnpm build              # Full monorepo build without Docker
pnpm build:quick        # Fast development build
pnpm build:production   # Production build with extra checks

pnpm build:packages     # Shared packages only
pnpm build:apps         # Apps only
pnpm build:web
pnpm build:api
pnpm build:api-bun
pnpm build:mobile
pnpm build:ingestion
pnpm build:contracts
```

Docker build helpers:

```bash
pnpm docker:build
pnpm docker:build:prod
pnpm infra:compose:build
```

## Testing And Quality

```bash
pnpm test                   # All Turbo test tasks
pnpm test:unit
pnpm test:integration
pnpm test:integration:all
pnpm test:e2e
pnpm test:contracts
pnpm test:api-bun           # Bun API schema, smoke, cache, DB, auth, todo, OpenAPI, and module tests

pnpm lint
pnpm lint:fix
pnpm lint:sh
pnpm typecheck
pnpm quality                # lint + typecheck + shellcheck
pnpm format
pnpm format:check
```

Testing coverage spans:

- React unit and integration tests.
- Playwright E2E tests in `apps/web/e2e`.
- NestJS service, controller, and endpoint tests.
- Bun API tests using `bun test`.
- Root integration tests in `test/integration`.
- Blockchain contract test suites for supported networks.
- UI visual testing through Chromatic for `@todo/ui-web`.

## Database

```bash
pnpm db:setup      # Run setup, migrations, validation, and seed flow
pnpm db:migrate    # Run pending migrations
pnpm db:seed       # Seed sample todo data
pnpm db:reset      # Reset database
pnpm db:rebuild    # Reset and setup
```

The local Compose stack exposes:

- MongoDB on `localhost:27017`.
- Redis on `localhost:6379`.

## Blockchain Development

```bash
pnpm blockchain:deps:check
pnpm blockchain:deps:fix
pnpm blockchain:tools:install
pnpm blockchain:help
pnpm blockchain:help:interactive
```

Compile and test contracts:

```bash
pnpm contracts:compile
pnpm contracts:polygon
pnpm contracts:solana
pnpm contracts:polkadot
pnpm contracts:moonbeam
pnpm contracts:base
pnpm test:contracts
```

Deploy contracts:

```bash
pnpm deploy:contracts
```

Network configuration and factory logic live in:

- `packages/services/src/blockchain/networkConfig.ts`
- `packages/services/src/blockchain/BlockchainServiceFactory.ts`

## Design System

The web design system uses DaisyUI, Tailwind CSS, and Style Dictionary tokens. Mobile has a separate shared component package.

```bash
pnpm tokens:build
pnpm tokens:watch
pnpm tokens:validate
pnpm design-system:build
pnpm design-system:test

pnpm storybook:web
pnpm storybook:build:web
pnpm storybook:mobile
pnpm storybook:build:mobile
```

Key package locations:

- `packages/ui-web/src/components`
- `packages/ui-web/tokens`
- `packages/ui-mobile`

## Documentation

- [Bun + Elysia API Guide](docs/BUN_ELYSIA_API_GUIDE.md)
- [Bun API package README](apps/api-bun/README.md)
- [API database migration policy](docs/API_DATABASE_MIGRATION_POLICY.md)
- [API secrets and configuration](docs/API_SECRETS_AND_CONFIGURATION.md)
- [API deployment quick reference](docs/API_DEPLOYMENT_QUICK_REFERENCE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Blockchain setup guide](docs/BLOCKCHAIN_SETUP.md)
- [Blockchain commands reference](docs/BLOCKCHAIN_COMMANDS.md)
- [Troubleshooting guide](docs/TROUBLESHOOTING.md)
- [DaisyUI + Style Dictionary integration guide](docs/DAISYUI_STYLE_DICTIONARY_INTEGRATION.md)
- [Token management guide](docs/TOKEN_MANAGEMENT_GUIDE.md)
- [Component development workflow](docs/COMPONENT_DEVELOPMENT_WORKFLOW.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

API documentation while running locally:

- NestJS API Swagger: `http://localhost:3001/api`
- Bun API Swagger: `http://localhost:3002/api/docs`
- Bun API OpenAPI JSON: `http://localhost:3002/api/docs/json`

## Infrastructure And Deployment

Infrastructure is managed primarily with Terraform and Terragrunt:

```bash
cd infra/terragrunt/dev/aws
terragrunt run-all plan
terragrunt run-all apply
```

Deployment model:

| Component        | Primary platform                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Web app          | Vercel                                                                                           |
| NestJS API       | AWS ECS Fargate                                                                                  |
| Bun API          | Containerized service, suitable for AWS ECS Fargate or another Bun-compatible container platform |
| Ingestion worker | AWS ECS Fargate                                                                                  |
| Mobile app       | Expo Application Services                                                                        |
| Shared packages  | Consumed through pnpm workspace builds                                                           |

Security and operations features include:

- Terraform state locking and environment-specific configuration.
- AWS OIDC roles for credential-less GitHub Actions access.
- AWS Secrets Manager and GitHub Environment Secrets.
- Immutable container image deployment.
- OpenTelemetry tracing and Jaeger support.
- CloudWatch logging and alarms for AWS-hosted services.

Reference Kubernetes manifests remain under `infra/kubernetes`, but managed services are the primary deployment path.

## Makefile Utilities

```bash
make help
make terraform-fmt
make terraform-validate
make tflint
make infra-iac-check
make colima-deploy-web
make colima-deploy-api
```

## Troubleshooting

### Dependency Or Workspace Issues

```bash
pnpm clean
rm -rf node_modules
pnpm install
```

### Docker Or Database Issues

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d mongodb redis
pnpm db:setup
```

### Bun API Startup Issues

The Bun API validates environment variables on startup. If it exits immediately, check `MONGODB_URI` and `JWT_SECRET` first.

```bash
export MONGODB_URI='mongodb://admin:password@localhost:27017/todo-app?authSource=admin'
export JWT_SECRET='local-development-secret'
export REDIS_URI='redis://localhost:6379'
pnpm dev:api-bun
```

Health check:

```bash
curl http://localhost:3002/api/v1/health
curl http://localhost:3002/api/v1/health/ready
```

### Blockchain Tooling Issues

```bash
pnpm blockchain:deps:check -- --diagnose
pnpm blockchain:deps:fix -- --interactive
```

### Slow Builds

```bash
pnpm build:quick
export TURBO_CACHE_DIR=.turbo
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## Security

Report security issues according to [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
