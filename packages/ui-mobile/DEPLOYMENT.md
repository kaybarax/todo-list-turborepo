# Deployment Guide - @todo/ui-mobile

This package is now a pure React Native component library published to npm and consumed by the Expo app in `apps/mobile`. It no longer ships or deploys its own standalone Expo "showcase" application (previously under `packages/ui-mobile/showcase`). All runtime validation happens via the consuming app and any Storybook/visual regression tooling that still exists in the monorepo.

If you are looking for how to integrate the components into the mobile app, see [Consumer Integration](#consumer-integration).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Package Publishing](#package-publishing)
- [Local Development Workflow](#local-development-workflow)
- [Consumer Integration](#consumer-integration)
- [Validation](#validation)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)
- [Environment Variables](#environment-variables)
- [Package Distribution](#package-distribution)

## Prerequisites

You need:

- Node.js 18+
- pnpm 9+
- npm account with publish rights (and `NPM_TOKEN` for CI)
- React Native / Expo development environment (only required if you will run `apps/mobile` locally)
- Access to the monorepo

> Expo CLI & EAS are no longer required for this package itself; use them only from `apps/mobile`.

## Build Process

### 1. Clean & Install

```bash
pnpm run clean
pnpm install
```

### 2. TypeScript & Lint

```bash
pnpm run typecheck
pnpm run lint
```

### 3. Build Library

```bash
pnpm run build        # Full build (types + bundles)
# or
pnpm run build:lib    # JS bundles only if that script exists
```

### Build Outputs

```text
dist/
├── index.js      # ES module
├── index.cjs     # CommonJS
├── index.d.ts    # Type declarations
└── *.map         # Source maps
```

### Configuration Sources

- `vite.config.ts` – library bundling
- `tsconfig.json` – build TS settings
- `tsconfig.dev.json` – dev/editor settings
- `package.json` – exports / entry points / peer deps

## Package Publishing

### 1. Validation (Monorepo Wide)

```bash
pnpm run validate-packages
```

This typically checks:

- TypeScript builds
- Inter-package imports
- Linting & tests
- (Optional) visual regression / Storybook build

### 2. Versioning (Changesets)

```bash
pnpm changeset           # author a changeset
pnpm version-packages    # applies versions across affected packages
```

### 3. Publish

```bash
pnpm run publish-packages:dry-run
pnpm run publish-packages
```

### Manual (Single Package)

```bash
cd packages/ui-mobile
pnpm run build
npm publish               # ensure you are authenticated first
```

## Local Development Workflow

The recommended way to iterate on components is side‑by‑side with the consuming Expo app:

1. Start a type/watch build (if script exists):

```bash
cd packages/ui-mobile
pnpm run dev   # or pnpm run build --watch
```

1. Run the Expo app:

```bash
cd apps/mobile
pnpm start
```

1. Edit component code; the app reloads via Metro / Expo fast refresh.

Because this is a monorepo using pnpm workspaces, no manual linking (`npm link`) is required; local sources are symlinked automatically.

### Testing Changes Before Publish

Optionally create a throwaway Expo project to simulate external consumption:

```bash
npx create-expo-app tmp-consumer
cd tmp-consumer
pnpm add @todo/ui-mobile
```

To test unpublished changes externally you can use Verdaccio or `npm pack`:

```bash
cd packages/ui-mobile
npm pack
cd ../../tmp-consumer
pnpm add ../packages/ui-mobile/@todo-ui-mobile-*.tgz
```

## Consumer Integration

In `apps/mobile` (Expo / React Native), install (already provided by workspace):

```bash
pnpm add @todo/ui-mobile
```

Peer dependencies you must also have (exact list may vary — check `package.json`):

```bash
pnpm add react react-native @ui-kitten/components @eva-design/eva react-native-vector-icons
```

Basic usage:

```tsx
import { Button } from '@todo/ui-mobile';

export function Demo() {
  return <Button appearance="filled">Tap me</Button>;
}
```

Ensure your root app sets up theming (example only):

```tsx
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

export function App() {
  return (
    <ApplicationProvider {...eva} theme={eva.light}>
      {/* rest of app */}
    </ApplicationProvider>
  );
}
```

## Validation

### Pre-Publish

```bash
pnpm run typecheck
pnpm run build
pnpm run test         # if tests exist
pnpm run lint
./scripts/test-package-installation.sh   # monorepo utility
```

### Post-Publish Smoke Test

```bash
mkdir tmp-smoke && cd tmp-smoke
npx react-native init SmokeApp --template react-native-template-typescript
cd SmokeApp
npm install @todo/ui-mobile @ui-kitten/components @eva-design/eva react-native-vector-icons
node -e "console.log(Object.keys(require('@todo/ui-mobile')))"
```

### Visual / Storybook (Optional)

If the monorepo keeps Storybook or Chromatic:

```bash
pnpm run visual-test
pnpm run visual-test:ci
```

## CI/CD

Minimal GitHub Actions workflow (no showcase build):

```yaml
name: Publish ui-mobile

on:
  push:
    branches: [main]
    paths:
      - 'packages/ui-mobile/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Validate
        run: pnpm run validate-packages
      - name: Build
        run: pnpm run build:packages
      - name: Publish (Changesets)
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm run publish-packages
```

## Troubleshooting

### Build Failures

```bash
pnpm run typecheck
pnpm run build
```

Common causes:

- Missing peer dependency definitions
- Incorrect `exports` map in `package.json`
- TypeScript path mapping not reflected in built output

### Metro / Consumable Issues

In the consumer app:

```bash
npx react-native start --reset-cache
```

Ensure the package only ships platform-safe code (no Node-only APIs).

### Module Resolution

Check entry points:

```bash
cat packages/ui-mobile/package.json | jq '.main,.module,.types,.exports'
```

### UI Kitten / Vector Icons Setup

Follow each library's installation instructions (fonts linked for iOS/Android, theme provider in root component).

### iOS / Android Platform Issues

Run a clean build in consumer app if components rely on native modules referenced indirectly.

## Environment Variables

```bash
CHROMATIC_PROJECT_TOKEN=...   # visual regression (if used)
NPM_REGISTRY=https://registry.npmjs.org  # override if using a private registry
DEBUG=vite:*                  # verbose build logs
```

## Package Distribution

Install from npm:

```bash
npm install @todo/ui-mobile
# or
yarn add @todo/ui-mobile
# or
pnpm add @todo/ui-mobile
```

Private registry example:

```bash
npm config set registry https://your-private-registry.com
```

---

Historical note: The former Expo showcase (EAS/web/Snack instructions) was removed when the library became consumption-only. Refer to `apps/mobile` for runtime and platform-specific deployment concerns.

_Update this guide whenever build tooling, peer dependencies, or validation steps change._
