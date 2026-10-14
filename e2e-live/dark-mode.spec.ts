import { expect, test } from './fixtures';

test.describe('Dark mode toggle - live backend', () => {
  test('dark mode toggle persists across reloads', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Find Your Perfect Credit Card|Start Your Card Search/i })
    ).toBeVisible();

    // Click dark mode toggle
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();

    // Check html has dark class
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload page
    await page.reload();

    // Dark mode should persist
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle back to light
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Reload again
    await page.reload();

    // Light mode should persist
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
