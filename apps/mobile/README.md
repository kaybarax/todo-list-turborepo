# @todo/mobile (Expo)

A fresh Expo app (SDK 54) for the Todo list project with React Native Web support, expo-router v6, and design tokens from `@todo/ui-mobile`.

## Dev & run

- Install deps from monorepo root first: `pnpm install`
- Start everything (infra + services): `pnpm dev`
- Start only mobile: `pnpm dev:mobile`
- Run on web: from this folder `pnpm web`
- Run on iOS simulator: `pnpm ios`

Notes:

- Uses Metro bundler for web to avoid RNW duplication and ensure prefixing. Keep `inline-style-prefixer` installed.
- React/ReactDOM pinned to versions compatible with Expo SDK 54 (currently 19.1.0).
- Reanimated plugin must be last in babel and imports for `react-native-gesture-handler` and `react-native-reanimated` must be first (handled in `_layout.tsx`).

## Theming & tokens

- ThemeProvider (app) → EvaProvider (from `@todo/ui-mobile`)
- Use `useDesignTokens()` for colors, spacing, typography.
- Dark mode toggles via Home screen button or provider state.

## Wallet

- Mock WalletProvider with AsyncStorage persistence of connection and network.
- Logs emitted via `src/utils/logger` for connect/disconnect/switch/sign/send/restore.

## Debugging

- White/black screen on web usually means a Metro config or dependency duplication issue. Verify `apps/mobile/metro.config.js` watchFolders and resolver settings.
- If you see `useTheme must be used within ThemeProvider`, ensure consumers are below providers (e.g., use ThemedStatusBar pattern).

## Tests

- Unit tests for store (`src/store/todoStore.ts`).
- Component tests for `TodoList`, `TodoFilters`, `TodoForm`.
- Playwright E2E smoke for navigation + core actions on web.

Run tests:

- Unit/component: from repo root
  - `pnpm --filter @todo/mobile test`
- E2E (starts Expo Web automatically):
  - `pnpm --filter @todo/mobile test:e2e`
  - If the first run is slow/flaky, pre-start web: `pnpm --filter @todo/mobile web` then re-run `test:e2e`.
  - Stable local runner (auto start, wait for readiness, run Playwright, shutdown):
    - `pnpm --filter @todo/mobile test:e2e:local`
    - Tip: if bundling fails to resolve workspace libs on cold caches, build them first (e.g.):
      - `pnpm --filter @todo/services build`

CI note:

- Ensure shared packages used by mobile are built before E2E. Example:
  - `pnpm --filter @todo/services build && pnpm --filter @todo/mobile test:e2e`

## Gotchas

- Avoid importing native-only modules in shared packages unless they are declared as peerDependencies.
- Rebuild `@todo/ui-mobile` after token changes: `pnpm --filter @todo/ui-mobile build`.
- API base URL defaults to `http://localhost:3001/api/v1`.
- Expo SDK 54: keep `expo`, `expo-router`, `react`, `react-dom`, and RN aligned with pinned versions.

## 🚀 Deployment

### Expo Application Services (EAS)

The mobile app is built and deployed using EAS.

- **Automation**: Triggered via the `deploy-mobile-eas.yml` workflow.
- **Builds**: Configured in `eas.json` with profiles for `development`, `preview`, and `production`.
- **Submission**: Automated submission to Apple App Store and Google Play Store via EAS Submit.
- **Secrets**: EAS secrets are used for sensitive build-time configuration.

To run a manual production build:

```bash
eas build --platform all --profile production
```
