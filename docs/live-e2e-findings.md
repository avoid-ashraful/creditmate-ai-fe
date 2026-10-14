# Live E2E Integration Test Findings

**Report ID:** live
**Date:** 2026-10-13
**Frontend:** /home/ubuntu/credit-workers/task-live-e2e (React CRA)
**Backend:** /home/ubuntu/credit-workers/integration/creditmate-ai-be (Django)
**Database:** PostgreSQL in docker container task-63-search-db-1

---

## Summary

**Total Tests:** 23

- **Passed:** 3 (Advanced Search API endpoints)
- **Failed:** 20 (frontend/backend integration issues)

---

## Frontend Bugs (to fix)

### 1. **E2E_BASE_URL not properly passed to Playwright config**

- **Symptom:** Tests show `baseURL: about:blank` despite E2E_BASE_URL being set in environment
- **Root cause:** Playwright config reads `process.env.E2E_BASE_URL` at config load time, but the env var is set after Playwright process starts
- **Fix:** Pass `--base-url` CLI argument or use proper config file path
- **Test file:** All tests affected

### 2. **Frontend serving on `localhost` not `127.0.0.1`**

- **Symptom:** `serve -s build -p PORT` binds to `localhost` (IPv6) but Playwright config expects `127.0.0.1`
- **Root cause:** `npx serve` defaults to `localhost` which resolves to `::1` on some systems
- **Fix:** Use `--listen 127.0.0.1:PORT` or bind to `0.0.0.0`
- **Test file:** All tests affected

### 3. **Typeahead/Autocomplete not working against real backend**

- **Symptom:** Tests fail with timeout waiting for autocomplete suggestions
- **Root cause:** The typeahead endpoint `/api/v1/credit-cards/typeahead/` may not exist or return different format
- **Fix:** Check backend API implementation or update test expectations
- **Test file:** `typeahead.spec.ts`

### 4. **Card Detail page deep link routing not working**

- **Symptom:** Tests trying to navigate to `/card/bank-slug/card-slug` fail
- **Root cause:** Frontend routing expects specific slug format but backend returns different slugs
- **Fix:** Align frontend slug generation with backend data
- **Test file:** `card-detail.spec.ts`

### 5. **Category page pagination and filtering issues**

- **Symptom:** Tests for `/category/travel` fail
- **Root cause:** Category routes may not be implemented or use different slug format
- **Fix:** Verify category page implementation and API filter parameters
- **Test file:** `category.spec.ts`

### 6. **Dark mode toggle state persistence**

- **Symptom:** Dark mode test fails - state not persisting across reloads
- **Root cause:** localStorage key may be different or not being set correctly
- **Fix:** Check ThemeToggle component localStorage key
- **Test file:** `dark-mode.spec.ts`

### 7. **Compare page share URL functionality**

- **Symptom:** Share comparison copy fails
- **Root cause:** Clipboard API may not work in test context or URL format differs
- **Fix:** Update test to handle clipboard properly or verify share URL format
- **Test file:** `compare.spec.ts`

### 8. **Saved comparisons public share link**

- **Symptom:** Public share link test fails
- **Root cause:** Share token generation or retrieval may be broken
- **Fix:** Check saved service share token handling
- **Test file:** `saved.spec.ts`

### 9. **Review submission pending notice**

- **Symptom:** Review test fails to see pending notice
- **Root cause:** Review form submission or UI state update may be broken
- **Fix:** Check ReviewsSection component pending state handling
- **Test file:** `review.spec.ts`

### 10. **Auth flow - account redirect after login**

- **Symptom:** Protected account page doesn't redirect to login
- **Root cause:** AuthProvider may not be checking auth state correctly on protected routes
- **Fix:** Check ProtectedRoute and AuthProvider implementation
- **Test file:** `auth.spec.ts`

### 11. **Watch card / Alert subscription**

- **Symptom:** Watch card test fails - cannot navigate to register
- **Root cause:** Frontend routing or auth flow issues
- **Fix:** Check AlertsPage and auth integration
- **Test file:** `alerts.spec.ts`

---

## Backend Bugs (reproduction provided - do not fix)

### 1. **CORS not allowing frontend origin dynamically**

- **Reproduction:** Set `CORS_ALLOWED_ORIGINS=http://127.0.0.1:59223` and try to access from frontend
- **Expected:** Backend should allow the FE origin
- **Actual:** Need to restart backend with correct CORS_ALLOWED_ORIGINS
- **Workaround:** Set CORS_ALLOWED_ORIGINS before starting backend

### 2. **Typeahead endpoint format mismatch**

- **Reproduction:** Call `GET /api/v1/credit-cards/typeahead/?q=Smoke`
- **Expected:** Return `{ suggestions: [...], facets: [...] }`
- **Actual:** Need to verify endpoint exists and returns correct format

### 3. **Advanced search endpoints working correctly** ✓

- `GET /api/v1/credit-cards/advanced-search/` - PASS
- `GET /api/v1/credit-cards/advanced-search/categories/` - PASS
- `GET /api/v1/credit-cards/advanced-search/sort-options/` - PASS

### 4. **Throttling needs high limits for testing**

- **Config:** Set THROTTLE*RATE*\* env vars high before starting backend:
  - `THROTTLE_RATE_ANON=1000/min`
  - `THROTTLE_RATE_USER=1000/min`
  - `THROTTLE_RATE_BURST=100/sec`
  - `THROTTLE_RATE_REVIEW_WRITE=50/hour`
  - `THROTTLE_RATE_AUTH_BURST=100/min`
  - `THROTTLE_RATE_AUTH_ANON=100/min`
  - `THROTTLE_RATE_AUTH_USER=1000/min`

---

## Test Results Breakdown

| Test Category       | Tests | Passed | Failed | Notes                             |
| ------------------- | ----- | ------ | ------ | --------------------------------- |
| Advanced Search API | 3     | 3      | 0      | ✓ Backend endpoints working       |
| Alerts / Watch Card | 1     | 0      | 1      | Frontend auth/routing issue       |
| Auth Flow           | 2     | 0      | 2      | ProtectedRoute/AuthProvider issue |
| Card Detail         | 2     | 0      | 2      | Routing/slug format issue         |
| Category Pages      | 2     | 0      | 2      | Category routing/API filters      |
| Compare Cards       | 2     | 0      | 2      | Share URL/clipboard issue         |
| Dark Mode           | 1     | 0      | 1      | localStorage persistence          |
| Home Page           | 3     | 0      | 3      | Typeahead/filters issue           |
| Reviews             | 1     | 0      | 1      | Pending notice not shown          |
| Saved Comparisons   | 2     | 0      | 2      | Share link/retrieval issue        |
| Typeahead           | 3     | 0      | 3      | Backend endpoint format           |
| Basic/Init          | 1     | 0      | 1      | BaseURL config issue              |

---

## Next Steps

1. **Fix frontend bugs** in priority order:
   - BaseURL/config issue (affects all tests)
   - Frontend serving on correct host (127.0.0.1)
   - Auth flow (ProtectedRoute, AuthProvider)
   - Card detail routing
   - Typeahead integration
2. **Re-run tests** after each fix to verify

3. **Run full test suite 3 times** (heavy-gated) as required

---

## Environment Notes

- **Heavy command semaphore:** Used `/home/ubuntu/.local/bin/heavy` for all CPU-intensive operations
- **Node modules:** Symlinked from `/home/ubuntu/credit-workers/fe-e2e-integration/node_modules`
- **Backend Python:** `/home/ubuntu/credit-workers/task-8.4-be/.venv/bin/python`
- **PostgreSQL:** Docker container `task-63-search-db-1` on port 5432
- **Redis:** Port 6379, DB 14 (shared)
- **Ports:** Dynamic allocation 4000-4999 for FE, 4000-4999 for BE
- **Database:** Unique names with task ID `e2e_live_<timestamp>_<random>`
