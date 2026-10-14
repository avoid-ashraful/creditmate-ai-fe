import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { apiService } from '../services/api';
import { CreditCard } from '../types';

import RewardCalculatorPage from './RewardCalculatorPage';

const baseCard: CreditCard = {
  id: 1,
  bankId: 1,
  bankName: 'Test Bank',
  name: 'Flat Rate Card',
  annualFee: 1000,
  interestRateApr: 20,
  loungeAccessInternational: null,
  loungeAccessDomestic: null,
  cashAdvanceFee: '',
  latePaymentFee: '',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent.',
  additionalFeatures: [],
  sourceUrl: '',
  isActive: true,
  lastUpdated: null,
  images: [],
};

const apiResponse = (results: CreditCard[]) => ({
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

let getCardsSpy: jest.SpyInstance;
let transformSpy: jest.SpyInstance;
let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;

beforeEach(() => {
  getCardsSpy = jest.spyOn(apiService, 'getCreditCards');
  // Identity transform: the fixtures are already CreditCard-shaped.
  transformSpy = jest
    .spyOn(apiService, 'transformCreditCard')
    .mockImplementation(card => card as unknown as CreditCard);
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  getCardsSpy.mockRestore();
  transformSpy.mockRestore();
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

test('shows an accessible field error for negative input and does not rank', async () => {
  getCardsSpy.mockResolvedValue(apiResponse([baseCard]));
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
  getCardsSpy.mockResolvedValue(apiResponse([baseCard]));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Total monthly spend must be greater than zero'
  );
  expect(screen.queryByText(/Flat Rate Card/i)).not.toBeInTheDocument();
});

test('shows an empty state before submission', async () => {
  getCardsSpy.mockResolvedValue(apiResponse([baseCard]));
  renderPage();

  expect(await screen.findByText(/Enter your monthly spend/i)).toBeInTheDocument();
});

test('shows an API-error state when the card request fails', async () => {
  getCardsSpy.mockRejectedValue(new Error('boom'));
  renderPage();

  expect(
    await screen.findByText(/Failed to load credit cards\. Please try again later\./i)
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Calculate best value cards/i })).toBeDisabled();
});

test('ranks top 5 cards by net annual value and shows break-even and export CTAs', async () => {
  const cards: CreditCard[] = [
    { ...baseCard, id: 1, name: 'Card A', annualFee: 1000 },
    { ...baseCard, id: 2, name: 'Card B', annualFee: 6000 },
    {
      ...baseCard,
      id: 3,
      name: 'Card C',
      annualFee: 3000,
      rewardPointsPolicy: 'Earn 1.5 points for every BDT 100 spent.',
    },
    { ...baseCard, id: 4, name: 'Card D', annualFee: 2000 },
    { ...baseCard, id: 5, name: 'Card E', annualFee: 8000 },
    { ...baseCard, id: 6, name: 'Card F', annualFee: 9000 },
  ];
  getCardsSpy.mockResolvedValue(apiResponse(cards));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await userEvent.type(screen.getByLabelText(/Dining/i), '10000');
  await userEvent.type(screen.getByLabelText(/Travel/i), '5000');
  await userEvent.type(screen.getByLabelText(/Groceries/i), '8000');
  await userEvent.type(screen.getByLabelText(/Fuel/i), '4000');
  await userEvent.type(screen.getByLabelText(/Other/i), '3000');
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));

  expect(await screen.findByText(/Top 5 cards by net annual value/i)).toBeInTheDocument();

  // Only the top 5 ranked cards are shown; the 6th (lowest net value) is excluded.
  expect(screen.getByText('Card A')).toBeInTheDocument();
  expect(screen.getByText('Card C')).toBeInTheDocument();
  expect(screen.queryByText('Card F')).not.toBeInTheDocument();

  // Break-even monthly spend shown per card: fee / (12 × 0.02).
  // Card A: 1000 / 0.24 ≈ BDT 4,167.
  expect(screen.getByText('BDT 4,167')).toBeInTheDocument();

  // Net annual value for Card A: 7,200 − 1,000 = 6,200.
  expect(screen.getByText('BDT 6,200')).toBeInTheDocument();

  // Export-to-comparison CTA uses the app's existing /compare?ids= mechanism.
  const exportButtons = screen.getAllByRole('button', { name: /Export to comparison/i });
  expect(exportButtons).toHaveLength(5);
  await userEvent.click(exportButtons[0]);
  await waitFor(() => expect(window.location.pathname).toBe('/compare'));
  expect(window.location.search).toBe('?ids=1');
});
