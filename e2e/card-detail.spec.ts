import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('card detail deep link renders published card fields and structured data', async ({
  page,
}) => {
  await page.goto('/card/synthetic-bank-2/synthetic-visa-travel');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Synthetic Visa Travel' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Complete Specifications' })).toBeVisible();
  await expect(page.getByText('BDT 500').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /apply on bank website/i })).toHaveAttribute(
    'href',
    'https://synthetic-2.test/apply'
  );

  const schema = await page.locator('[data-testid="card-json-ld"]').textContent();
  expect(JSON.parse(schema || '{}')).toMatchObject({
    '@type': 'FinancialProduct',
    name: 'Synthetic Visa Travel',
    provider: { name: 'Synthetic Bank 2' },
  });
});

test('unknown card slugs show a not-found state', async ({ page }) => {
  await page.goto('/card/missing-bank/missing-card');
  await expect(page.getByRole('heading', { name: 'Card Not Found' })).toBeVisible();
});
