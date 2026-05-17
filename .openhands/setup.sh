#!/usr/bin/env bash
set -euo pipefail

echo "Initializing OpenHands sandbox for todo-list-turborepo..."

# Add bun to PATH if available
if [ -d "$HOME/.bun/bin" ]; then
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Add mise shims to PATH if available
if [ -d "$HOME/.local/share/mise/shims" ]; then
  export PATH="$HOME/.local/share/mise/shims:$PATH"
fi

echo "  Working directory: $(pwd)"
echo "  bun: $(command -v bun 2>/dev/null || echo 'not found')"
echo "  pnpm: $(command -v pnpm 2>/dev/null || echo 'not found')"
echo "  node: $(command -v node 2>/dev/null || echo 'not found')"

if [ -f "pnpm-lock.yaml" ]; then
  corepack enable 2>/dev/null || true
  pnpm install --frozen-lockfile 2>/dev/null || true
fi

echo "OpenHands sandbox is ready."
