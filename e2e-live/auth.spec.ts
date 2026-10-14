import { expect, test } from '@playwright/test';

const TEST_EMAIL = `e2e-live-${Date.now()}@example.test`;
const TEST_PASSWORD = 'Strong-pass-123!';

test.describe('Auth flow - live backend', () => {
  test('register -> login -> account menu -> logout', async ({ page }) => {
    // Register - backend returns success message (no tokens), then redirects to /login
    await page.goto('/register');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /create account|register/i }).click();

    // Should redirect to login page (backend doesn't return tokens on register)
    await expect(page).toHaveURL(/\/login$/);

    // Login
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();

    // Should redirect to account
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('strong').filter({ hasText: TEST_EMAIL })).toBeVisible();

    // Open account menu
    await page.getByRole('button', { name: new RegExp(TEST_EMAIL) }).click();

    // Click logout
    await page
      .locator('#main-content')
      .getByRole('button', { name: /log out/i })
      .click();

    // Should show login link
    await expect(page.getByRole('link', { name: /log in/i }).first()).toBeVisible();
  });

  test('protected account redirects to login', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login$/);
  });
});
