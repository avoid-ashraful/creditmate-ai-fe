#!/usr/bin/env bash
# Live e2e against a throwaway full stack seeded with the 12 "Smoke Card" rows.
# Starts it with the parent repo's scripts/dev-up.sh (this repo is its creditmate-ai-fe submodule),
# runs the specs, then stops exactly what it started. Extra args go to `playwright test`.
set -euo pipefail
FE_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PARENT=${PARENT_DIR:-$FE_DIR/..}
export BE_DIR=${BE_DIR:-$PARENT/creditmate-ai-be} FE_DIR
export SEED=smoke DB_NAME=${DB_NAME:-creditmate_e2e} BE_PORT=${BE_PORT:-8011} FE_PORT=${FE_PORT:-3011}
export RUN_DIR=${RUN_DIR:-$(mktemp -d)}
trap '"$PARENT/scripts/dev-down.sh"' EXIT
"$PARENT/scripts/dev-up.sh"
cd "$FE_DIR"
E2E_BACKEND_LOG="$RUN_DIR/backend.log" E2E_BASE_URL="http://127.0.0.1:$FE_PORT" BE_PORT=$BE_PORT \
  npx playwright test --config e2e-live/playwright.config.ts "$@"
