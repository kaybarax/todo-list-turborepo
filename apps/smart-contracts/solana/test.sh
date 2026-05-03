#!/usr/bin/env bash
set -euo pipefail

# Conditional Solana program tests runner.
# Skips gracefully when required Rust / Anchor tooling is not installed
# so that a full monorepo test run doesn't fail on optional blockchain deps.

if [[ "${SKIP_SOLANA_TESTS:-}" == "1" ]]; then
  echo "[solana] SKIP_SOLANA_TESTS=1 -> skipping Anchor tests." >&2
  exit 0
fi

if ! command -v anchor >/dev/null 2>&1; then
  echo "[solana] anchor CLI not found; skipping tests (optional)." >&2
  exit 0
fi

if ! command -v rustup >/dev/null 2>&1; then
  echo "[solana] rustup not found; skipping tests (optional)." >&2
  exit 0
fi

# Detect unsupported '+solana' toolchain invocation (some CI images lack it)
if anchor test --help 2>&1 | grep -q "+solana"; then
  echo "[solana] Detected '+solana' toolchain reference; attempting run..." >&2
fi

set +e
anchor test
status=$?
set -euo pipefail

if [[ $status -ne 0 ]] && grep -qi "no such command: \`+solana\`" .turbo/turbo-test.log 2>/dev/null; then
  echo "[solana] '+solana' toolchain unavailable; skipping tests (optional)." >&2
  exit 0
fi

exit $status