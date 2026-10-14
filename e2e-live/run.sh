#!/usr/bin/env bash
set -euo pipefail

# Live e2e integration test runner
# Starts backend (via integration worktree), serves pre-built frontend, runs Playwright tests

FE_ROOT="/home/ubuntu/credit-workers/task-live-e2e"
BE_ROOT="/home/ubuntu/credit-workers/integration/creditmate-ai-be"

# Port allocation
FE_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()")
BE_PORT=$(python3 -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()")

# Unique DB name
DB_NAME="e2e_live_$(date +%s)_${RANDOM}"

# PIDs to track for cleanup
BACKEND_PID=""
FE_SERVER_PID=""
DB_CREATED=0

# Log file
LOG_DIR="${FE_ROOT}/e2e-live/logs"
mkdir -p "${LOG_DIR}"
BACKEND_LOG="${LOG_DIR}/backend-${DB_NAME}.log"
FE_BUILD_LOG="${LOG_DIR}/fe-build.log"
FE_SERVER_LOG="${LOG_DIR}/fe-server.log"
PLAYWRIGHT_LOG="${LOG_DIR}/playwright.log"

cleanup() {
  local status=$?
  
  # Kill FE server
  if [[ -n "${FE_SERVER_PID}" ]] && kill -0 "${FE_SERVER_PID}" 2>/dev/null; then
    echo "Stopping FE server (PID: ${FE_SERVER_PID}).../"
    kill "${FE_SERVER_PID}" 2>/dev/null || true
    wait "${FE_SERVER_PID}" 2>/dev/null || true
  fi
  
  # Kill backend
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    echo "Stopping backend (PID: ${BACKEND_PID}).../"
    kill "${BACKEND_PID}" 2>/dev/null || true
    wait "${BACKEND_PID}" 2>/dev/null || true
  fi
  
  # Drop DB
  if [[ "${DB_CREATED}" == "1" ]]; then
    echo "Dropping database ${DB_NAME}..."
    docker exec task-63-search-db-1 psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \"${DB_NAME}\";" >/dev/null 2>&1 || true
  fi
  
  if [[ $status -ne 0 ]]; then
    echo "=== TEST RUN FAILED ==="
    echo "Backend log: ${BACKEND_LOG}"
    echo "FE build log: ${FE_BUILD_LOG}"
    echo "FE server log: ${FE_SERVER_LOG}"
    echo "Playwright log: ${PLAYWRIGHT_LOG}"
    echo ""
    echo "Last 100 lines of backend log:"
    tail -100 "${BACKEND_LOG}" 2>/dev/null || true
    echo ""
    echo "Last 100 lines of FE build log:"
    tail -100 "${FE_BUILD_LOG}" 2>/dev/null || true
    echo ""
    echo "Last 100 lines of FE server log:"
    tail -100 "${FE_SERVER_LOG}" 2>/dev/null || true
    echo ""
    echo "Last 100 lines of Playwright log:"
    tail -100 "${PLAYWRIGHT_LOG}" 2>/dev/null || true
  else
    echo "=== TEST RUN PASSED ==="
  fi
  
  exit $status
}

trap cleanup EXIT INT TERM

echo "=== Starting Live E2E Integration Test ==="
echo "Frontend port: ${FE_PORT}"
echo "Backend port: ${BE_PORT}"
echo "Database: ${DB_NAME}"
echo ""

# Check Docker container is running
echo "Checking PostgreSQL container..."
docker exec task-63-search-db-1 pg_isready -U postgres >/dev/null

# Create database
echo "Creating database ${DB_NAME}..."
docker exec task-63-search-db-1 psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${DB_NAME}\";" >/dev/null
DB_CREATED=1

# Start backend
echo "Starting backend on port ${BE_PORT}..."
cd "${BE_ROOT}"
export DEBUG=True
export SECRET_KEY=test
export SEARCH_ENABLED=False
export REDIS_CACHE_URL=redis://127.0.0.1:6379/14
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/${DB_NAME}"
export THROTTLE_RATE_ANON=1000/min
export THROTTLE_RATE_USER=1000/min
export THROTTLE_RATE_BURST=100/sec
export THROTTLE_RATE_REVIEW_WRITE=50/hour
export THROTTLE_RATE_AUTH_BURST=100/min
export THROTTLE_RATE_AUTH_ANON=100/min
export THROTTLE_RATE_AUTH_USER=1000/min
export CORS_ALLOWED_ORIGINS="http://127.0.0.1:${FE_PORT},http://localhost:${FE_PORT}"
export CORS_ALLOW_CREDENTIALS=True

/home/ubuntu/credit-workers/task-8.4-be/.venv/bin/python manage.py migrate --noinput >> "${BACKEND_LOG}" 2>&1
/home/ubuntu/credit-workers/task-8.4-be/.venv/bin/python scripts/seed_smoke_data.py >> "${BACKEND_LOG}" 2>&1

/home/ubuntu/credit-workers/task-8.4-be/.venv/bin/python manage.py runserver "127.0.0.1:${BE_PORT}" --noreload >> "${BACKEND_LOG}" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 80); do
  if python3 -c "
import socket, sys
s=socket.socket(); s.settimeout(.2)
ok=s.connect_ex(('127.0.0.1', ${BE_PORT})) == 0
s.close(); sys.exit(0 if ok else 1)
"; then
    break
  fi
  if ! kill -0 "${BACKEND_PID}" 2>/dev/null; then
    cat "${BACKEND_LOG}"
    exit 1
  fi
  sleep .25
done

echo "Backend started (PID: ${BACKEND_PID})"

# Build frontend with correct API base URL
echo "Building frontend with REACT_APP_API_BASE_URL=http://127.0.0.1:${BE_PORT}/api/v1..."
cd "${FE_ROOT}"
ln -sf /home/ubuntu/credit-workers/fe-e2e-integration/node_modules node_modules
REACT_APP_API_BASE_URL="http://127.0.0.1:${BE_PORT}/api/v1" \
REACT_APP_ENABLE_API_LOGGING=false \
CI=true \
/home/ubuntu/.local/bin/heavy npm run build >> "${FE_BUILD_LOG}" 2>&1

# Frontend is built, just serve it
echo "Serving frontend on port ${FE_PORT}..."
cd "${FE_ROOT}"
nohup npx serve -s build -p "${FE_PORT}" > "${FE_SERVER_LOG}" 2>&1 &
FE_SERVER_PID=$!

# Wait for FE server
echo "Waiting for FE server..."
for i in $(seq 1 40); do
  if python3 -c "
import socket, sys
s=socket.socket(); s.settimeout(.2)
ok=s.connect_ex(('127.0.0.1', ${FE_PORT})) == 0
s.close(); sys.exit(0 if ok else 1)
"; then
    break
  fi
  if ! kill -0 "${FE_SERVER_PID}" 2>/dev/null; then
    cat "${FE_SERVER_LOG}"
    exit 1
  fi
  sleep .25
done

echo "FE server started (PID: ${FE_SERVER_PID})"

# Run Playwright tests - pass FE_PORT to config via environment
export FE_PORT="${FE_PORT}"
export E2E_BASE_URL="http://127.0.0.1:${FE_PORT}"
export BE_PORT="${BE_PORT}"
cd "${FE_ROOT}"
/home/ubuntu/.local/bin/heavy npx playwright test --config="${FE_ROOT}/e2e-live/playwright.config.ts" --reporter=list 2>&1 | tee "${PLAYWRIGHT_LOG}"

echo "=== All tests completed ==="
