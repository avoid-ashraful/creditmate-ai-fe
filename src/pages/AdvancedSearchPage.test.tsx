import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { ThemeProvider } from '../hooks/ThemeProvider';
import { LanguageProvider } from '../locales';
import { server } from '../mocks/jest.setup';

import AdvancedSearchPage from './AdvancedSearchPage';

jest.setTimeout(25000);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.useRealTimers();
});
afterAll(() => server.close());

const renderAdvancedSearch = (initialUrl = '/search') => {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
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

  describe('card network, Islamic, dual-currency and income filters', () => {
    it('shows network facet counts and filters when a network chip is toggled', async () => {
      renderAdvancedSearch();
      const group = await screen.findByRole('group', { name: 'Card network' });
      const visa = await within(group).findByRole('button', { name: /Visa \(1\)/ });
      expect(visa).toHaveAttribute('aria-pressed', 'false');

      await userEvent.click(visa);
      await waitFor(() => expect(screen.queryByText('Other Rewards Card')).not.toBeInTheDocument());
      expect(screen.getByText('Test Credit Card')).toBeInTheDocument();
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

      // Let the page's debounced URL sync settle; it re-reads the URL into state.
      await new Promise(resolve => setTimeout(resolve, 700));
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
