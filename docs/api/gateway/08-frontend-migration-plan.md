# 08 Frontend Migration Plan

## Goal

Web, mobile, and future clients should call one gateway URL.

They should not choose between NestJS and Bun APIs.

## Current State

Web config:

```ts
const mode = process.env.NEXT_PUBLIC_API_MODE;
const standardUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const bunUrl = process.env.NEXT_PUBLIC_API_BUN_URL || 'http://localhost:3002';

return mode === 'bun' ? bunUrl : standardUrl;
```

Mobile config:

```ts
const mode = process.env.EXPO_PUBLIC_API_MODE;
const standardUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const bunUrl = process.env.EXPO_PUBLIC_API_BUN_URL || 'http://localhost:3002';

return mode === 'bun' ? bunUrl : standardUrl;
```

This should be removed after gateway migration.

## Target Environment Variables

Web:

```text
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3003
NEXT_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003
```

Mobile:

```text
EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:3003
EXPO_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003
```

Temporary compatibility aliases:

```text
NEXT_PUBLIC_API_URL=http://localhost:3003
EXPO_PUBLIC_API_URL=http://localhost:3003
```

Deprecated after migration:

```text
NEXT_PUBLIC_API_BUN_URL
NEXT_PUBLIC_API_MODE
EXPO_PUBLIC_API_BUN_URL
EXPO_PUBLIC_API_MODE
```

## Web Code Change

Target `apps/web/src/config/api.ts`:

```ts
import { ApiClientFactory } from '@todo/services';

export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
};

export const apiFactory = new ApiClientFactory({
  baseUrl: getApiBaseUrl(),
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
});

export const todoClient = apiFactory.getTodoClient();
export const authClient = apiFactory.getAuthClient();
```

## Mobile Code Change

Target `apps/mobile/src/config/api.ts`:

```ts
import { ApiClientFactory } from '@todo/services';

export const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_GATEWAY_URL ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3003';
};

export const apiFactory = new ApiClientFactory({
  baseUrl: getApiBaseUrl(),
  environment: __DEV__ ? 'development' : 'production',
});

export const todoClient = apiFactory.getTodoClient();
export const authClient = apiFactory.getAuthClient();
```

## Web Env File Updates

Target `apps/web/.env.example`:

```text
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3003
NEXT_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003
```

Target `apps/web/.env.local`:

```text
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3003
NEXT_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003
```

Remove later:

```text
NEXT_PUBLIC_API_BUN_URL
NEXT_PUBLIC_API_MODE
```

Keep during transition:

```text
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_WS_URL=ws://localhost:3003
```

## Mobile Env File Updates

Target `apps/mobile/.env.example`:

```text
EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:3003
EXPO_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003
```

Target `apps/mobile/.env`:

```text
EXPO_PUBLIC_API_GATEWAY_URL=http://localhost:3003
EXPO_PUBLIC_WS_GATEWAY_URL=ws://localhost:3003
```

Remove later:

```text
EXPO_PUBLIC_API_BUN_URL
EXPO_PUBLIC_API_MODE
```

Keep during transition:

```text
EXPO_PUBLIC_API_URL=http://localhost:3003
```

## Shared Client Package

`packages/services/src/api/ApiClientFactory.ts` already appends `/api/v1` when the base URL does not include `/api/`.

That means the frontend should pass:

```text
http://localhost:3003
```

not:

```text
http://localhost:3003/api/v1
```

Both may work because the factory checks for `/api/`, but the preferred environment value is the gateway origin only.

## Test Updates

Search targets:

```text
localhost:3001
localhost:3002
NEXT_PUBLIC_API_BUN_URL
NEXT_PUBLIC_API_MODE
EXPO_PUBLIC_API_BUN_URL
EXPO_PUBLIC_API_MODE
```

Expected replacements:

```text
localhost:3003
NEXT_PUBLIC_API_GATEWAY_URL
EXPO_PUBLIC_API_GATEWAY_URL
```

Specific known tests:

- `apps/web/src/__tests__/api-integration.test.tsx`
  - Update mocked URLs from `http://localhost:3001/api/v1/...` to `http://localhost:3003/api/v1/...`
  - Update client factory base URL to `http://localhost:3003`
- `apps/web/e2e/deploy-smoke.spec.ts`
  - Prefer `NEXT_PUBLIC_API_GATEWAY_URL`, then fallback to `NEXT_PUBLIC_API_URL`, then `API_URL`

## Migration Phases

### Phase 0: No Runtime Behavior Change

- Add `apps/api-gateway`.
- Gateway proxies all currently used frontend endpoints to the same backend each frontend already uses.
- Frontends still point to old URLs.
- Gateway is tested independently.

### Phase 1: Web Uses Gateway In Development

- Update `apps/web/.env.local`.
- Update `apps/web/src/config/api.ts`.
- Run web integration tests against gateway.
- Keep direct API URLs available for manual debugging only.

### Phase 2: Mobile Uses Gateway In Development

- Update `apps/mobile/.env`.
- Update `apps/mobile/src/config/api.ts`.
- Test Expo local workflows.
- Validate device networking. Physical devices may need LAN IP instead of `localhost`.

Mobile note:

```text
EXPO_PUBLIC_API_GATEWAY_URL=http://<developer-machine-lan-ip>:3003
```

may be required on physical devices.

### Phase 3: CI Uses Gateway

- Add `dev:api-gateway` and `build:api-gateway` scripts.
- Start gateway in integration/e2e environments.
- Point smoke tests at gateway.
- Ensure OpenAPI export and route table checks run in CI.

### Phase 4: Staging Gateway Public

- Deploy gateway.
- Keep APIs private where possible.
- Route staging web/mobile to staging gateway.
- Enable canary rules for Bun routes.

### Phase 5: Production Gateway Public

- Deploy with Nest default where needed.
- Gradually shift route traffic to Bun.
- Remove frontend API mode switches.
- Restrict direct API public access.

## Acceptance Criteria

- No frontend code imports or references `NEXT_PUBLIC_API_BUN_URL` or `EXPO_PUBLIC_API_BUN_URL`.
- No frontend code chooses `standard` versus `bun`.
- All frontend API calls use gateway origin.
- Gateway can route a path to either NestJS or Bun without frontend changes.
- Auth, todos, users, health flows pass through gateway.
- Request ID appears in gateway and upstream logs.
- Traces connect gateway spans to upstream spans.
