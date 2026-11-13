import { Page, Route } from '@playwright/test';

import { banks, cards } from '../fixtures/cards';

export const API_HOST = 'http://e2e.invalid/api/v1';

interface RouteOptions {
  cards?: typeof cards | [];
  status?: number;
  abort?: boolean;
  delay?: number;
}

/** Advanced-search option lists, mirrored from src/mocks/handlers.ts. */
export const ADVANCED_SEARCH_SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance', description: 'Best match first' },
  {
    key: 'annual_fee',
    label: 'Annual Fee (Low to High)',
    description: 'Sort by annual fee ascending',
  },
  {
    key: '-annual_fee',
    label: 'Annual Fee (High to Low)',
    description: 'Sort by annual fee descending',
  },
  {
    key: 'interest_rate_apr',
    label: 'APR (Low to High)',
    description: 'Sort by interest rate ascending',
  },
  {
    key: '-interest_rate_apr',
    label: 'APR (High to Low)',
    description: 'Sort by interest rate descending',
  },
  { key: 'name', label: 'Name (A-Z)', description: 'Sort by card name ascending' },
  { key: '-name', label: 'Name (Z-A)', description: 'Sort by card name descending' },
  { key: '-created', label: 'Newest First', description: 'Sort by creation date descending' },
];

export const ADVANCED_SEARCH_CATEGORIES = [
  { slug: 'travel', name: 'Travel' },
  { slug: 'cashback', name: 'Cashback' },
  { slug: 'premium', name: 'Premium' },
  { slug: 'student', name: 'Student' },
  { slug: 'business', name: 'Business' },
  { slug: 'no-annual-fee', name: 'No Annual Fee' },
];

/**
 * Field-history entries for a fixture card, newest first, in the exact
 * serializer shape (services/cardHistory.ts): the detail page's trust
 * sections render these; feeding them the card-list payload instead is
 * what used to crash the page into the ErrorBoundary.
 */
export const fieldHistoryFor = (card: (typeof cards)[number]) => [
  {
    id: card.id * 100 + 2,
    card_id: card.id,
    field_name: 'annual_fee',
    old_value: '450.00',
    new_value: card.annual_fee,
    created: '2025-01-12T09:30:00Z',
  },
  {
    id: card.id * 100 + 1,
    card_id: card.id,
    field_name: 'interest_rate_apr',
    old_value: card.interest_rate_apr
      ? (parseFloat(card.interest_rate_apr) - 1).toFixed(2)
      : null,
    new_value: card.interest_rate_apr,
    created: '2025-01-08T09:30:00Z',
  },
];

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

    // Card field history (detail-page trust sections). Must be served its
    // own serializer shape — the generic list payload below crashes it.
    const historyMatch = url.pathname.match(/\/credit-cards\/(\d+)\/field-history\/$/);
    if (historyMatch) {
      const historyCard = cards.find(c => c.id === Number(historyMatch[1]));
      const entries = historyCard ? fieldHistoryFor(historyCard) : [];
      await route.fulfill({
        json: { count: entries.length, next: null, previous: null, results: entries },
      });
      return;
    }

    // Advanced search family (discovery page). Mirrors the response shape
    // of src/mocks/handlers.ts; specs that register their own
    // advanced-search route after mockApi() keep precedence.
    if (url.pathname.endsWith('/credit-cards/advanced-search/sort-options/')) {
      await route.fulfill({ json: { sort_options: ADVANCED_SEARCH_SORT_OPTIONS } });
      return;
    }

    if (url.pathname.endsWith('/credit-cards/advanced-search/categories/')) {
      await route.fulfill({ json: { categories: ADVANCED_SEARCH_CATEGORIES } });
      return;
    }

    if (url.pathname.endsWith('/credit-cards/advanced-search/normalize/')) {
      await route.fulfill({
        json: { normalized_query: {}, query_hash: 'e2e', canonical_string: '' },
      });
      return;
    }

    if (url.pathname.endsWith('/credit-cards/advanced-search/')) {
      let results = allCards;
      const advSearch = url.searchParams.get('search');
      if (advSearch) {
        const term = advSearch.toLowerCase();
        results = results.filter(
          card =>
            card.name.toLowerCase().includes(term) || card.bank_name.toLowerCase().includes(term)
        );
      }
      const categories = url.searchParams.get('categories')?.split(',').filter(Boolean) ?? [];
      if (categories.length > 0) {
        // Same convention as src/mocks/handlers.ts: the synthetic fixtures
        // carry no category mapping, so membership is by card-name match.
        results = results.filter(card =>
          categories.some(cat => card.name.toLowerCase().includes(cat.toLowerCase()))
        );
      }
      if (url.searchParams.get('is_islamic') === 'true') {
        results = results.filter(card => card.is_islamic);
      }
      const advMin = url.searchParams.get('annual_fee_min');
      const advMax = url.searchParams.get('annual_fee_max');
      if (advMin) {
        results = results.filter(
          card => card.annual_fee !== null && parseFloat(card.annual_fee) >= parseFloat(advMin)
        );
      }
      if (advMax) {
        results = results.filter(
          card => card.annual_fee !== null && parseFloat(card.annual_fee) <= parseFloat(advMax)
        );
      }
      await route.fulfill({
        json: {
          query: advSearch ?? '',
          total: results.length,
          page: 1,
          page_size: 20,
          results,
          facets: {},
          took: 1,
          source: 'database',
          sort_options: ADVANCED_SEARCH_SORT_OPTIONS,
          categories: ADVANCED_SEARCH_CATEGORIES,
          normalized_query: {},
        },
      });
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

    const bank = url.searchParams.get('bank');
    if (bank) {
      results = results.filter(card => card.bank_id === Number(bank));
    }

    const bankName = url.searchParams.get('bank_name');
    if (bankName) {
      results = results.filter(card => card.bank_name === bankName);
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
