import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('recommendation quiz ranks API cards and shares a result URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          localStorage.setItem('shared-quiz-url', text);
          return Promise.resolve();
        },
      },
    });
  });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/perfect-card-finder');
  await expect(page.getByRole('heading', { name: 'Find Your Perfect Credit Card' })).toBeVisible();
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole('button', { name: /Go to next step or see results/ }).click();
  }
  await page.getByRole('button', { name: /Go to next step or see results/ }).click();
  await expect(page.getByRole('heading', { name: 'Your Top Recommendations' })).toBeVisible();
  await expect(page.locator('.result-card')).toHaveCount(3);
  await page.getByRole('button', { name: /Share Results/ }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('shared-quiz-url')))
    .toContain('quiz_result=');
});

test('reward calculator ranks cards by estimated net annual value', async ({ page }) => {
  await page.goto('/reward-calculator');
  await expect(
    page.getByRole('heading', { name: 'Annual Fee vs Rewards Calculator' })
  ).toBeVisible();
  await page.getByLabel(/Dining/).fill('50000');
  await page.getByRole('button', { name: /Calculate best value cards/ }).click();
  await expect(
    page.getByRole('heading', { name: /Top \d+ cards by net annual value/ })
  ).toBeVisible();
  await expect(page.locator('.ranked-card')).toHaveCount(4);
  await expect(page.getByText('Net annual value').first()).toBeVisible();
});
