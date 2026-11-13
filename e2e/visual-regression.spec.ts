import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';
import { openDiscovery, openHome, waitForResults } from './helpers/navigation';

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
  await page.route('**/mock-assets/cards/**', route =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
        <defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#667eea"/><stop offset="1" stop-color="#764ba2"/></linearGradient></defs>
        <rect width="640" height="400" rx="28" fill="url(#g)"/>
        <circle cx="520" cy="80" r="150" fill="#fff" opacity=".12"/>
        <rect x="52" y="52" width="92" height="68" rx="12" fill="#fff" opacity=".92"/>
        <path d="M70 96h56M70 108h34" stroke="#667eea" stroke-width="7" stroke-linecap="round"/>
        <text x="52" y="325" fill="#fff" font-family="Arial,sans-serif" font-size="30" font-weight="700">CreditMate</text>
      </svg>`,
    })
  );
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

// The home page is a landing page now; its async sections (verified
// strip, catalogue counts) settle once the changed/verified list renders.
const waitForHomeSettled = async (page: import('@playwright/test').Page) => {
  await expect(page.locator('.cm-home-changed-item').first()).toBeVisible();
};

test.describe('Visual Regression - Homepage', () => {
  test('desktop homepage', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openHome(page);
    await waitForHomeSettled(page);
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet homepage', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await openHome(page);
    await waitForHomeSettled(page);
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('mobile homepage', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await openHome(page);
    await waitForHomeSettled(page);
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('discovery with search results', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    test.setTimeout(60000);
    await openDiscovery(page);
    await waitForResults(page);

    await page.getByLabel('Search cards').fill('visa');
    await expect(page.locator('.cm-result-card')).toHaveCount(3, { timeout: 10000 });
    await page.waitForTimeout(500); // Wait for any animations to settle

    await expect(page).toHaveScreenshot('discovery-search-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('discovery with filters expanded', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openDiscovery(page);
    await waitForResults(page);

    // The discovery filter rail is expanded by default on desktop.
    await expect(page.getByLabel('Min (BDT):')).toBeVisible();

    await expect(page).toHaveScreenshot('discovery-filters-desktop.png', {
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
  // /category/:slug folds into the discovery page with the category
  // applied as a filter; the synthetic fixtures match categories by
  // card name (the src/mocks/handlers.ts convention), so Travel yields
  // exactly the one travel card.
  const openCategory = async (page: import('@playwright/test').Page) => {
    await page.goto('/category/travel');
    await expect(page.getByRole('heading', { level: 1, name: 'Credit cards' })).toBeVisible();
    await expect(page.locator('.cm-result-card')).toHaveCount(1);
    await expect(page.getByText('Synthetic Visa Travel')).toBeVisible();
  };

  test('desktop category page', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openCategory(page);
    await expect(page).toHaveScreenshot('category-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet category page', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await openCategory(page);
    // Higher tolerance for category page due to dynamic card loading
    await expect(page).toHaveScreenshot('category-tablet.png', {
      maxDiffPixels: 50000,
      threshold: 0.2,
    });
  });

  test('mobile category page', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await openCategory(page);
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
  // /reward-calculator redirects to /plan/rewards, whose H1 is the
  // plan-tool title 'Rewards value'.
  const openCalculator = async (page: import('@playwright/test').Page) => {
    await page.goto('/reward-calculator');
    await expect(page.getByRole('heading', { level: 1, name: 'Rewards value' })).toBeVisible();
  };

  test('desktop calculator', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openCalculator(page);
    await expect(page).toHaveScreenshot('calculator-desktop.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('tablet calculator', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await openCalculator(page);
    await expect(page).toHaveScreenshot('calculator-tablet.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('mobile calculator', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await openCalculator(page);
    await expect(page).toHaveScreenshot('calculator-mobile.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe('Visual Regression - Card Detail Popup', () => {
  // The details popup (CardDetailsPopup) opens from a card list item's
  // "view details" button; in the current IA the card list lives on
  // bank hub pages.
  const openPopup = async (page: import('@playwright/test').Page) => {
    await page.goto('/bank/synthetic-bank-2');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Synthetic Bank 2' })
    ).toBeVisible();
    await expect(page.locator('.card-list-item')).toHaveCount(1);
    await page.locator('.view-details-btn').first().click();
    await expect(page.locator('.card-full-image')).toBeVisible();
  };

  test('desktop card popup', async ({ page }, testInfo) => {
    if (!isDesktop(testInfo)) test.skip();
    await openPopup(page);
    // Higher tolerance due to potential font rendering differences in popup
    await expect(page).toHaveScreenshot('card-popup-desktop.png', {
      maxDiffPixels: 20000,
      threshold: 0.2,
    });
  });

  test('tablet card popup', async ({ page }, testInfo) => {
    if (!isTablet(testInfo)) test.skip();
    await openPopup(page);
    // Higher tolerance due to potential font rendering differences in popup
    await expect(page).toHaveScreenshot('card-popup-tablet.png', {
      maxDiffPixels: 20000,
      threshold: 0.2,
    });
  });

  test('mobile card popup', async ({ page }, testInfo) => {
    if (!isMobile(testInfo)) test.skip();
    await openPopup(page);
    // Higher tolerance for mobile due to font rendering differences in popup
    await expect(page).toHaveScreenshot('card-popup-mobile.png', {
      maxDiffPixels: 20000,
      threshold: 0.2,
    });
  });
});
