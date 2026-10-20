import { expect, test } from '@playwright/test';

import { cards } from './fixtures/cards';
import { API_HOST, mockApi } from './helpers/api';

test('borrowing scenario changes the ranking and keeps unknown APR outside it', async ({
  page,
}) => {
  const scenarios = [
    { name: 'Lower APR Card', percent: 1, apr: '10.00' },
    { name: 'Higher Rewards Card', percent: 2, apr: '30.00' },
    { name: 'Unknown APR Card', percent: 3, apr: null },
  ].map((scenario, index) => ({
    ...cards[0],
    id: index + 101,
    name: scenario.name,
    annual_fee: '0.00',
    interest_rate_apr: scenario.apr,
    reward_earn_rules: [],
    reward_point_value_bdt: null,
    cashback_rules: [
      { category: 'all', percent: scenario.percent, cap_text: null, text: 'Synthetic cashback' },
    ],
  }));
  await mockApi(page, { cards: scenarios });
  await page.goto('/reward-calculator');
  await page.getByRole('spinbutton', { name: /Dining/ }).fill('10000');
  const calculate = page.getByRole('button', { name: /Calculate best value/ });
  await expect(calculate).toBeEnabled();
  await calculate.click();
  await expect(page.locator('ol .ranked-card-name').first()).toContainText('Unknown APR Card');

  await page.getByRole('spinbutton', { name: /Average revolving balance/ }).fill('10000');
  await calculate.click();
  await expect(
    page.getByRole('heading', { name: 'Comparison with estimated borrowing costs' })
  ).toBeVisible();
  await expect(page.locator('ol .ranked-card-name').first()).toContainText('Lower APR Card');
  const lower = page.locator('ol .ranked-card').filter({ hasText: 'Lower APR Card' });
  await expect(lower).toContainText('BDT 1,000');
  await expect(lower).toContainText('BDT 200');
  await expect(page.locator('ol .ranked-card')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: /APR unavailable/ })).toBeVisible();
  await expect(
    page.locator('ul .ranked-card').filter({ hasText: 'Unknown APR Card' })
  ).toBeVisible();

  await page.getByRole('spinbutton', { name: /Average revolving balance/ }).fill('-1');
  await expect(page.getByRole('alert')).toContainText(/non-negative/);
  await expect(page.locator('ol .ranked-card')).toHaveCount(0);
});

test('collection share URL opens anonymously and revoked shares show an unavailable state', async ({
  page,
}) => {
  await mockApi(page);
  await page.route(`${API_HOST}/saved/shared/collections/**`, async route => {
    expect(route.request().headers().authorization).toBeUndefined();
    if (route.request().url().includes('/revoked/')) {
      await route.fulfill({ status: 404, json: { detail: 'Not found.' } });
      return;
    }
    await route.fulfill({
      json: {
        name: 'Public travel shortlist',
        description: 'Synthetic collection',
        slug: 'travel',
        cards: [{ card: { id: 1, name: 'Shared Travel Card' }, notes: '' }],
      },
    });
  });
  await page.goto('/saved/shared/collections/travel');
  await expect(page.getByRole('heading', { name: 'Public travel shortlist' })).toBeVisible();
  await expect(page.getByText('Shared Travel Card')).toBeVisible();
  await page.goto('/saved/shared/collections/revoked');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Public travel shortlist' })).toHaveCount(0);
});

test('Bengali borrowing input supports keyboard navigation and localized validation', async ({
  page,
}) => {
  await mockApi(page);
  await page.addInitScript(() => localStorage.setItem('user-lang', 'bn'));
  await page.goto('/reward-calculator');
  const balance = page.getByRole('spinbutton', { name: /গড় আবর্তনশীল ব্যালেন্স/ });
  await balance.focus();
  await page.keyboard.type('-1');
  await expect(balance).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveText('শূন্য বা তার বেশি একটি সসীম ব্যালেন্স লিখুন');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('10000');
  await expect(balance).toHaveAttribute('aria-invalid', 'false');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /হিসাব|সেরা|গণনা/ })).toBeFocused();
});
