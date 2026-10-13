# Performance Budgets & Monitoring

This document describes the performance budget setup for CreditMate AI.

## Overview

Performance budgets ensure the application meets Core Web Vitals thresholds and stays within acceptable bundle size limits. All checks run locally via npm scripts - no remote CI required.

## Budget Targets (from TASK_BREAKDOWN.md)

| Metric                          | Budget                                 | Type           |
| ------------------------------- | -------------------------------------- | -------------- |
| LCP (Largest Contentful Paint)  | < 2500ms (mobile) / < 1500ms (desktop) | Core Web Vital |
| TBT (Total Blocking Time)       | < 200ms                                | Core Web Vital |
| CLS (Cumulative Layout Shift)   | < 0.1                                  | Core Web Vital |
| FID (First Input Delay)         | < 100ms                                | Core Web Vital |
| INP (Interaction to Next Paint) | < 200ms                                | Core Web Vital |
| FCP (First Contentful Paint)    | < 1800ms                               | Diagnostic     |
| TTFB (Time to First Byte)       | < 800ms                                | Diagnostic     |
| Bundle Size (gzipped JS)        | < 200KB                                | Build Artifact |

## npm Scripts

### Bundle Size Budget

```bash
# Check bundle size against default budget (200KB)
npm run bundle:budget

# Check with custom budget
npm run bundle:budget -- --budget=150

# CI mode (exits with code 1 on failure)
npm run bundle:budget:ci
```

### Lighthouse CI

```bash
# Full run (3 runs per URL, all assertions)
npm run lighthouse

# Quick CI run (1 run per URL)
npm run lighthouse:ci

# With custom budgets
npm run lighthouse -- --budget-lcp=2000 --budget-cls=0.05
```

### All Checks Combined

```bash
# Run all quality checks: types, lint, format, unit tests, build, bundle budget
npm run check:all
```

## Bundle Size Budget Script

**File**: `scripts/bundle-budget.js`

Checks all `.js` bundles in `build/static/js/` after `npm run build`.

**Output Example**:

```
📦 Bundle Size Budget Check
   Budget: 200 KB gzipped
   Build dir: /path/to/build
   Checking 5 bundle(s)...

   ✅ PASS  main.abc123.js
         Raw: 450.2 KB  |  Gzipped: 142.5 KB  |  71.2% of budget
   ✅ PASS  vendor.def456.js
         Raw: 120.5 KB  |  Gzipped: 38.2 KB  |  19.1% of budget
   ❌ FAIL  chunk.ghi789.js
         Raw: 85.3 KB  |  Gzipped: 28.7 KB  |  14.3% of budget

============================================================
✅ PASS  TOTAL: 209.4 KB (209.4 KB / 200 KB)

✅ All bundles within budget!
```

**Exit Codes**:

- `0`: All bundles within budget
- `1`: One or more bundles exceed budget

**Environment Variables**:

- `BUNDLE_BUDGET_KB`: Override default budget (e.g., `BUNDLE_BUDGET_KB=150`)
- `BUILD_DIR`: Override build directory (default: `build`)

## Lighthouse CI Runner

**File**: `scripts/lighthouse-runner.js`

Runs Lighthouse locally on the built application served via `serve`.

**Tested URLs**:

- `/` (Homepage)
- `/compare?ids=1,2,3` (Comparison)
- `/category/travel` (Category)
- `/card/synthetic-bank-2/synthetic-visa-travel` (Card Detail)
- `/perfect-card-finder` (Quiz)
- `/reward-calculator` (Calculator)

**Configuration** (`lighthouse-ci.config.js`):

- 3 runs per URL (for stability)
- Mobile emulation (Pixel 7)
- Assertions for all Core Web Vitals
- Results saved to `./lighthouse-results/`

**Output**:

```
🔦 Running Lighthouse CI...
   URLs: 6
   Runs per URL: 3
   Budgets: LCP=2500ms, FID=100ms, INP=200ms, CLS=0.1
   Output: ./lighthouse-results

✅ Lighthouse CI passed!
```

Or on failure:

```
❌ Lighthouse CI failed!
   Performance budgets not met. Check the output above for details.
```

## Web Vitals Reporting

**File**: `src/lib/web-vitals.ts`

Comprehensive web vitals reporting for development and production:

### Features

- **Console logging**: Real-time metrics in devtools
- **LocalStorage persistence**: Offline analysis across sessions
- **Performance budget checking**: Automatic validation on page unload
- **Custom callbacks**: Integration with analytics
- **sendBeacon support**: Non-blocking endpoint reporting

### Usage

```typescript
import {
  initWebVitalsReporting,
  DEFAULT_PERFORMANCE_BUDGET,
  checkPerformanceBudget,
} from './lib/web-vitals';

// Initialize in development
const cleanup = initWebVitalsReporting({
  logToConsole: true,
  storeInLocalStorage: true,
  sampleRate: 1.0,
  onMetric: metric => {
    // Send to your analytics
    analytics.track('web_vital', metric);
  },
});

// Check budget manually
const result = checkPerformanceBudget(DEFAULT_PERFORMANCE_BUDGET);
if (!result.passed) {
  console.warn('Budget violations:', result.violations);
}

// Get stored metrics
const metrics = getStoredWebVitals();

// Generate report
console.log(generateWebVitalsReport());
```

### Console Output Example

```
🎨 [Web Vitals] LCP: 1842.30 (delta: 1842.30) [good]
⚡ [Web Vitals] INP: 87.50 (delta: 87.50) [good]
📐 [Web Vitals] CLS: 0.02 (delta: 0.02) [good]
🖼️ [Web Vitals] FCP: 1203.10 (delta: 1203.10) [good]
📡 [Web Vitals] TTFB: 45.20 (delta: 45.20) [good]
```

### Performance Budget Check

Automatically runs on `beforeunload` in development:

```
✅ Performance budget met
```

Or:

```
⚠️ Performance budget violations: ["LCP: 2800.50 exceeds budget of 2500"]
```

## Running Performance Checks

### Local Development Workflow

```bash
# 1. Make changes
# 2. Build
npm run build

# 3. Check bundle size
npm run bundle:budget

# 4. Run Lighthouse (requires server)
npm run lighthouse

# 5. Or run all checks
npm run check:all
```

### Pre-commit / Pre-push

Add to husky hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-push": "npm run check:all"
    }
  }
}
```

## Interpreting Results

### Bundle Size Exceeded

Common causes and fixes:

- **Large dependencies**: Use `npm run analyze` (webpack-bundle-analyzer) to identify
- **Missing code splitting**: Add `React.lazy()` for routes
- **Duplicate dependencies**: Check `package.json` for duplicates
- **Heavy utilities**: Replace with lighter alternatives (e.g., date-fns vs moment)

### Lighthouse Failures

| Metric  | Common Fixes                                                             |
| ------- | ------------------------------------------------------------------------ |
| LCP     | Optimize images, preload critical resources, reduce server response time |
| TBT/INP | Reduce main thread work, code split, defer non-critical JS               |
| CLS     | Reserve space for images/ads, avoid inserting content above fold         |
| FID     | Minimize third-party scripts, break up long tasks                        |

## Reporting

### Lighthouse Results

HTML reports saved to `./lighthouse-results/`:

```
lighthouse-results/
├── localhost_3001_.html
├── localhost_3001_compare.html
├── localhost_3001_category_travel.html
└── ...
```

### Web Vitals Report

Access in browser console:

```javascript
// Get summary report
console.log(generateWebVitalsReport());

// Get raw metrics
getStoredWebVitals();

// Clear storage
clearStoredWebVitals();
```

Example report:

```
Web Vitals Summary Report
========================================

LCP: avg=1842.30, min=1750.10, max=1920.50 [good]
INP: avg=87.50, min=65.20, max=112.30 [good]
CLS: avg=0.02, min=0.01, max=0.05 [good]
FCP: avg=1203.10, min=1150.40, max=1280.90 [good]
TTFB: avg=45.20, min=38.10, max=52.80 [good]
```

## Troubleshooting

### "Build directory not found"

Run `npm run build` first.

### "Lighthouse CI not found"

Install globally: `npm install -g @lhci/cli` or use `npx lhci`.

### Lighthouse times out

Increase timeout in `lighthouse-ci.config.js` or run with `--no-serve` and start server manually.

### Bundle budget too strict

Adjust budget: `npm run bundle:budget -- --budget=300` or set `BUNDLE_BUDGET_KB=300`.

### Web Vitals not reporting

- Ensure `reportWebVitals()` is called in `src/index.tsx`
- Check browser console for errors
- Verify `web-vitals` package is installed

## Known Limitations

1. **No network simulation**: Lighthouse runs against local server without throttling by default
2. **Single browser**: Tests run in Chromium only
3. **Local only**: No remote CI integration per project requirements
4. **Synthetic data**: E2E tests use mocked API, not real backend latency

## Future Enhancements

- Add webpack-bundle-analyzer integration
- Implement resource size budgets (images, fonts, CSS)
- Add regression detection for bundle size trends
- Integrate with PostHog/analytics for production RUM data
