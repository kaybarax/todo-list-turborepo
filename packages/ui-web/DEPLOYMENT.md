# Deployment Guide - @todo/ui-web

This guide covers the build and deployment process for the `@todo/ui-web` component library.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Package Publishing](#package-publishing)
- [Showcase Deployment](#showcase-deployment)
- [Validation](#validation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the package, ensure you have:

- Node.js 18+ installed
- pnpm 9+ installed
- npm account with publishing permissions
- Access to the monorepo

## Build Process

### 1. Clean Build

```bash
# Clean previous builds
pnpm run clean

# Install dependencies
pnpm install
```

### 2. TypeScript Validation

```bash
# Validate TypeScript configuration
pnpm run typecheck
```

### 3. Build Package

```bash
# Build the library
pnpm run build

# Or build just the library without TypeScript compilation
pnpm run build:lib
```

### Build Outputs

The build process generates the following files in the `dist/` directory:

```text
dist/
├── index.js          # ES module build
├── index.cjs         # CommonJS build
├── index.d.ts        # TypeScript declarations
├── style.css         # Compiled CSS (if applicable)
└── *.map            # Source maps
```

### Build Configuration

The build is configured through:

- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript compilation for build
- `tsconfig.dev.json` - TypeScript configuration for development
- `package.json` - Entry points and exports

## Package Publishing

### 1. Automated Validation

```bash
# Run comprehensive validation
pnpm run validate-packages
```

This validates:

- TypeScript configurations
- Build outputs
- Package imports
- Showcase applications
- Test coverage

### 2. Version Management

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm version-packages
```

### 3. Publishing

```bash
# Dry run (recommended first)
pnpm run publish-packages:dry-run

# Actual publishing
pnpm run publish-packages
```

### Manual Publishing

If you need to publish manually:

```bash
cd packages/ui-web

# Ensure you're logged in
npm whoami

# Build the package
pnpm run build

# Publish
npm publish
```

## Showcase Deployment

### Development Server

```bash
# Start showcase development server
pnpm run showcase:dev
```

The showcase will be available at `http://localhost:3001`

### Production Build

```bash
# Build showcase for production
pnpm run showcase:build
```

### Deployment Options

#### Static Hosting (Vercel, Netlify, etc.)

1. Build the showcase:

   ```bash
   pnpm run showcase:build
   ```

2. Deploy the `showcase/dist` directory to your hosting provider

#### Docker Deployment

Create a `Dockerfile` in the showcase directory:

```dockerfile
FROM nginx:alpine

# Copy built files
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
cd packages/ui-web/showcase
docker build -t ui-web-showcase .
docker run -p 8080:80 ui-web-showcase
```

## Validation

### Pre-deployment Validation

Always run validation before deploying:

```bash
# Full validation suite
./scripts/validate-packages.sh

# Test package installation
./scripts/test-package-installation.sh
```

### Post-deployment Validation

After publishing, verify the package works:

```bash
# Create a test project
mkdir test-installation
cd test-installation
npm init -y

# Install your published package
npm install @todo/ui-web

# Test import
node -e "console.log(Object.keys(require('@todo/ui-web')))"
```

### Visual Regression Testing

```bash
# Run visual tests
pnpm run visual-test

# Run visual tests in CI
pnpm run visual-test:ci
```

## Troubleshooting

### Common Issues

#### Build Failures

**TypeScript Errors:**

```bash
# Check TypeScript configuration
pnpm run typecheck

# Fix common issues
# - Ensure all imports are correctly typed
# - Check tsconfig.json paths
# - Verify lib directory structure
```

**Vite Build Errors:**

```bash
# Check Vite configuration
cat vite.config.ts

# Common fixes:
# - Verify external dependencies are listed
# - Check entry point exists
# - Ensure proper plugin configuration
```

#### Publishing Issues

**Authentication Errors:**

```bash
# Login to npm
npm login

# Verify authentication
npm whoami
```

**Version Conflicts:**

```bash
# Check current version
npm view @todo/ui-web version

# Update version in package.json or use changeset
pnpm changeset
pnpm version-packages
```

**Package Size Issues:**

```bash
# Analyze bundle size
npx bundlephobia @todo/ui-web

# Check what's included in package
npm pack --dry-run
```

#### Import Issues

**Module Resolution:**

```bash
# Verify package.json exports
cat package.json | jq '.exports'

# Check built files
ls -la dist/

# Test import in Node.js
node -e "console.log(require('@todo/ui-web'))"
```

**TypeScript Declaration Issues:**

```bash
# Verify .d.ts files are generated
ls -la dist/*.d.ts

# Check TypeScript configuration
cat tsconfig.json
```

### Debug Mode

Enable debug mode for detailed build information:

```bash
# Vite debug mode
DEBUG=vite:* pnpm run build

# TypeScript verbose mode
pnpm run typecheck --verbose
```

### Getting Help

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review build logs for specific errors
3. Validate your environment meets [prerequisites](#prerequisites)
4. Run the validation scripts to identify issues
5. Check the monorepo documentation for additional guidance

## Environment Variables

The following environment variables can be used:

```bash
# Chromatic project token for visual testing
CHROMATIC_PROJECT_TOKEN=your_token_here

# Custom npm registry
NPM_REGISTRY=https://your-registry.com

# Debug mode
DEBUG=vite:*
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy UI Web Package

on:
  push:
    branches: [main]
    paths: ['packages/ui-web/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Validate packages
        run: pnpm run validate-packages

      - name: Build packages
        run: pnpm run build:packages

      - name: Test package installation
        run: pnpm run test:packages

      - name: Publish packages
        run: pnpm run publish-packages
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

_This deployment guide should be updated as the build and deployment processes evolve._
