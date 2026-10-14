# Live E2E findings

**Report ID:** live
**Date:** 2026-10-14
**Frontend:** `/home/ubuntu/credit-workers/task-live-e2e`
**Backend:** `/home/ubuntu/credit-workers/integration/creditmate-ai-be` (read-only)
**Harness:** `e2e-live/run.sh`, production CRA build + Playwright + scratch PostgreSQL

## Verified setup

- `REACT_APP_API_BASE_URL` is the correct build variable. Playwright's `baseURL` resolves to the dynamic `127.0.0.1` frontend origin; the browser loads deep links and backend requests successfully.
- `serve -s build -l tcp://127.0.0.1:<port>` serves the SPA at the expected address. Backend CORS preflight requests from that origin returned 200.
- Email registration and login work against the current auth API. The register endpoint returns its documented detail response and the UI proceeds to login; login accepts the email username.
- Card deep links work with seeded slugs, e.g. `/card/smoke-bank-1/smoke-card-01`.
- Typeahead works with the real backend. Browser requests to `/api/v1/credit-cards/typeahead/?q=Smoke` returned 200 and the UI selected card and category suggestions.
- The earlier first attempt failed before FE startup because the database seed reported a missing `banks_bank` table. The migration output was successful, and a standalone migration into a fresh scratch DB created the table. Clearing `DATABASE_URL` and checking the migrated table before seed resolved the setup failure; no backend migration defect reproduced.

## Confirmed frontend bug and fix

### Alert subscription refresh cleared a valid login

**Reproduction:** Register and log in, then open a card detail URL and inspect `/auth/token/refresh/` calls and the browser's auth UI. The backend logs show register 201, login 200, session restore `/auth/me/` 200, followed by another refresh request returning 400. The card page then shows anonymous login prompts instead of the watch button.

**Cause:** `AlertsClient` called `AuthClient.refreshAccessToken()` for every authenticated request, even when a valid access token was already available. With refresh rotation, an extra refresh can reuse a token already exchanged and clear local auth state.

**Fix:** `AlertsClient` now calls `AuthClient.getAccessToken()`, reusing the in-memory access token or joining a single refresh only when needed. The existing alerts service unit test now asserts this call. A targeted live rerun is pending.

## Harness/test corrections

- The first Playwright attempt had 23 failures because the config required a nonexistent `.auth/state.json`; registration/login tests already manage their own users. Removed that dependency and the unused setup project.
- `e2e/test-init.spec.ts` was a stray root E2E file and was deleted. Removed the live debug-only `e2e-live/test-init.spec.ts` too.
- The category and home filter tests used `toHaveCount({ min: 1 })`, which Playwright does not support. Replaced these with supported assertions.
- Compare tests used a stale accessible button name; the current control has `.add-to-compare-btn`. Updated the selector.
- Card detail's annual-fee selector matched two specification tables; assert the visible unknown value instead. Review test now identifies the exact card heading.
- Auth, home, category, card detail, alerts, and shared comparison tests now record browser console errors, failed requests, HTTP errors, and card-list response counts in the Playwright log.
- Runner uses a unique scratch DB, clears inherited `DATABASE_URL`, checks migrations before seeding, binds FE/BE ports in 4000–4999, and writes logs under a unique `/tmp` directory. It kills only the direct server PIDs it launches and drops only its own database.

## Run results so far

- First full Playwright run after fixing the missing storage-state setup: **11 passed, 11 failed of 22**. Advanced search (3), auth (2), deep-link detail (1), category pagination (1), dark mode (1), and typeahead (3) passed. The failures exposed the alert refresh bug and the harness assertion/selector issues above.
- A follow-up targeted live run is queued behind the shared host's `heavy` semaphore. Its backend migrated and seeded 3 banks / 12 cards. Exact current test result and list response counts will be added after the run completes.

## Backend issues

No backend API defect is confirmed so far. Advanced-search endpoints, typeahead, card list/detail, CORS preflights, registration, login, and auth profile requests returned successful responses. Refresh 400s occurred only after the frontend unnecessarily reused a rotated refresh token; the frontend change addresses that cause. Continue to record any reproducible non-2xx contract mismatch here with request and response evidence.
