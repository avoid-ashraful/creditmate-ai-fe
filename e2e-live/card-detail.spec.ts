import { expect, test } from '@playwright/test';

test.describe('Card Detail page - live backend', () => {
  test('loads card detail page and shows specs', async ({ page }) => {
    // Navigate directly to a card detail page
    await page.goto('/card/smoke-bank-1/smoke-card-01');
    // Wait for page to load and check if it's the card detail page or home page
    const isCardDetail = await page
      .getByRole('heading', { name: /Smoke Card 01/i })
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const isHome = await page
      .getByRole('heading', { name: /Credit Cards \(/ })
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    console.log('isCardDetail:', isCardDetail, 'isHome:', isHome);

    if (isHome) {
      // If it's the home page, the routing didn't work - need to use correct slug
      console.log('Routing issue - page is home instead of card detail');
    }

    await expect(page.getByRole('heading', { name: /Smoke Card 01/i })).toBeVisible({
      timeout: 10000,
    });

    // Should show specs table
    await expect(page.getByText('Complete Specifications')).toBeVisible({ timeout: 10000 });
  });

  test('shows unknown for null fee/APR', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    // Find a card with null fee (card 4, 8, or 12)
    // Let's navigate directly to a card that has null fee
    await page.goto('/card/smoke-bank-1/smoke-card-04');
    await expect(page.getByRole('heading', { name: /Smoke Card 04/i })).toBeVisible({
      timeout: 10000,
    });

    // Check annual fee shows "Data not available" for null
    const annualFeeCell = page.locator('th:has-text("Annual Fee") + td');
    await expect(annualFeeCell).toContainText('Data not available');
  });
});
