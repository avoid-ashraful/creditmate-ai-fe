import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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

const waitForContentLoad = async () => {
  await waitFor(
    () => {
      expect(screen.queryByText(/Loading search results/i)).not.toBeInTheDocument();
    },
    { timeout: 14000 }
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
});
