import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import { apiService } from '../services/api';

import CategoryPage from './CategoryPage';

// getCreditCards is mocked; transformCreditCard (spread from the real service) keeps working.
jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: Object.assign(
      Object.create(Object.getPrototypeOf(actual.apiService)),
      actual.apiService,
      {
        getCreditCards: jest.fn(),
      }
    ),
  };
});

jest.mock('../components/CardDetailsPopup', () => () => null);
jest.mock('../components/ComparisonBar', () => () => null);

const mockGetCreditCards = apiService.getCreditCards as jest.Mock;

const makeResponse = (results: number[], count = results.length, next: string | null = null) => ({
  count,
  next,
  previous: null,
  results: results.map(id => ({
    id,
    bank_name: `Bank ${id}`,
    name: `Category Card ${id}`,
    annual_fee: '1000.00',
    interest_rate_apr: '20.00',
    is_active: true,
  })),
});

const renderCategoryPage = (slug: string) =>
  render(
    <MemoryRouter initialEntries={[`/category/${slug}`]}>
      <Routes>
        <Route path="/category/:slug" element={<CategoryPage />} />
      </Routes>
    </MemoryRouter>
  );

const NavigationHarness = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  const [shouldNavigate, setShouldNavigate] = React.useState(false);

  React.useEffect(() => {
    if (!shouldNavigate) return;
    navigate(to, { replace: true });
  }, [navigate, shouldNavigate, to]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setShouldNavigate(true);
        }}
      >
        Navigate
      </button>
      <Routes>
        <Route path="/category/:slug" element={<CategoryPage />} />
      </Routes>
    </>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  document.head.innerHTML = '';
  document.title = '';
});

test('renders travel category with badge, filtered API call, and SEO meta', async () => {
  mockGetCreditCards.mockResolvedValue({
    count: 2,
    next: null,
    previous: null,
    results: [
      {
        id: 1,
        bank_name: 'Bank A',
        name: 'Travel Card 1',
        annual_fee: '2000.00',
        interest_rate_apr: '25.00',
        lounge_access_international: '5 visits',
        lounge_access_domestic: '',
        is_active: true,
      },
      {
        id: 2,
        bank_name: 'Bank B',
        name: 'Travel Card 2',
        annual_fee: '0.00',
        interest_rate_apr: null,
        is_active: true,
      },
    ],
  });

  renderCategoryPage('travel');

  expect(screen.getByText('Travel', { selector: '.category-badge' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Travel Credit Cards');

  await waitFor(() => expect(mockGetCreditCards).toHaveBeenCalledTimes(1));

  const callArgs = mockGetCreditCards.mock.calls[0][0];
  expect(callArgs).toMatchObject({ hasLoungeAccess: true });
  expect(callArgs).toMatchObject({ page_size: 100 });

  // Rendered list shows real (transformed) API data, including truthful strings
  expect(await screen.findByText('Travel Card 1')).toBeInTheDocument();
  expect(screen.getByText('2 cards found')).toBeInTheDocument();
  expect(screen.getByText('Bank A')).toBeInTheDocument();

  // SEO-friendly titles/meta per category
  await waitFor(() =>
    expect(document.title).toBe('Best Travel Credit Cards in Bangladesh | CreditMate AI')
  );
  // Direct document.head access is required to assert SEO meta; no testing-library equivalent
  // eslint-disable-next-line testing-library/no-node-access
  const metaDescription = document.querySelector('meta[name="description"]');
  expect(metaDescription?.getAttribute('content')).toContain('travel credit cards');
  // eslint-disable-next-line testing-library/no-node-access
  const canonical = document.querySelector('link[rel="canonical"]');
  expect(canonical?.getAttribute('href')).toContain('/category/travel');
});

test('no-annual-fee category requests numeric-zero fee cards only', async () => {
  mockGetCreditCards.mockResolvedValue({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });

  renderCategoryPage('no-annual-fee');

  await waitFor(() => expect(mockGetCreditCards).toHaveBeenCalledTimes(1));
  const callArgs = mockGetCreditCards.mock.calls[0][0];
  expect(callArgs).toMatchObject({ hasAnnualFee: false });
  // Unknown fees must stay unknown - empty result message, not a crash
  expect(await screen.findByText(/No credit cards found/i)).toBeInTheDocument();
});

test('unknown slug shows category-not-found message', async () => {
  renderCategoryPage('does-not-exist');
  expect(screen.getByText('Category not found')).toBeInTheDocument();
  expect(mockGetCreditCards).not.toHaveBeenCalled();
});

test('shows error state when API fails', async () => {
  mockGetCreditCards.mockRejectedValue(new Error('Network error'));
  renderCategoryPage('cashback');
  expect(await screen.findByText(/Failed to load credit cards/i)).toBeInTheDocument();
});

test('loads the next API page and deduplicates cashback results from both terms', async () => {
  mockGetCreditCards
    .mockResolvedValueOnce(makeResponse([101, 102], 101, '/?page=2'))
    .mockResolvedValueOnce(makeResponse([102, 103], 101, '/?page=2'))
    .mockResolvedValueOnce(makeResponse([201], 101, null))
    .mockResolvedValueOnce(makeResponse([202], 101, null));

  renderCategoryPage('cashback');

  await screen.findByText('Category Card 102');
  expect(screen.getByText('3 cards found')).toBeInTheDocument();
  expect(mockGetCreditCards.mock.calls[0][0]).toEqual({
    searchTerm: 'cash back',
    ordering: 'annual_fee',
    page_size: 100,
  });
  expect(mockGetCreditCards.mock.calls[1][0]).toEqual({
    searchTerm: 'cashback',
    ordering: 'annual_fee',
    page_size: 100,
  });

  fireEvent.click(screen.getByRole('button', { name: /load more cards/i }));
  await screen.findByText('Category Card 201');
  expect(screen.getByText('Category Card 202')).toBeInTheDocument();
  expect(screen.getByText('5 cards found')).toBeInTheDocument();
  expect(mockGetCreditCards.mock.calls[2][0]).toEqual({
    searchTerm: 'cash back',
    ordering: 'annual_fee',
    page: 2,
    page_size: 100,
  });
  expect(mockGetCreditCards.mock.calls[3][0]).toEqual({
    searchTerm: 'cashback',
    ordering: 'annual_fee',
    page: 2,
    page_size: 100,
  });
  expect(screen.queryByRole('button', { name: /load more cards/i })).not.toBeInTheDocument();
});

test('tracks independent pages when dual search streams have different lengths', async () => {
  mockGetCreditCards
    .mockResolvedValueOnce(makeResponse([101], 150, '/?page=2'))
    .mockResolvedValueOnce(makeResponse([102], 25, null))
    .mockResolvedValueOnce(makeResponse([201], 150, '/?page=3'));

  renderCategoryPage('business');

  await screen.findByText('Category Card 101');
  await screen.findByText('Category Card 102');
  fireEvent.click(screen.getByRole('button', { name: /load more cards/i }));
  await screen.findByText('Category Card 201');

  expect(mockGetCreditCards.mock.calls[2][0]).toEqual({
    searchTerm: 'business',
    ordering: 'annual_fee',
    page: 2,
    page_size: 100,
  });
  expect(mockGetCreditCards).toHaveBeenCalledTimes(3);
  expect(screen.queryByText('Category Card 1')).not.toBeInTheDocument();
});

test('cancels a pending load-more when the category slug changes', async () => {
  mockGetCreditCards
    .mockResolvedValueOnce(makeResponse([101], 150, '/?page=2'))
    .mockResolvedValueOnce(makeResponse([102], 25, null))
    .mockImplementationOnce(() => new Promise(() => undefined));
  mockGetCreditCards.mockResolvedValueOnce(makeResponse([1]));

  render(
    <MemoryRouter initialEntries={['/category/cashback']}>
      <NavigationHarness to="/category/premium" />
    </MemoryRouter>
  );
  await screen.findByText('Category Card 101');
  fireEvent.click(screen.getByRole('button', { name: /load more cards/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));

  await screen.findByRole('heading', { name: /Premium Credit Cards/ });
  expect(screen.queryByText('Category Card 201')).not.toBeInTheDocument();
});

test('navigating away restores the previous document title', async () => {
  document.title = 'CreditMate AI';
  mockGetCreditCards.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
  const { unmount } = renderCategoryPage('premium');
  await waitFor(() => expect(document.title).toContain('Premium'));
  unmount();
  expect(document.title).toBe('CreditMate AI');
});

test('unmounting mid-fetch does not throw or set state', async () => {
  let resolveFetch: (v: unknown) => void = () => undefined;
  mockGetCreditCards.mockReturnValue(
    new Promise(resolve => {
      resolveFetch = resolve;
    })
  );
  const { unmount } = renderCategoryPage('travel');
  unmount();
  expect(() => resolveFetch({ count: 0, next: null, previous: null, results: [] })).not.toThrow();
});
