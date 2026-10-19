import { expect, test } from '@playwright/test';

import { feeScheduleOnlyCard } from './fixtures/cards';
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

test('a card without an apply URL shows the fee-schedule link, never an apply CTA', async ({
  page,
}) => {
  await mockApi(page, { cards: [feeScheduleOnlyCard] });
  await page.goto('/card/synthetic-bank-9/synthetic-fee-schedule-only');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Synthetic Fee Schedule Only' })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /apply on bank website/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /view fee schedule/i })).toHaveAttribute(
    'href',
    'https://synthetic-9.test/schedule-of-charges.pdf'
  );
});
