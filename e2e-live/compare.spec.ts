import { expect, test } from '@playwright/test';

test.describe('Compare cards - live backend', () => {
  test('compare 3 cards from home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    // Add 3 cards to compare
    await page
      .locator('.card-list-item')
      .nth(0)
      .getByRole('button', { name: 'Add to Compare' })
      .click();
    await page
      .locator('.card-list-item')
      .nth(1)
      .getByRole('button', { name: 'Add to Compare' })
      .click();
    await page
      .locator('.card-list-item')
      .nth(2)
      .getByRole('button', { name: 'Add to Compare' })
      .click();

    // Click compare button
    await page.locator('a.compare-button').click();

    // Should be on compare page
    await expect(page).toHaveURL(/\/compare\?ids=/);
    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();

    // Should show 3 cards
    await expect(page.locator('.card-chip-name')).toHaveCount(3);
    await expect(page.getByText('Comparing Cards 3')).toBeVisible();
  });

  test('share comparison copies URL', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    // Add 2 cards
    await page
      .locator('.card-list-item')
      .nth(0)
      .getByRole('button', { name: 'Add to Compare' })
      .click();
    await page
      .locator('.card-list-item')
      .nth(1)
      .getByRole('button', { name: 'Add to Compare' })
      .click();
    await page.locator('a.compare-button').click();

    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();

    // Set up clipboard interception
    await page.addInitScript(() => {
      window.navigator.clipboard.writeText = async (value: string) => {
        window.__sharedComparison = value;
      };
    });

    await page.getByRole('button', { name: 'Share Comparison' }).click();

    const sharedUrl = await page.evaluate(
      () => (window as Window & { __sharedComparison?: string }).__sharedComparison
    );
    expect(sharedUrl).toBeTruthy();
    expect(sharedUrl).toMatch(/\/compare\?ids=/);
  });
});
