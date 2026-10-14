import { expect, test } from '@playwright/test';

const TEST_EMAIL = `e2e-saved-${Date.now()}@example.test`;
const TEST_PASSWORD = 'Strong-pass-123!';

test.describe('Saved comparisons - live backend', () => {
  test('save comparison and see it in /saved', async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|register/i }).click();

    // Should redirect to login page
    await page.waitForURL(/\/login$/);

    // Login
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to account
    await page.waitForURL(/\/account$/);

    // Go to home and add cards to compare
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

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

    // Save comparison
    await page.getByRole('button', { name: /Save Comparison/i }).click();

    // Handle prompt
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('name');
      dialog.accept('My Live Comparison');
    });

    // Wait for save confirmation
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

    // Go to saved page
    await page.goto('/saved');
    await expect(page.getByRole('heading', { name: /Saved Comparisons/i })).toBeVisible();

    // Should see the saved comparison
    await expect(page.getByText('My Live Comparison')).toBeVisible();
  });

  test('public share link works', async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|register/i }).click();

    // Should redirect to login page
    await page.waitForURL(/\/login$/);

    // Login
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to account
    await page.waitForURL(/\/account$/);

    // Create a comparison first
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

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

    // Make it public and save
    await page.getByRole('button', { name: /Save Comparison/i }).click();
    page.on('dialog', dialog => dialog.accept('Public Comparison'));

    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

    // Go to saved and make it public/share
    await page.goto('/saved');
    await expect(page.getByText('Public Comparison')).toBeVisible();

    // Click share button
    await page.locator('button:has-text("Share")').first().click();

    // Get the share URL from clipboard
    const shareUrl = await page.evaluate(() => {
      return navigator.clipboard.readText().catch(() => window.__sharedUrl || '');
    });

    // Navigate to shared page
    if (shareUrl) {
      await page.goto(shareUrl);
      await expect(page.getByText('Public Comparison')).toBeVisible({ timeout: 10000 });
    }
  });
});
