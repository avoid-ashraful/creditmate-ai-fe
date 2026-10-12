import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { apiService, CreditCardApiResponse } from '../services/api';

import RewardCalculatorPage from './RewardCalculatorPage';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  return {
    ...actual,
    apiService: {
      getCreditCards: jest.fn(),
      transformCreditCard: actual.apiService.transformCreditCard,
    },
  };
});

const mockGetCreditCards = apiService.getCreditCards as jest.MockedFunction<
  typeof apiService.getCreditCards
>;

const baseCard: CreditCardApiResponse = {
  id: 1,
  bank_id: 1,
  bank_name: 'Test Bank',
  name: 'Flat Rate Card',
  annual_fee: 1000,
  interest_rate_apr: 20,
  lounge_access_international: undefined,
  lounge_access_domestic: undefined,
  cash_advance_fee: '',
  late_payment_fee: '',
  annual_fee_waiver_policy: null,
  reward_points_policy: 'Earn 1 point for every BDT 50 spent.',
  additional_features: [],
  sourceUrl: '',
  is_active: true,
  images: [],
};

const apiResponse = (results: CreditCardApiResponse[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const renderPage = () =>
  render(
    <BrowserRouter>
      <RewardCalculatorPage />
    </BrowserRouter>
  );

let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

test('shows an accessible field error for negative input and does not rank', async () => {
  mockGetCreditCards.mockResolvedValue(apiResponse([baseCard]));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });

  const diningInput = screen.getByLabelText(/Dining/i);
  await userEvent.type(diningInput, '-100');
  await userEvent.type(screen.getByLabelText(/Other/i), '5000');
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));

  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('Enter a non-negative amount');
  expect(diningInput).toHaveAttribute('aria-invalid', 'true');
  expect(screen.queryByText(/Top \d+ cards/i)).not.toBeInTheDocument();
});

test('rejects an all-zero allocation with a form-level alert', async () => {
  mockGetCreditCards.mockResolvedValue(apiResponse([baseCard]));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Total monthly spend must be greater than zero'
  );
  expect(screen.queryByText(/Flat Rate Card/i)).not.toBeInTheDocument();
});

test('shows an empty state before submission', async () => {
  mockGetCreditCards.mockResolvedValue(apiResponse([baseCard]));
  renderPage();

  expect(await screen.findByText(/Enter your monthly spend/i)).toBeInTheDocument();
});

test('shows an API-error state when the card request fails', async () => {
  mockGetCreditCards.mockRejectedValue(new Error('boom'));
  renderPage();

  expect(
    await screen.findByText(/Failed to load credit cards\. Please try again later\./i)
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Calculate best value cards/i })).toBeDisabled();
});

test('ranks top 5 cards by net annual value and shows break-even and export CTAs', async () => {
  const cards: CreditCardApiResponse[] = [
    { ...baseCard, id: 1, name: 'Card A', annual_fee: 1000 },
    { ...baseCard, id: 2, name: 'Card B', annual_fee: 6000 },
    {
      ...baseCard,
      id: 3,
      name: 'Card C',
      annual_fee: 3000,
      reward_points_policy: 'Earn 1.5 points for every BDT 100 spent.',
    },
    { ...baseCard, id: 4, name: 'Card D', annual_fee: 2000 },
    { ...baseCard, id: 5, name: 'Card E', annual_fee: 8000 },
    { ...baseCard, id: 6, name: 'Card F', annual_fee: 9000 },
  ];
  mockGetCreditCards.mockResolvedValue(apiResponse(cards));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await userEvent.type(screen.getByLabelText(/Dining/i), '10000');
  await userEvent.type(screen.getByLabelText(/Travel/i), '5000');
  await userEvent.type(screen.getByLabelText(/Groceries/i), '8000');
  await userEvent.type(screen.getByLabelText(/Fuel/i), '4000');
  await userEvent.type(screen.getByLabelText(/Other/i), '3000');
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));

  expect(await screen.findByText(/Top 5 cards by net annual value/i)).toBeInTheDocument();

  // Only the top 5 ranked cards are shown; the 6th is excluded.
  expect(screen.getByText('Card A')).toBeInTheDocument();
  expect(screen.getByText('Card C')).toBeInTheDocument();
  expect(screen.queryByText('Card F')).not.toBeInTheDocument();

  // Break-even monthly spend shown per card: fee / (12 × 0.02).
  // Card A: 1000 / 0.24 ≈ BDT 4,167.
  expect(screen.getByText('BDT 4,167')).toBeInTheDocument();

  // Net annual value for Card A: 7,200 − 1,000 = 6,200.
  expect(screen.getByText('BDT 6,200')).toBeInTheDocument();

  // Export-to-comparison CTA uses the app's /compare?ids= mechanism.
  const exportButtons = screen.getAllByRole('button', { name: /Export to comparison/i });
  expect(exportButtons).toHaveLength(5);
  await userEvent.click(exportButtons[0]);
  await waitFor(() => expect(window.location.pathname).toBe('/compare'));
  expect(window.location.search).toBe('?ids=1');
});
