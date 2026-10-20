import { act, configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';

import { ThemeProvider } from '../hooks/ThemeProvider';
import { LanguageProvider } from '../locales';
import { server } from '../mocks/jest.setup';
import { advancedSearchService } from '../services/advancedSearch';

import AdvancedSearchPage from './AdvancedSearchPage';

jest.setTimeout(25000);
// Debounced (300 ms) search + mocked fetch can exceed the 1 s default under full-suite load.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
});
afterAll(() => server.close());

const NavigationControls = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="query">{location.search}</output>
      <button onClick={() => navigate(-1)}>Back</button>
      <button onClick={() => navigate(1)}>Forward</button>
      <Link to="/search?is_islamic=true">Islamic search</Link>
    </>
  );
};

const renderAdvancedSearch = (initialUrl = '/search') => {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <NavigationControls />
      <ThemeProvider>
        <LanguageProvider>
          <Routes>
            <Route path="/search" element={<AdvancedSearchPage />} />
            <Route path="/card/:bankSlug/:cardSlug" element={<div />} />
          </Routes>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('AdvancedSearchPage', () => {
  beforeEach(() => jest.useRealTimers());
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders page header', () => {
    renderAdvancedSearch();
    expect(screen.getByRole('heading', { level: 1, name: /Advanced Search/i })).toBeInTheDocument();
  });

  it('saves normalized search terms on this device before confirming success', async () => {
    const normalized = {
      normalized_query: {},
      query_hash: 'islamic',
      canonical_string: 'is_islamic=true',
    };
    const normalize = jest.spyOn(advancedSearchService, 'normalize').mockResolvedValue(normalized);
    const alert = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    localStorage.removeItem('savedSearches');
    try {
      renderAdvancedSearch('/search?is_islamic=true');
      await userEvent.click(
        await screen.findByRole('button', { name: /save search on this device/i })
      );
      await waitFor(() => expect(alert).toHaveBeenCalledWith('Search saved on this device.'));
      expect(normalize).toHaveBeenCalledWith(expect.objectContaining({ is_islamic: true }));
      expect(JSON.parse(localStorage.getItem('savedSearches') || '[]')).toEqual([
        { ...normalized, savedAt: expect.any(String) },
      ]);
    } finally {
      normalize.mockRestore();
      alert.mockRestore();
      localStorage.removeItem('savedSearches');
    }
  });

  it('reports storage failures without claiming the search was saved', async () => {
    const normalize = jest
      .spyOn(advancedSearchService, 'normalize')
      .mockResolvedValue({ normalized_query: {}, query_hash: 'empty', canonical_string: '' });
    const alert = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    const write = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      renderAdvancedSearch();
      await userEvent.click(
        await screen.findByRole('button', { name: /save search on this device/i })
      );
      await waitFor(() => expect(alert).toHaveBeenCalledWith('Failed to save search'));
      expect(alert).toHaveBeenCalledTimes(1);
    } finally {
      normalize.mockRestore();
      alert.mockRestore();
      write.mockRestore();
      log.mockRestore();
    }
  });

  describe('URL synchronization', () => {
    const advance = async (ms: number) => {
      for (let elapsed = 0; elapsed < ms; elapsed += 50) {
        await act(async () => {
          jest.advanceTimersByTime(Math.min(50, ms - elapsed));
        });
      }
    };

    it.each([50, 350])(
      'preserves income and checkbox edits %i ms apart without duplicate requests',
      async delay => {
        const search = jest.spyOn(advancedSearchService, 'search').mockResolvedValue({
          total: 0,
          page: 1,
          page_size: 20,
          results: [],
          facets: {},
          query: '',
          took: 0,
          source: 'database',
          sort_options: [],
          categories: [],
          normalized_query: {},
        });
        try {
          jest.useFakeTimers();
          renderAdvancedSearch();
          await advance(300);
          expect(search).toHaveBeenCalledTimes(1);
          search.mockClear();

          const income = screen.getByLabelText(/monthly income/i, { selector: 'input' });
          const includeUnknown = screen.getByLabelText(
            "Include cards whose income requirement isn't published"
          );
          fireEvent.change(income, { target: { value: '30000' } });
          await advance(delay);
          fireEvent.click(includeUnknown);
          await advance(1000);

          expect(income).toHaveValue(30000);
          expect(includeUnknown).not.toBeChecked();
          const params = new URLSearchParams(screen.getByTestId('query').textContent || '');
          expect(params.get('max_min_monthly_income')).toBe('30000');
          expect(params.get('include_unknown_income')).toBe('false');
          expect(search).toHaveBeenLastCalledWith(
            expect.objectContaining({
              max_min_monthly_income: 30000,
              include_unknown_income: 'false',
            })
          );
          expect(search).toHaveBeenCalledTimes(delay < 300 ? 1 : 2);
        } finally {
          search.mockRestore();
        }
      }
    );

    it('restores filters on back/forward and cancels edits pending during navigation', async () => {
      const search = jest.spyOn(advancedSearchService, 'search').mockResolvedValue({
        total: 0,
        page: 1,
        page_size: 20,
        results: [],
        facets: {},
        query: '',
        took: 0,
        source: 'database',
        sort_options: [],
        categories: [],
        normalized_query: {},
      });
      try {
        jest.useFakeTimers();
        renderAdvancedSearch('/search?max_min_monthly_income=30000&include_unknown_income=false');
        await advance(300);
        fireEvent.click(screen.getByRole('link', { name: 'Islamic search' }));
        await advance(300);
        const income = screen.getByLabelText(/monthly income/i, { selector: 'input' });
        const islamic = screen.getByRole('checkbox', { name: /Islamic \(Shariah\) cards only/ });
        const includeUnknown = screen.getByLabelText(
          "Include cards whose income requirement isn't published"
        );
        expect(income).toHaveValue(null);
        expect(islamic).toBeChecked();
        expect(includeUnknown).toBeChecked();

        // Leave an edit pending when navigating away from this history entry.
        fireEvent.change(income, { target: { value: '50000' } });
        await advance(50);
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        await advance(1000);
        expect(income).toHaveValue(30000);
        expect(islamic).not.toBeChecked();
        expect(includeUnknown).not.toBeChecked();
        expect(search).toHaveBeenLastCalledWith(
          expect.objectContaining({
            max_min_monthly_income: 30000,
            include_unknown_income: 'false',
          })
        );
        expect(screen.getByTestId('query')).toHaveTextContent('max_min_monthly_income=30000');

        fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
        await advance(1000);
        expect(income).toHaveValue(null);
        expect(islamic).toBeChecked();
        expect(includeUnknown).toBeChecked();
        expect(screen.getByTestId('query')).not.toHaveTextContent('max_min_monthly_income');
        expect(search).toHaveBeenLastCalledWith(expect.objectContaining({ is_islamic: true }));
        expect(search.mock.calls[search.mock.calls.length - 1][0]).not.toHaveProperty(
          'max_min_monthly_income'
        );
        expect(search).toHaveBeenCalledTimes(4);
      } finally {
        search.mockRestore();
      }
    });
  });

  describe('card network, Islamic, dual-currency and income filters', () => {
    it('shows network facet counts and filters when a network chip is toggled', async () => {
      renderAdvancedSearch();
      const group = await screen.findByRole('group', { name: 'Card network' });
      const visa = await within(group).findByRole('button', { name: /Visa \(2\)/ });
      expect(visa).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(visa);
      // Wait for the filtered state itself: "Other" is also absent while results reload.
      await waitFor(() =>
        expect({
          other: Boolean(screen.queryByText('Other Rewards Card')),
          visa: Boolean(screen.queryByText('Test Credit Card')),
        }).toEqual({ other: false, visa: true })
      );
      expect(within(group).getByRole('button', { name: /Visa/ })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('applies network, Islamic and dual-currency filters from the URL', async () => {
      renderAdvancedSearch('/search?is_islamic=true');
      await waitFor(() => expect(screen.queryByText('Test Credit Card')).not.toBeInTheDocument());
      expect(await screen.findByText('Other Rewards Card')).toBeInTheDocument();
      expect(
        (
          screen.getByRole('checkbox', {
            name: /Islamic \(Shariah\) cards only/,
          }) as HTMLInputElement
        ).checked
      ).toBe(true);
      expect(
        screen.getByRole('checkbox', { name: 'Islamic (Shariah) cards only (1)' })
      ).toBeInTheDocument();
    });

    it('filters by income and honors the include-unknown checkbox', async () => {
      renderAdvancedSearch('/search?max_min_monthly_income=30000');
      // Default includes cards with no published requirement; the BDT 50,000 card is out.
      await waitFor(() => expect(screen.queryByText('Test Credit Card')).not.toBeInTheDocument());
      expect(await screen.findByText('Other Rewards Card')).toBeInTheDocument();
      expect(
        (
          screen.getByLabelText(
            "Include cards whose income requirement isn't published"
          ) as HTMLInputElement
        ).checked
      ).toBe(true);

      await userEvent.click(
        screen.getByLabelText("Include cards whose income requirement isn't published")
      );
      await waitFor(
        () => expect(screen.queryByText('Other Rewards Card')).not.toBeInTheDocument(),
        {
          timeout: 3000,
        }
      );
    });
  });
});
