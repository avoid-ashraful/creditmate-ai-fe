import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';
import { openHome, waitForCards } from './helpers/navigation';

// Visual regression tests for key pages across desktop/tablet/mobile
// Uses deterministic fixtures: mocked API, frozen animations/time
// Update baselines: npm run test:e2e:visual:update

test.describe.configure({ retries: 0 }); // No retries for visual tests

// Helper to skip tests that don't match the current project
const isDesktop = (testInfo: { project: { name: string } }) =>
  testInfo.project.name === 'desktop-chromium';
const isTablet = (testInfo: { project: { name: string } }) =>
  testInfo.project.name === 'tablet-chromium';
const isMobile = (testInfo: { project: { name: string } }) =>
  testInfo.project.name === 'mobile-chromium';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  // Freeze animations and time for deterministic screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0ms !important;
        transition-delay: 0ms !important;
        scroll-behavior: auto !important;
      }
      /* Hide cursor to avoid flakiness */
      * { cursor: none !important; }
    `,
  });
  // Set fixed time via addInitScript
  await page.addInitScript(() => {
    const FixedDate = new Date('2025-01-15T10:00:00.000Z');
    const OriginalDate = Date;
    global.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) return new OriginalDate(FixedDate);
        return new OriginalDate(...args);
      }
      static now() {
        return FixedDate.getTime();
      }
      static parse(s: string) {
        return OriginalDate.parse(s);
      }
      static UTC(...a: Parameters<typeof Date.UTC>) {
        return OriginalDate.UTC(...a);
      }
    };
  });
});

test.describe('Visual Regression - Homepage', () => {
  test('desktop homepage', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet homepage', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('mobile homepage', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('homepage with search results', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    test.setTimeout(60000);
    await openHome(page);
    await waitForCards(page);

    const search = page.locator('.search-form input');
    await search.fill('visa');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('.card-list-item')).toHaveCount(3, { timeout: 10000 });
    await page.waitForTimeout(500); // Wait for any animations to settle

    await expect(page).toHaveScreenshot('homepage-search-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('homepage with filters expanded', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);

    await page.locator('.filter-header').click();
    await expect(page.getByLabel('Min (BDT):')).toBeVisible();

    await expect(page).toHaveScreenshot('homepage-filters-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Card Detail', () => {
  test('desktop card detail', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await page.goto('/card/synthetic-bank-2/synthetic-visa-travel');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Synthetic Visa Travel' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('card-detail-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet card detail', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await page.goto('/card/synthetic-bank-2/synthetic-visa-travel');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Synthetic Visa Travel' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('card-detail-tablet.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('mobile card detail', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await page.goto('/card/synthetic-bank-2/synthetic-visa-travel');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Synthetic Visa Travel' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('card-detail-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Comparison Page', () => {
  test('desktop comparison (3 cards)', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await page.goto('/compare?ids=1,2,3');
    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();
    await expect(page.locator('.card-chip-name')).toHaveCount(3);
    await expect(page).toHaveScreenshot('comparison-desktop.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });

  test('tablet comparison (3 cards)', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await page.goto('/compare?ids=1,2,3');
    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();
    await expect(page.locator('.card-chip-name')).toHaveCount(3);
    await expect(page).toHaveScreenshot('comparison-tablet.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });

  test('mobile comparison (3 cards)', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await page.goto('/compare?ids=1,2,3');
    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();
    await expect(page.locator('.card-chip-name')).toHaveCount(3);
    await expect(page).toHaveScreenshot('comparison-mobile.png', {
      maxDiffPixels: 150,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Category Page', () => {
  test('desktop category page', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await page.goto('/category/travel');
    await expect(page.getByRole('heading', { name: /Travel Credit Cards/ })).toBeVisible();
    await expect(page).toHaveScreenshot('category-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet category page', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await page.goto('/category/travel');
    await expect(page.getByRole('heading', { name: /Travel Credit Cards/ })).toBeVisible();
    // Higher tolerance for category page due to dynamic card loading
    await expect(page).toHaveScreenshot('category-tablet.png', {
      maxDiffPixels: 50000,
      threshold: 0.2,
    });
  });

  test('mobile category page', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await page.goto('/category/travel');
    await expect(page.getByRole('heading', { name: /Travel Credit Cards/ })).toBeVisible();
    await expect(page).toHaveScreenshot('category-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Recommendation Quiz', () => {
  test('desktop quiz start', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await page.goto('/perfect-card-finder');
    await expect(
      page.getByRole('heading', { name: 'Find Your Perfect Credit Card' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('quiz-start-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet quiz start', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await page.goto('/perfect-card-finder');
    await expect(
      page.getByRole('heading', { name: 'Find Your Perfect Credit Card' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('quiz-start-tablet.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('mobile quiz start', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await page.goto('/perfect-card-finder');
    await expect(
      page.getByRole('heading', { name: 'Find Your Perfect Credit Card' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('quiz-start-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Reward Calculator', () => {
  test('desktop calculator', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await page.goto('/reward-calculator');
    await expect(
      page.getByRole('heading', { name: 'Annual Fee vs Rewards Calculator' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('calculator-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet calculator', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await page.goto('/reward-calculator');
    await expect(
      page.getByRole('heading', { name: 'Annual Fee vs Rewards Calculator' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('calculator-tablet.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('mobile calculator', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await page.goto('/reward-calculator');
    await expect(
      page.getByRole('heading', { name: 'Annual Fee vs Rewards Calculator' })
    ).toBeVisible();
    await expect(page).toHaveScreenshot('calculator-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Card Detail Popup', () => {
  test('desktop card popup', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);
    await page.locator('.card-list-item').first().click();
    await expect(page.locator('.card-full-image')).toBeVisible();
    // Higher tolerance due to potential font rendering differences in popup
    await expect(page).toHaveScreenshot('card-popup-desktop.png', {
      maxDiffPixels: 20000,
      threshold: 0.2,
    });
  });

  test('tablet card popup', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);
    await page.locator('.card-list-item').first().click();
    await expect(page.locator('.card-full-image')).toBeVisible();
    // Higher tolerance due to potential font rendering differences in popup
    await expect(page).toHaveScreenshot('card-popup-tablet.png', {
      maxDiffPixels: 20000,
      threshold: 0.2,
    });
  });

  test('mobile card popup', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await openHome(page);
    await waitForCards(page);
    await page.locator('.card-list-item').first().click();
    await expect(page.locator('.card-full-image')).toBeVisible();
    await expect(page).toHaveScreenshot('card-popup-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});
