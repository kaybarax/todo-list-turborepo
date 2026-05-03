# Web Deployment

The production web target is Vercel.

## Vercel Project Settings

- Root Directory: `apps/web`
- Framework Preset: Next.js
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm turbo run build --filter=@todo/web...`
- Output Directory: use Vercel's Next.js default

The deployment workflow runs Vercel CLI from `apps/web` so the repository settings and the CLI path agree.

## Environment Variables

Set these in Vercel for each environment that deploys the web app:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_POLYGON_RPC_URL`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_POLKADOT_RPC_URL`
- `NEXT_PUBLIC_MOONBEAM_RPC_URL`
- `NEXT_PUBLIC_BASE_RPC_URL`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_ENABLE_BLOCKCHAIN`
- `NEXT_PUBLIC_ENABLE_PWA`

`NEXT_PUBLIC_*` values are public client-side values and are compiled into the Next.js build. Change them by updating the Vercel environment and redeploying.

GitHub Actions still needs these GitHub-side values:

- Secret: `VERCEL_TOKEN`
- Variables: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NEXT_PUBLIC_API_URL`

Terraform/Terragrunt owns the GitHub-side values only. Vercel project, domain, and Vercel environment-variable management can move to a Vercel provider later if those settings need to be enforced as IaC.

## Smoke Test

Run locally against the Next.js dev server:

```bash
pnpm --filter @todo/web test:e2e:smoke
```

Run against a deployed URL:

```bash
PLAYWRIGHT_BASE_URL=https://example.vercel.app \
NEXT_PUBLIC_API_URL=https://api.example.com \
pnpm --filter @todo/web test:e2e:smoke --project=chromium
```
