import { expect, test } from './fixtures';

test.describe('Compare cards - live backend', () => {
  test('compare 3 cards from home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    // Add 3 cards to compare
    await page.locator('.add-to-compare-btn').nth(0).click();
    await page.locator('.add-to-compare-btn').nth(1).click();
    await page.locator('.add-to-compare-btn').nth(2).click();

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
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    // Add 2 cards
    await page.locator('.add-to-compare-btn').nth(0).click();
    await page.locator('.add-to-compare-btn').nth(1).click();
    await page.locator('a.compare-button').click();

    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();

    await page.getByRole('button', { name: 'Share Comparison' }).click();

    const sharedUrl = await page.evaluate(() => window.navigator.clipboard.readText());
    expect(sharedUrl).toBeTruthy();
    expect(sharedUrl).toMatch(/\/compare\?ids=/);
  });
});
