import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';
import { testCards } from '../mocks/handlers';
import { server } from '../mocks/jest.setup';

import ComparisonPage from './ComparisonPage';
import HomePage from './HomePage';

// Mock experiments to always return control (original text)
jest.mock('../lib/experiments', () => ({
  getVariant: () => 'control',
  isTreatment: () => false,
  EXPERIMENTS: {
    hero_cta_text: {
      key: 'hero_cta_text',
      name: 'Hero CTA Text',
      treatmentAllocation: 50,
      enabled: true,
      minSampleSize: 100,
      confidenceLevel: 0.95,
    },
    quiz_vs_browse_default: {
      key: 'quiz_vs_browse_default',
      name: 'Quiz vs Browse Default',
      treatmentAllocation: 50,
      enabled: true,
      minSampleSize: 100,
      confidenceLevel: 0.95,
    },
    card_layout: {
      key: 'card_layout',
      name: 'Card Layout',
      treatmentAllocation: 50,
      enabled: true,
      minSampleSize: 100,
      confidenceLevel: 0.95,
    },
  },
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  try {
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
  } finally {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  }
});

const renderRoutes = () =>
  render(
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/compare" element={<ComparisonPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );

test('renders HomePage with credit card content from the mocked API', async () => {
  renderRoutes();

  expect(screen.getByText(/Loading credit cards.../i)).toBeInTheDocument();
  expect(screen.getByText(/Find Your Perfect Credit Card/i)).toBeInTheDocument();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  expect(screen.getByText(/Other Rewards Card/i)).toBeInTheDocument();
  expect(screen.getByText(/Filter Options/i)).toBeInTheDocument();
  expect(
    screen.getByText((_, node) => node?.textContent === 'Credit Cards (4)')
  ).toBeInTheDocument();
});

// Regression test for the actual Django CreditCardListSerializer list contract:
// bank_name, no nested bank/bank_id, decimal strings, and lounge strings.
test('transforms the minimal Django list response contract correctly', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  expect(screen.getAllByText(/Test Bank/i).length).toBeGreaterThan(0);
  expect(screen.getByText(/BDT 1,000/i)).toBeInTheDocument();
  expect(screen.getByText(/20% APR/i)).toBeInTheDocument();
  expect(
    screen.getByText((_, node) => node?.textContent === "2 visits (Int'l) / 4 visits (Domestic)")
  ).toBeInTheDocument();
});

test('filter panel can be expanded and collapsed', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Expand/i }));

  expect(screen.getByRole('heading', { name: /Banks/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /^Annual Fee$/i })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Collapse/i }));
  expect(screen.getByRole('button', { name: /Expand/i })).toBeInTheDocument();
});

test('filters cards through the mocked API', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  expect(screen.getByText(/Other Rewards Card/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Expand/i }));
  await userEvent.click(screen.getByLabelText(/Test Bank/i));
  await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

  await screen.findByText(/Test Credit Card/i);
  expect(screen.queryByText(/Other Rewards Card/i)).not.toBeInTheDocument();
});

test('filters by card network through the mocked API and keeps the selection after applying', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Expand/i }));
  await userEvent.click(screen.getByRole('button', { name: 'Visa' }));
  await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));

  await waitFor(() => expect(screen.queryByText(/Other Rewards Card/i)).not.toBeInTheDocument());
  expect(screen.getByText(/Test Credit Card/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Visa' })).toHaveAttribute('aria-pressed', 'true');
});

test('filters Islamic and dual-currency cards through the mocked API', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Expand/i }));
  await userEvent.click(screen.getByLabelText('Islamic (Shariah) cards only'));
  await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));
  await waitFor(() => expect(screen.queryByText(/Test Credit Card/i)).not.toBeInTheDocument());
  expect(screen.getByText(/Other Rewards Card/i)).toBeInTheDocument();

  await userEvent.click(screen.getByLabelText('Dual-currency only'));
  await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));
  await waitFor(() => expect(screen.queryByText(/Other Rewards Card/i)).not.toBeInTheDocument());
  expect(screen.queryByText(/Test Credit Card/i)).not.toBeInTheDocument();
  expect(await screen.findByText(/Category not found/i)).toBeInTheDocument();
});

test('income filter includes unknown-income cards by default and excludes them when unchecked', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /Expand/i }));
  // Test Credit Card needs BDT 50,000; Other Rewards Card publishes no requirement.
  await userEvent.type(screen.getByLabelText('My monthly income (BDT)'), '30000');
  await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));
  await waitFor(() => expect(screen.queryByText(/Test Credit Card/i)).not.toBeInTheDocument());
  expect(screen.getByText(/Other Rewards Card/i)).toBeInTheDocument();

  await userEvent.click(
    screen.getByLabelText("Include cards whose income requirement isn't published")
  );
  await userEvent.click(screen.getByRole('button', { name: /Apply Filters/i }));
  await waitFor(() => expect(screen.queryByText(/Other Rewards Card/i)).not.toBeInTheDocument());
  expect(await screen.findByText(/Category not found/i)).toBeInTheDocument();
});

test('searches cards through the mocked API', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  await userEvent.type(screen.getByPlaceholderText(/Search by card name/i), 'other');
  await userEvent.click(screen.getByRole('button', { name: /Search/i }));

  await screen.findByText(/Other Rewards Card/i);
  expect(screen.queryByText(/Test Credit Card/i)).not.toBeInTheDocument();
});

test('prefills the search box and filters from the ?search= URL parameter', async () => {
  window.history.replaceState({}, '', '/?search=other');
  renderRoutes();

  await screen.findByText(/Other Rewards Card/i);
  expect(screen.queryByText(/Test Credit Card/i)).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Search by card name/i)).toHaveValue('other');
});

test('selects cards and exposes compare navigation', async () => {
  renderRoutes();

  expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole('button', { name: /Add a card/i })[0]);
  await waitFor(() =>
    expect(screen.getAllByRole('button', { name: /Share This Comparison/i })).toHaveLength(1)
  );
  await userEvent.click(screen.getAllByRole('button', { name: /Add a card/i })[0]);

  expect(screen.getAllByText((_, node) => node?.textContent === 'Selected: 2 of 4')).toHaveLength(
    2
  );

  // The ComparisonBar link has the compare URL, CardListItem links have card detail URLs
  const compareLinks = screen.getAllByRole('link', { name: /Share This Comparison/i });
  const comparisonBarLink = compareLinks.find(link =>
    link.getAttribute('href')?.includes('/compare')
  );
  expect(comparisonBarLink).toBeInTheDocument();
  expect(comparisonBarLink).toHaveAttribute('href', '/compare?ids=1,2');
  if (comparisonBarLink) {
    await userEvent.click(comparisonBarLink);
  }

  expect(await screen.findByText(/Credit Card Comparison/i)).toBeInTheDocument();
  await screen.findAllByText(/Test Credit Card/i);
  await screen.findAllByText(/Other Rewards Card/i);
  const comparison = within(screen.getByRole('region', { name: 'Compare card features' }));
  expect(comparison.getByText(/by Test Bank/i)).toBeInTheDocument();
  expect(comparison.getByText(/by Other Bank/i)).toBeInTheDocument();
  expect(comparison.getByText(/BDT 1,000/i)).toBeInTheDocument();
  expect(comparison.getByText(/BDT 0/i)).toBeInTheDocument();
});

// Fixture contract: minimal CreditCardListSerializer list shape only.
test('mocked credit-cards fixture matches the Django list serializer fields', () => {
  const expectedKeys = [
    'annual_fee',
    'apply_url',
    'bank_name',
    'card_network',
    'cashback_rules',
    'foreign_transaction_fee',
    'has_annual_fee',
    'has_lounge_access',
    'id',
    'interest_rate_apr',
    'is_active',
    'is_dual_currency',
    'is_islamic',
    'lounge_access_domestic',
    'lounge_access_international',
    'min_monthly_income',
    'name',
    'points_expiry_text',
    'reward_earn_rules',
    'reward_point_value_bdt',
    'reward_program_name',
    'reward_source_url',
    'source_url',
    'supplementary_card_fee',
    'verification_status',
    'verified_at',
  ];

  testCards.forEach(card => {
    expect([...Object.keys(card)].sort()).toEqual(expectedKeys);
  });
});
