import { expect, test } from '@playwright/test';

test('basic test', async ({ page }) => {
  console.log('baseURL:', page.url());
  await page.goto('/');
  console.log('after goto:', page.url());
  await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });
});
