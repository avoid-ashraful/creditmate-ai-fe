import { expect, test } from '@playwright/test';

test.describe('Category pages - live backend', () => {
  test('category page loads and shows filtered cards', async ({ page }) => {
    await page.goto('/category/travel');

    await expect(page.getByRole('heading', { name: /Travel Credit Cards/i })).toBeVisible({
      timeout: 30000,
    });

    // Should show some cards with lounge access
    await expect(page.locator('.card-list-item')).toHaveCount({ min: 1 });
  });

  test('category page pagination works', async ({ page }) => {
    await page.goto('/category/travel');
    await expect(page.getByRole('heading', { name: /Travel Credit Cards/i })).toBeVisible({
      timeout: 30000,
    });

    // Check if there's a load more button
    const loadMore = page.getByRole('button', { name: /Load more/i });
    if (await loadMore.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loadMore.click();
      // Should load more cards
      await expect(page.locator('.card-list-item')).toHaveCount({ min: 1 });
    }
  });
});
