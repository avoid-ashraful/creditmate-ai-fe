import { expect, test } from './fixtures';

const TEST_EMAIL = `e2e-alerts-${Date.now()}@example.test`;
const TEST_PASSWORD = 'Strong-pass-123!';

test.describe('Watch card / Alert subscription - live backend', () => {
  test('watch a card creates alert subscription', async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    // Registration now requires consenting to the terms and privacy policy.
    await page.getByRole('checkbox', { name: /terms/i }).check();
    await page.getByRole('button', { name: /create account|register/i }).click();

    // Should redirect to login page
    await page.waitForURL(/\/login$/);

    // Login
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to account
    await page.waitForURL(/\/account$/);

    // Navigate to the card detail page
    await page.goto('/card/smoke-bank-1/smoke-card-01');

    // Wait for card detail page to load
    await expect(page.getByRole('heading', { name: /Smoke Card 01/i })).toBeVisible({
      timeout: 10000,
    });

    // Wait for auth state to be restored (watch button only appears when authenticated)
    await expect(page.getByRole('button', { name: /Watch this card/i })).toBeVisible({
      timeout: 10000,
    });

    // Click watch toggle button
    const watchButton = page.getByRole('button', { name: /Watch this card/i });
    await watchButton.click();

    // Should show "Watching this card"
    await expect(page.getByRole('button', { name: /Watching this card/i })).toBeVisible({
      timeout: 10000,
    });

    // Go to alerts page to verify
    await page.goto('/alerts');
    await expect(page.getByRole('heading', { name: /Your Subscriptions/i })).toBeVisible({
      timeout: 10000,
    });

    // Should see the subscription
    await expect(page.getByText(/Smoke Card/i)).toBeVisible({ timeout: 10000 });
  });
});
