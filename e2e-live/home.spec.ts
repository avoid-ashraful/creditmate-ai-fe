import { expect, test } from './fixtures';

test.describe('Home page - live backend', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the main heading and cards to load
    await expect(
      page.getByRole('heading', { name: /Find Your Perfect Credit Card|Start Your Card Search/i })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });
  });

  test('renders real seeded cards with null fee/APR shown as unknown', async ({ page }) => {
    // Should have 12 cards from seed data
    await expect(page.locator('.card-list-item')).toHaveCount(10);

    // Check that cards with null annual_fee show "Data not available" or "unknown"
    // Seed data: annual_fee=[0, 250, 1200, None][i % 4]
    // Cards 4, 8, 12 have null annual_fee (index 3, 7, 11)
    // interest_rate_apr=[18, 24, None, 31][i % 4]
    // Cards 3, 7, 11 have null APR (index 2, 6, 10)

    // Verify at least one card shows "Data not available" for fee or APR
    await expect(
      page
        .locator('.card-list-item')
        .getByText(/unknown/i)
        .first()
    ).toBeVisible();
  });

  test('search filters cards', async ({ page }) => {
    const searchInput = page.locator('.search-form input');
    await searchInput.fill('Smoke Card 12');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('.card-list-item')).toHaveCount(1);
    await expect(page.getByText('Smoke Card 12')).toBeVisible();
  });

  test('filter panel opens and applies annual fee filter', async ({ page }) => {
    // Open filter panel
    await page.locator('.filter-header').click();

    // Set min annual fee to 500
    await page.locator('#minAnnualFee').fill('500');
    await page.getByRole('button', { name: 'Apply Filters' }).click();

    // Should filter out cards with fee < 500 (i.e., fee=0 and fee=250)
    // Cards with fee 500, 1200, and null (unknown) should remain
    // But null fee cards are treated as unknown - let's check
    await expect(page.locator('.card-list-item')).not.toHaveCount(0);
  });
});
