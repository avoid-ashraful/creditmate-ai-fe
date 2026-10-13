# Visual Regression Testing Guide

This document describes the visual regression testing setup for CreditMate AI.

## Overview

Visual regression tests capture screenshots of key pages across desktop, tablet, and mobile viewports and compare them against committed baseline images. Tests run with deterministic fixtures (mocked API, frozen animations/time) to ensure reproducibility.

## Test Structure

```
e2e/
├── visual-regression.spec.ts    # Main visual regression test file
├── fixtures/
│   └── cards.ts                 # Shared test fixtures (reused from e2e)
└── helpers/
    ├── api.ts                   # API mocking (reused from e2e)
    └── navigation.ts            # Navigation helpers (reused from e2e)
```

## Running Visual Tests

### Run tests (compare against baselines)

```bash
npm run test:e2e:visual
```

### Update baselines (when intentional UI changes are made)

```bash
npm run test:e2e:visual:update
```

### Run with specific project (viewport)

```bash
npx playwright test e2e/visual-regression.spec.ts --project=desktop-chromium
npx playwright test e2e/visual-regression.spec.ts --project=tablet-chromium
npx playwright test e2e/visual-regression.spec.ts --project=mobile-chromium
```

## Baseline Images

Baseline screenshots are stored in:

```
e2e/visual-regression-snapshots/
├── homepage-desktop.png
├── homepage-tablet.png
├── homepage-mobile.png
├── homepage-search-desktop.png
├── homepage-filters-desktop.png
├── card-detail-desktop.png
├── card-detail-tablet.png
├── card-detail-mobile.png
├── comparison-desktop.png
├── comparison-tablet.png
├── comparison-mobile.png
├── category-desktop.png
├── category-tablet.png
├── category-mobile.png
├── quiz-start-desktop.png
├── quiz-start-tablet.png
├── quiz-start-mobile.png
├── calculator-desktop.png
├── calculator-tablet.png
├── calculator-mobile.png
├── card-popup-desktop.png
├── card-popup-tablet.png
└── card-popup-mobile.png
```

**Important**: Commit these baseline images to git! They are the source of truth for visual comparison.

## Deterministic Fixtures

Tests use the following deterministic fixtures to ensure reproducible screenshots:

1. **Mocked API**: Uses `mockApi()` from `e2e/helpers/api.ts` with synthetic card data
2. **Frozen Time**: All `Date.now()` calls return `2025-01-15T10:00:00.000Z`
3. **Disabled Animations**: All CSS animations and transitions are set to 0ms
4. **Hidden Cursor**: Mouse cursor is hidden to avoid flakiness
5. **Fixed Viewports**: Desktop (1280x720), Tablet (834x1112), Mobile (Pixel 7)

## Threshold Configuration

Visual comparison uses:

- `threshold: 0.2` (0.2% pixel difference allowed)
- `maxDiffPixels: 100` (or 150 for comparison page with more content)

Adjust these in `visual-regression.spec.ts` if needed for specific components.

## Adding New Visual Tests

1. Add a new test case in `visual-regression.spec.ts`
2. Follow the existing pattern:
   ```typescript
   test('description @viewport', async ({ page }) => {
     await navigateToPage(page);
     await expect(page).toHaveScreenshot('descriptive-name-viewport.png', {
       maxDiffPixels: 100,
       threshold: 0.2,
     });
   });
   ```
3. Run `npm run test:e2e:visual:update` to generate baseline
4. Commit the new baseline image(s)

## Updating Baselines After Intentional Changes

When you make intentional UI changes:

1. Make your code changes
2. Run `npm run test:e2e:visual:update` to regenerate all baselines
3. Review the updated images in `e2e/visual-regression-snapshots/`
4. Commit the updated baselines with a descriptive message:
   ```bash
   git add e2e/visual-regression-snapshots/
   git commit -m "Update visual baselines: [describe what changed]"
   ```

## CI Integration

**Note**: Per project requirements, CI integration is NOT enabled. These tests run locally only.

To run in CI manually:

```bash
# In CI environment
npm ci
npm run build
npm run test:e2e:visual
```

## Troubleshooting

### Tests fail due to minor pixel differences

- Increase `maxDiffPixels` for that specific test
- Ensure animations are fully disabled
- Check for non-deterministic content (dates, random IDs)

### Baseline images not found

- Run `npm run test:e2e:visual:update` to generate them
- Ensure you're committing the `visual-regression-snapshots/` directory

### Flaky tests on specific viewports

- Check that viewport dimensions match `playwright.config.ts` projects
- Ensure responsive breakpoints in CSS match test expectations

## Covered Pages

| Page                      | Desktop | Tablet | Mobile |
| ------------------------- | ------- | ------ | ------ |
| Homepage                  | ✅      | ✅     | ✅     |
| Homepage (search results) | ✅      | -      | -      |
| Homepage (filters open)   | ✅      | -      | -      |
| Card Detail               | ✅      | ✅     | ✅     |
| Comparison (3 cards)      | ✅      | ✅     | ✅     |
| Category (Travel)         | ✅      | ✅     | ✅     |
| Recommendation Quiz       | ✅      | ✅     | ✅     |
| Reward Calculator         | ✅      | ✅     | ✅     |
| Card Detail Popup         | ✅      | ✅     | ✅     |

## Performance Budgets

Visual regression tests are complemented by:

- **Bundle size budget**: `npm run bundle:budget` (200KB gzipped JS)
- **Lighthouse CI**: `npm run lighthouse` (LCP < 2.5s, TBT < 200ms, CLS < 0.1)

See `PERFORMANCE_BUDGETS.md` for details.
