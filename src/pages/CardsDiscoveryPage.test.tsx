import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { expectNoAxeViolations } from '../a11y/axe';
import { ToastProvider } from '../components/ui';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { renderWithAuth } from '../mocks/renderAuth';
import { AdvancedSearchResponse, advancedSearchService } from '../services/advancedSearch';
import { CreditCardApiResponse } from '../services/api';
import { fetchAllBanks } from '../services/banks';

import CardsDiscoveryPage from './CardsDiscoveryPage';

jest.mock('../services/advancedSearch', () => {
  const actual = jest.requireActual('../services/advancedSearch');
  return {
    ...actual,
    advancedSearchService: {
      ...actual.advancedSearchService,
      search: jest.fn(),
      getSortOptions: jest.fn(),
      getCategories: jest.fn(),
    },
  };
});
jest.mock('../services/banks', () => {
  const actual = jest.requireActual('../services/banks');
  return { ...actual, fetchAllBanks: jest.fn() };
});
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockSearch = advancedSearchService.search as jest.Mock;
const mockSortOptions = advancedSearchService.getSortOptions as jest.Mock;
const mockCategories = advancedSearchService.getCategories as jest.Mock;
const mockBanks = fetchAllBanks as jest.Mock;

const rawCard = (overrides: Partial<CreditCardApiResponse> = {}): CreditCardApiResponse => ({
  id: 42,
  bank_name: 'Example Bank',
  name: 'Example Card',
  annual_fee: '2000.00',
  interest_rate_apr: '25.00',
  lounge_access_international: '5 visits',
  lounge_access_domestic: 'Unlimited',
  has_lounge_access: true,
  has_annual_fee: true,
  is_active: true,
  creditmate_score: '7.5',
  source_url: 'https://example.com/soc.pdf',
  verified_at: '2026-10-01T00:00:00Z',
  ...overrides,
});

const makeResponse = (
  results: CreditCardApiResponse[],
  total = results.length
): AdvancedSearchResponse => ({
  query: '',
  total,
  page: 1,
  page_size: 20,
  results,
  facets: {
    category: {
      label: 'Category',
      type: 'category',
      buckets: [
        { key: 'travel', label: 'Travel', count: 3, filter: 'categories=travel' },
        { key: 'cashback', label: 'Cashback', count: 5, filter: 'categories=cashback' },
      ],
    },
    bank: {
      label: 'Bank',
      type: 'terms',
      buckets: [{ key: 'Example Bank', label: 'Example Bank', count: 4 }],
    },
  },
  took: 1,
  source: 'database',
  sort_options: [],
  categories: [],
  normalized_query: {},
});

const renderPage = (route = '/cards') =>
  renderWithAuth(
    <ShortlistProvider>
      <ToastProvider>
        <CardsDiscoveryPage />
      </ToastProvider>
    </ShortlistProvider>,
    { route }
  );

describe('CardsDiscoveryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockSortOptions.mockResolvedValue({
      sort_options: [
        { key: 'relevance', label: 'Relevance', description: '' },
        { key: '-creditmate_score', label: 'CreditMate Score (Best First)', description: '' },
        { key: 'annual_fee', label: 'Annual Fee (Low to High)', description: '' },
      ],
    });
    mockCategories.mockResolvedValue({
      categories: [
        { slug: 'travel', name: 'Travel' },
        { slug: 'cashback', name: 'Cashback' },
      ],
    });
    mockBanks.mockResolvedValue([{ id: 1, name: 'Example Bank' }]);
    mockSearch.mockResolvedValue(makeResponse([rawCard()]));
  });

  it('renders result cards with the CreditMate Score as hero and a labelled sort', async () => {
    renderPage();
    expect(await screen.findByRole('link', { name: 'Example Card' })).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    // Sort criterion is always labelled, and defaults to the Score.
    expect(screen.getByText(/Sorted by CreditMate Score/)).toBeInTheDocument();
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ ordering: '-creditmate_score' })
      )
    );
  });

  it('shows facet counts and a searchable bank filter with counts', async () => {
    renderPage();
    await screen.findByRole('link', { name: 'Example Card' });
    // Category facet carries its server count.
    const categoryGroup = await screen.findByRole('group', { name: 'Category' });
    expect(within(categoryGroup).getByText('3')).toBeInTheDocument();
    // Bank filter entry shows the facet count for the bank.
    const bankGroup = screen.getByRole('group', { name: 'Bank' });
    expect(within(bankGroup).getByText('4')).toBeInTheDocument();
  });

  it('searches through the API and reflects the term as a removable chip', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Example Card' });
    await user.type(screen.getByLabelText('Search cards'), 'platinum');
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ search: 'platinum' }))
    );
    const chip = await screen.findByRole('button', { name: /Remove filter/ });
    expect(chip.textContent).toContain('"platinum"');
    // Removing the chip clears the search term again.
    await user.click(chip);
    await waitFor(() => {
      const last = mockSearch.mock.calls[mockSearch.mock.calls.length - 1][0];
      expect(last.search).toBeUndefined();
    });
  });

  it('uses numbered pagination as the only result navigation', async () => {
    mockSearch.mockResolvedValue({ ...makeResponse([rawCard()], 45), page_size: 20 });
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Example Card' });
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }))
    );
    // No show-more / load-more models remain.
    expect(screen.queryByRole('button', { name: /show more|load more/i })).not.toBeInTheDocument();
  });

  it('recovers from zero results by naming the eliminating filter and relaxing it', async () => {
    mockSearch.mockImplementation(async (params: { categories?: string }) =>
      params.categories ? makeResponse([], 0) : makeResponse([rawCard()], 2)
    );
    const user = userEvent.setup();
    renderPage('/cards?categories=travel');

    // The recovery names the filter that eliminated everything…
    expect(await screen.findByText('No products match')).toBeInTheDocument();
    const eliminated = await screen.findByText(/The filter that eliminated the most:/);
    expect(eliminated.textContent).toContain('Travel');
    expect(screen.getByText(/2 products match without your filters/)).toBeInTheDocument();
    const relax = screen.getByRole('button', { name: 'Remove this filter' });
    await user.click(relax);
    // …and one tap relaxes it, bringing results back.
    expect(await screen.findByRole('link', { name: 'Example Card' })).toBeInTheDocument();
  });

  it('saves a search for the signed-out (guest) scope with a toast, never a prompt', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Example Card' });
    await user.click(screen.getByRole('button', { name: 'Save search' }));
    await user.type(await screen.findByLabelText('Name this search'), 'My shortlist hunt');
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Save search' })
    );
    expect(
      await screen.findByText('Search saved — find it under My CreditMate.')
    ).toBeInTheDocument();
    const stored = window.localStorage.getItem('creditmate.savedSearches.v1:guest');
    expect(stored).toContain('My shortlist hunt');
  });

  it('adds a card to the shortlist from the result card', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('link', { name: 'Example Card' });
    await user.click(screen.getByRole('button', { name: /shortlist/i }));
    const stored = window.localStorage.getItem('creditmate.shortlist.v1');
    expect(stored).toContain('Example Card');
  });

  it('has no axe violations with results rendered', async () => {
    const { container } = renderPage();
    await screen.findByRole('link', { name: 'Example Card' });
    await expectNoAxeViolations(container);
  });

  it('shows the error state with retry when the search fails', async () => {
    mockSearch.mockRejectedValue(new Error('down'));
    renderPage();
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});
