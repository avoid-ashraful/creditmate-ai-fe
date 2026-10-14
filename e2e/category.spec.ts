import { expect, test } from '@playwright/test';

import { mockApi } from './helpers/api';

const categoryCards = [
  {
    id: 11,
    bank_id: 1,
    bank_name: 'Synthetic Bank One',
    name: 'Synthetic Traveler Visa',
    annual_fee: '1000.00',
    interest_rate_apr: '19.00',
    lounge_access_international: '2 visits',
    lounge_access_domestic: '2 visits',
    cash_advance_fee: 'Synthetic fee',
    late_payment_fee: 'Synthetic late fee',
    annual_fee_waiver_policy: null,
    reward_points_policy: 'Synthetic travel rewards',
    additional_features: ['Synthetic lounge access'],
    is_active: true,
    sourceUrl: 'https://synthetic-11.test/card',
    modified: '2025-01-15T10:00:00Z',
    has_lounge_access: true,
    total_lounge_access: 4,
    images: [{ small: '/mock-assets/cards/11-1.svg', full: '/mock-assets/cards/11-1.svg' }],
  },
  {
    id: 12,
    bank_id: 2,
    bank_name: 'Synthetic Bank Two',
    name: 'Synthetic Traveler Signature',
    annual_fee: '2000.00',
    interest_rate_apr: '20.00',
    lounge_access_international: '4 visits',
    lounge_access_domestic: '4 visits',
    cash_advance_fee: 'Synthetic fee',
    late_payment_fee: 'Synthetic late fee',
    annual_fee_waiver_policy: null,
    reward_points_policy: 'Synthetic premium travel rewards',
    additional_features: ['Synthetic travel benefits'],
    is_active: true,
    sourceUrl: 'https://synthetic-12.test/card',
    modified: '2025-01-16T10:00:00Z',
    has_lounge_access: true,
    total_lounge_access: 8,
    images: [{ small: '/mock-assets/cards/12-1.svg', full: '/mock-assets/cards/12-1.svg' }],
  },
  {
    id: 13,
    bank_id: 3,
    bank_name: 'Synthetic Bank Three',
    name: 'Synthetic Traveler Basic',
    annual_fee: '500.00',
    interest_rate_apr: '18.00',
    lounge_access_international: '1 visit',
    lounge_access_domestic: '1 visit',
    cash_advance_fee: 'Synthetic fee',
    late_payment_fee: 'Synthetic late fee',
    annual_fee_waiver_policy: null,
    reward_points_policy: 'Synthetic basic travel rewards',
    additional_features: ['Synthetic page-two benefit'],
    is_active: true,
    sourceUrl: 'https://synthetic-13.test/card',
    modified: '2025-01-17T10:00:00Z',
    has_lounge_access: true,
    total_lounge_access: 2,
    images: [{ small: '/mock-assets/cards/13-1.svg', full: '/mock-assets/cards/13-1.svg' }],
  },
];

test('category page applies travel filter and loads paginated results', async ({ page }) => {
  const requestedUrls: string[] = [];
  await mockApi(page);
  await page.unrouteAll();
  await page.route('http://e2e.invalid/api/v1/credit-cards/**', async route => {
    const url = new URL(route.request().url());
    requestedUrls.push(`${url.pathname}${url.search}`);
    expect(url.searchParams.get('has_lounge_access')).toBe('true');
    expect(url.searchParams.get('ordering')).toBe('-lounge_access_international');
    expect(url.searchParams.get('page_size')).toBe('100');

    if (url.searchParams.get('page') === '2') {
      await route.fulfill({
        json: {
          count: 3,
          next: null,
          previous: '/credit-cards/?page=1',
          results: [categoryCards[2]],
        },
      });
      return;
    }

    await route.fulfill({
      json: {
        count: 3,
        next: '/credit-cards/?page=2',
        previous: null,
        results: categoryCards.slice(0, 2),
      },
    });
  });
  await page.route('http://e2e.invalid/api/v1/banks/**', async route => {
    await route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } });
  });

  await page.goto('/category/travel');
  await expect(page.getByRole('heading', { name: /✈️ Travel Credit Cards/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Credit Cards (2)' })).toBeVisible();
  await expect(page.getByText('Synthetic Traveler Visa')).toBeVisible();
  await expect(page.getByText('Synthetic Traveler Signature')).toBeVisible();
  await expect(page.getByText('Synthetic Traveler Basic')).not.toBeVisible();

  await page.getByRole('button', { name: 'Load more cards' }).click();
  await expect(page.getByRole('heading', { name: 'Credit Cards (3)' })).toBeVisible();
  await expect(page.getByText('Synthetic Traveler Basic')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load more cards' })).not.toBeVisible();
  expect(requestedUrls.filter(url => url.includes('page=2'))).toHaveLength(1);
});
