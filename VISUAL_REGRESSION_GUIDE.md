# Visual Regression Testing Guide

## Overview

This guide documents how to run visual regression tests for the CreditMate AI frontend using Playwright against a production build served statically.

## Prerequisites

- Node.js with npm
- Playwright installed (`npx playwright install`)
- Production build created (`npm run build`)

## Commands

### 1. Build Production Bundle

```bash
CI=true npm run build
```

This creates an optimized production build in the `build/` directory.

### 2. Start Static Server

```bash
REACT_APP_API_BASE_URL=http://e2e.invalid/api/v1 REACT_APP_ENABLE_API_LOGGING=false npx serve -s build -l <PORT> --single
```

Replace `<PORT>` with a free port between 4000-4999 (e.g., 4567).

The server will be available at `http://127.0.0.1:<PORT>`.

**Important:** Do NOT use `npm start` (dev server) for visual regression tests. The dev server is too slow and causes flaky tests. Always use a production build served statically.

### 3. Run Visual Regression Tests

```bash
E2E_BASE_URL=http://127.0.0.1:<PORT> npx playwright test e2e/visual-regression.spec.ts
```

### 4. Update Baselines (Snapshots)

When intentional visual changes are made, update the baseline snapshots:

```bash
E2E_BASE_URL=http://127.0.0.1:<PORT> npx playwright test e2e/visual-regression.spec.ts --update-snapshots
```

**After updating snapshots, commit the new snapshot files.**

### 5. Run Tests Three Times Consecutively

To verify stability, run the test suite three times back-to-back:

```bash
for i in 1 2 3; do
  echo "=== Run $i ==="
  E2E_BASE_URL=http://127.0.0.1:<PORT> npx playwright test e2e/visual-regression.spec.ts
done
```

All three runs must pass with 0 failures.

## Test Structure

The visual regression suite (`e2e/visual-regression.spec.ts`) contains tests for:

- **Homepage** (desktop, tablet, mobile)
- **Homepage with search results** (desktop)
- **Homepage with filters expanded** (desktop)
- **Card Detail** (desktop, tablet, mobile)
- **Comparison Page** (desktop, tablet, mobile)
- **Category Page** (desktop, tablet, mobile)
- **Recommendation Quiz** (desktop, tablet, mobile)
- **Reward Calculator** (desktop, tablet, mobile)
- **Card Detail Popup** (desktop, tablet, mobile)

Each test runs only in its matching viewport project (desktop-chromium, tablet-chromium, mobile-chromium) using `test.skip()` for non-matching projects.

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings for visual regression:

- `fullyParallel: false` - Run sequentially to avoid resource contention
- `workers: 1` - Single worker
- `webServer` - Uses static serve when `E2E_BASE_URL` is not set
- Timeout: 120s per test, 15s for expectations
- Animations frozen via `page.addStyleTag()` in `beforeEach`
- Time frozen via `page.addInitScript()` in `beforeEach`

### API Mocking

Tests use the shared `mockApi()` fixture from `e2e/helpers/api.ts` which:

- Mocks `/api/v1/banks/`
- Mocks `/api/v1/credit-cards/` with search, filter, and pagination
- Mocks `/api/v1/credit-cards/search-suggestions/`
- Uses deterministic fixture data from `e2e/fixtures/cards.ts`

### Navigation Helpers

Tests use shared helpers from `e2e/helpers/navigation.ts`:

- `openHome(page)` - Navigate to home and wait for hero heading
- `waitForCards(page)` - Wait for "Credit Cards (N)" heading and 4 card items

## Screenshot Tolerances

Default: `maxDiffPixels: 100, threshold: 0.2`

Higher tolerances for specific tests:

- Card Detail Popup: `maxDiffPixels: 20000` (font rendering differences)
- Category Page (tablet): `maxDiffPixels: 50000` (dynamic card loading)
- Comparison Page: `maxDiffPixels: 150`

## Troubleshooting

### "ERR_CONNECTION_REFUSED" errors

- Ensure the static server is running on the correct port
- Verify `E2E_BASE_URL` matches the server URL
- The server must be started BEFORE running Playwright tests

### Tests fail due to element not found

- Ensure API mocking is working (`mockApi(page)` in `beforeEach`)
- Wait for content using `waitForCards()` or explicit `expect().toBeVisible()`
- The dev server may be slow - always use production build

### Snapshot mismatches

- Run with `--update-snapshots` to regenerate baselines
- Check for animation/time non-determinism (animations and time are frozen in `beforeEach`)
- Verify correct viewport (tests skip in non-matching projects)

## CI Integration

For CI environments, set `E2E_BASE_URL` to the deployed preview URL and run:

```bash
CI=true E2E_BASE_URL=https://preview-url npx playwright test e2e/visual-regression.spec.ts
```

The `webServer` config is automatically disabled when `E2E_BASE_URL` is set.

## Notes

- Never commit `build/`, `node_modules/`, `test-results/`, or `playwright-report/` directories
- Fix lint errors rather than bypassing with `--no-verify`
- Unit tests, check-types, check-lint, and check-format must all pass
