# CLAUDE.md

## Project Overview

Enterprise-grade monorepo (Turborepo) for a todo list application with full-stack web/mobile, blockchain integrations, and a design system.

## Package Manager

**Always use `pnpm`** (v9.12.0). Never use npm or yarn.

## Monorepo Structure

````text
```text
apps/
  api/          # NestJS API server
  web/          # Next.js web application
  mobile/       # Expo mobile app
  ingestion/    # Blockchain data processor
packages/
  dependency-management/  # Dependency validation tests
scripts/          # Shell scripts referenced by pnpm commands
db/             # MongoDB migrations & seeds
infra/
  terraform/    # Reusable IaC modules for AWS & GitHub
  terragrunt/   # Environment-specific configuration
  kubernetes/   # Legacy/Reference manifests
  nginx/        # NGINX configs
  redis/        # Redis configs
````

## Key Commands

```bash
# Development
pnpm dev              # All apps
pnpm dev:web          # Web only
pnpm dev:api          # API only
pnpm dev:mobile       # Mobile only

# Build
pnpm build            # Full build
pnpm build:quick      # Fast dev build

# Quality
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix
pnpm format           # Prettier
pnpm typecheck        # TypeScript
pnpm quality          # lint + typecheck

# Testing
pnpm test             # All tests (coverage depends on per-package Jest config)
pnpm test:unit        # Unit tests
pnpm test:integration # Integration tests
pnpm test:e2e         # Playwright E2E
pnpm test:contracts   # Blockchain contract tests

# Database
pnpm db:setup         # Initialize
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed data
pnpm db:reset         # Clear & reinitialize

# Infrastructure (required for API & integration tests)
pnpm infra:compose:up    # Start MongoDB + Redis via docker-compose.dev.yml
pnpm infra:compose:down  # Stop infrastructure containers

# Design system
pnpm tokens:build     # Build design tokens
pnpm storybook:web    # Launch Storybook

# Infrastructure as Code (IaC)
terragrunt run-all plan   # Plan changes (run in infra/terragrunt/{env}/{provider})
terragrunt run-all apply  # Apply changes (run in infra/terragrunt/{env}/{provider})
```

## First-Time Setup

Copy `.env.example` to `.env` before running any app or test (each app also has its own `.env.example`).

## Tech Stack

- **Web**: Next.js 15, React 19, TypeScript 5.9, Tailwind CSS 3.4, DaisyUI 5.0
- **Mobile**: Expo 54, React Native 0.81, Eva Design + UI Kitten
- **API**: NestJS 11, MongoDB 8, Redis 4, Mongoose, Passport JWT
- **Blockchain**: Hardhat (EVM), Anchor/Rust (Solana), Substrate (Polkadot)
- **Testing**: Jest 30, Playwright 1.54, React Testing Library, Vitest 3.2, Supertest
- **Design System**: Style Dictionary 5, Storybook 8.6, Chromatic
- **Node**: 22.18.0 (enforced via .nvmrc)

## Code Quality

- ESLint 9 with flat config
- Prettier (120 char line width, Solidity plugin)
- Conventional commits enforced by commitlint + husky
- Commit scopes: `web`, `mobile`, `api`, `ingestion`, `contracts`, `ui-web`, `ui-mobile`, `services`, `config`, `deps`, `release`, `docs`, `ci`, `infra`, `db`

## TypeScript

Root `tsconfig.json` uses `ignoreDeprecations: "6.0"` for compatibility. Path aliases use `@todo/*` prefix.

## CI/CD

GitHub Actions (`.github/workflows/`):

- `ci.yml`: lint → typecheck → test (with MongoDB + Redis) → E2E → contract tests (matrix) → design-system → build
- `deploy-*-aws.yml`: Per-app ECS deployment via OIDC + image digests
- `deploy-web-vercel.yml`: Web app deployment via Vercel integration
- `deploy-mobile-eas.yml`: Mobile app deployment via Expo EAS
- `terraform-*.yml`: Automated IaC validation and planning on PRs
- Turbo remote caching via `TURBO_TOKEN` / `TURBO_TEAM` secrets
- Manual approval gates required for production deployments via GitHub Environments
