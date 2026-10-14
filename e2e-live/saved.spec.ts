import { expect, test } from './fixtures';

const TEST_PASSWORD = 'Strong-pass-123!';

test.describe('Saved comparisons - live backend', () => {
  test('save comparison and see it in /saved', async ({ page }) => {
    const testEmail = `e2e-saved-${Date.now()}@example.test`;
    // Register and login
    await page.goto('/register');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|register/i }).click();

    // Should redirect to login page
    await page.waitForURL(/\/login$/);

    // Login
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to account
    await page.waitForURL(/\/account$/);

    // Go to home and add cards to compare
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    await page.locator('.add-to-compare-btn').nth(0).click();
    await page.locator('.add-to-compare-btn').nth(1).click();
    await page.locator('a.compare-button').click();

    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();

    // Save comparison
    page.on('dialog', dialog => {
      expect(dialog.message()).toMatch(/name/i);
      dialog.accept('My Live Comparison');
    });
    await page.getByRole('button', { name: /Save Comparison/i }).click();

    // Wait for save confirmation
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

    // Go to saved page
    await page.goto('/saved');
    await expect(page.getByRole('heading', { name: /Saved comparisons/i })).toBeVisible();

    // Should see the saved comparison
    await expect(page.getByText('My Live Comparison')).toBeVisible();
  });

  test('public share link works', async ({ page }) => {
    const testEmail = `e2e-saved-share-${Date.now()}@example.test`;
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            (window as unknown as { __sharedUrl?: string }).__sharedUrl = text;
          },
        },
        configurable: true,
      });
    });
    // Register and login
    await page.goto('/register');
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|register/i }).click();

    // Should redirect to login page
    await page.waitForURL(/\/login$/);

    // Login
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to account
    await page.waitForURL(/\/account$/);

    // Create a comparison first
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Credit Cards \(/ })).toBeVisible({
      timeout: 30000,
    });

    await page.locator('.add-to-compare-btn').nth(0).click();
    await page.locator('.add-to-compare-btn').nth(1).click();
    await page.locator('a.compare-button').click();

    await expect(page.getByRole('heading', { name: 'Credit Card Comparison' })).toBeVisible();

    // Make it public and save
    page.on('dialog', dialog => dialog.accept('Public Comparison'));
    const saved = page.waitForResponse(
      r => r.url().includes('/saved/comparisons/') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /Save Comparison/i }).click();
    expect((await saved).status()).toBe(201);

    // Go to saved and make it public/share
    await page.goto('/saved');
    await expect(page.getByText('Public Comparison')).toBeVisible();

    // Click share button
    await page
      .getByRole('button', { name: /copy share link/i })
      .first()
      .click();

    // Get the share URL from clipboard
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __sharedUrl?: string }).__sharedUrl))
      .toMatch(/\/shared\/[^/]+$/);
    const shareUrl = await page.evaluate(
      () => (window as unknown as { __sharedUrl?: string }).__sharedUrl || ''
    );

    expect(shareUrl).toMatch(/\/shared\/[^/]+$/);
    await page.goto(shareUrl);
    await expect(page.getByText('Public Comparison')).toBeVisible({ timeout: 10000 });
  });
});
