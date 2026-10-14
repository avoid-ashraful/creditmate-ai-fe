import { Page, Route } from '@playwright/test';

import { banks, cards } from '../fixtures/cards';

export const API_HOST = 'http://e2e.invalid/api/v1';

interface RouteOptions {
  cards?: typeof cards | [];
  status?: number;
  abort?: boolean;
  delay?: number;
}

export const SEARCH_SUGGESTIONS_RESPONSE = {
  annual_fee_ranges: [
    { label: 'Free', filter: 'annual_fee=0' },
    { label: 'Low (1-1000)', filter: 'annual_fee_min=1&annual_fee_max=1000' },
    { label: 'Medium (1001-3000)', filter: 'annual_fee_min=1001&annual_fee_max=3000' },
    { label: 'Premium (3000+)', filter: 'annual_fee_min=3000' },
  ],
  benefits: [
    { label: 'International Lounge Access', filter: 'has_international_lounge=true' },
    { label: 'Domestic Lounge Access', filter: 'has_domestic_lounge=true' },
    { label: 'No Annual Fee', filter: 'no_annual_fee=true' },
    { label: 'Fee Waiver Available', filter: 'has_fee_waiver=true' },
  ],
  popular_banks: banks.map(bank => bank.name),
};

export const mockApi = (page: Page, options: RouteOptions = {}) => {
  const allCards = options.cards ?? cards;

  return page.route(`${API_HOST}/**`, async (route: Route) => {
    await new Promise(resolve => setTimeout(resolve, options.delay ?? 0));

    if (options.abort) {
      await route.abort('failed');
      return;
    }

    const url = new URL(route.request().url());

    if (url.pathname.endsWith('/banks/')) {
      if (options.status) {
        await route.fulfill({ status: options.status, body: 'Synthetic API failure' });
        return;
      }
      await route.fulfill({
        json: { count: banks.length, next: null, previous: null, results: banks },
      });
      return;
    }

    if (url.pathname.endsWith('/credit-cards/search-suggestions/')) {
      await route.fulfill({ json: SEARCH_SUGGESTIONS_RESPONSE });
      return;
    }

    // Card detail pages always request a review summary and list. Keep the
    // default mock aligned with the review API contract so unrelated tests do
    // not feed card-list payloads into the review components.
    if (url.pathname.includes('/reviews/cards/') && url.pathname.endsWith('/summary/')) {
      await route.fulfill({
        json: {
          average_rating: null,
          review_count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
      return;
    }

    if (url.pathname.endsWith('/reviews/')) {
      await route.fulfill({ json: { count: 0, next: null, previous: null, results: [] } });
      return;
    }

    if (options.status) {
      await route.fulfill({ status: options.status, body: 'Synthetic API failure' });
      return;
    }

    let results = allCards;
    const search = url.searchParams.get('search');
    if (search) {
      const term = search.toLowerCase();
      results = results.filter(card => card.name.toLowerCase().includes(term));
    }

    const range = url.searchParams.get('annual_fee_range');
    if (range) {
      const [min, max] = range.split(',').map(Number);
      results = results.filter(
        card => card.annual_fee !== null && card.annual_fee >= min && card.annual_fee <= max
      );
    }

    const annualMin = url.searchParams.get('annual_fee_min');
    const annualMax = url.searchParams.get('annual_fee_max');
    if (annualMin || annualMax) {
      const min = annualMin ? Number(annualMin) : -Infinity;
      const max = annualMax ? Number(annualMax) : Infinity;
      results = results.filter(
        card => card.annual_fee !== null && card.annual_fee >= min && card.annual_fee <= max
      );
    }

    const ids = url.searchParams.get('ids');
    if (ids) {
      const wantedIds = ids.split(',').map(Number);
      results = wantedIds
        .map(id => results.find(card => card.id === id))
        .filter(Boolean) as typeof results;
    }

    await route.fulfill({
      json: {
        count: results.length,
        next: null,
        previous: null,
        results,
      },
    });
  });
};
