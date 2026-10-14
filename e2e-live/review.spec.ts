import { expect, test } from '@playwright/test';

const TEST_EMAIL = `e2e-review-${Date.now()}@example.test`;
const TEST_PASSWORD = 'Strong-pass-123!';

test.describe('Write review - live backend', () => {
  test('write a review shows pending notice', async ({ page }) => {
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

    // Go to a card detail page
    await page.goto('/card/smoke-bank-1/smoke-card-01');

    // Wait for detail page/popup
    await expect(page.getByRole('heading', { name: /Smoke Card/i })).toBeVisible({
      timeout: 10000,
    });

    // Scroll to reviews section
    await page
      .getByRole('heading', { name: /Reviews|Write a Review/i })
      .first()
      .scrollIntoViewIfNeeded();

    // Click write review button
    await page.getByRole('button', { name: /Write a Review/i }).click();

    // Fill review form
    await page.locator('.rating-star').nth(3).click(); // 4 stars
    await page.getByLabel(/Review Title/i).fill('Great card for travel');
    await page
      .getByLabel(/Review Body/i)
      .fill('This card has excellent lounge access and rewards.');
    await page.getByLabel(/Pros/i).fill('Lounge access, good rewards');
    await page.getByLabel(/Cons/i).fill('High annual fee');

    // Submit
    await page.getByRole('button', { name: /Submit Review/i }).click();

    // Should show pending notice
    await expect(page.getByText(/pending moderation/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/will be visible after review/i)).toBeVisible();
  });
});
