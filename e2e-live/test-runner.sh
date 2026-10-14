#!/usr/bin/env bash
cd /home/ubuntu/credit-workers/task-live-e2e
E2E_BASE_URL="http://127.0.0.1:4000" /home/ubuntu/.local/bin/heavy npx playwright test --config=playwright.config.ts --testDir=e2e-live --reporter=list 2>&1
