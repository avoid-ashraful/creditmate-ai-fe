/* eslint-disable testing-library/no-node-access */
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
  rewardProgramName: 'Test Points',
  rewardEarnRules: [
    {
      category: 'all',
      pointsPerUnit: 1,
      spendUnitBdt: 50,
      text: 'Earn 1 point for every BDT 50 spent.',
    },
  ],
  cashbackRules: [],
  rewardPointValueBdt: 1,
  pointsExpiryText: '',
  rewardSourceUrl: 'https://bank.example/reward-terms',
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

const rankedCardItems = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll('li.ranked-card'));

const fillAllocation = async () => {
  await userEvent.type(screen.getByLabelText(/Dining/i), '10000');
  await userEvent.type(screen.getByLabelText(/Travel/i), '5000');
  await userEvent.type(screen.getByLabelText(/Groceries/i), '8000');
  await userEvent.type(screen.getByLabelText(/Fuel/i), '4000');
  await userEvent.type(screen.getByLabelText(/Other/i), '3000');
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));
};

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
  // Fill all fields with 0 to bypass native HTML5 validation
  await userEvent.type(screen.getByLabelText(/Dining/i), '0');
  await userEvent.type(screen.getByLabelText(/Travel/i), '0');
  await userEvent.type(screen.getByLabelText(/Groceries/i), '0');
  await userEvent.type(screen.getByLabelText(/Fuel/i), '0');
  await userEvent.type(screen.getByLabelText(/Other/i), '0');
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
    { ...baseCard, id: 3, name: 'Card C', annualFee: 3000 },
    { ...baseCard, id: 4, name: 'Card D', annualFee: 2000 },
    { ...baseCard, id: 5, name: 'Card E', annualFee: 8000 },
    { ...baseCard, id: 6, name: 'Card F', annualFee: 9000 },
  ];
  getCardsSpy.mockResolvedValue(apiResponse(cards));
  const { container } = renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await fillAllocation();

  expect(
    await screen.findByText((content, element) => {
      return element.textContent && /Top \d+ cards?/i.test(element.textContent);
    })
  ).toBeInTheDocument();

  // Only the top 5 ranked cards are shown; the 6th (lowest net value) is excluded.
  expect(screen.getByText(/Card A/)).toBeInTheDocument();
  expect(screen.getByText(/Card C/)).toBeInTheDocument();
  expect(screen.queryByText(/Card F/)).not.toBeInTheDocument();
  expect(rankedCardItems(container)).toHaveLength(5);

  // Break-even monthly spend shown per card: fee / (12 × rate × point value).
  // Card A: 0.02 points/BDT × 1 BDT/point → 1000 / 0.24 ≈ BDT 4,167.
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

test('shows estimated points only (never an invented value) for cards without a stated point value', async () => {
  const pointsOnly: CreditCard = {
    ...baseCard,
    id: 2,
    name: 'Points Without Value',
    annualFee: 0,
    rewardPointValueBdt: null,
  };
  getCardsSpy.mockResolvedValue(apiResponse([baseCard, pointsOnly]));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await fillAllocation();

  // The valued card is ranked above; the points-only card is in its own group.
  expect(
    await screen.findByText((content, element) => {
      return element.textContent && /bank-stated BDT value/i.test(element.textContent);
    })
  ).toBeInTheDocument();
  expect(screen.getByText(/Points Without Value/)).toBeInTheDocument();

  // 30,000/BDT 50 × 1 pt × 12 = 7,200 points/year shown for both cards.
  expect(screen.getAllByText('7,200')).toHaveLength(2);
  expect(screen.getByText('Value not published by the bank')).toBeInTheDocument();

  // No break-even row is rendered for points-only cards.
  const pointsOnlyItem = screen.getByText(/Points Without Value/).closest('li') as HTMLElement;
  expect(pointsOnlyItem).not.toHaveTextContent('Break-even monthly spend');

  // The applied rule is summarized and the bank's verbatim text is in the details expander.
  expect(pointsOnlyItem).toHaveTextContent('All spending: 1 pt / BDT 50');
  const details = pointsOnlyItem.querySelector('details');
  expect(details).toHaveTextContent('Earn 1 point for every BDT 50 spent.');
  const sourceLinks = pointsOnlyItem.querySelectorAll(
    'a[href="https://bank.example/reward-terms"]'
  );
  expect(sourceLinks.length).toBeGreaterThan(0);
});

test('shows "fee unknown" instead of treating a missing annual fee as zero', async () => {
  const unknownFee: CreditCard = { ...baseCard, id: 2, name: 'Unknown Fee Card', annualFee: null };
  getCardsSpy.mockResolvedValue(apiResponse([unknownFee]));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  await fillAllocation();

  const item = (await screen.findByText(/Unknown Fee Card/)).closest('li') as HTMLElement;
  expect(item).toHaveTextContent('Fee unknown');
  // BDT value is still shown (bank-stated point value), but no net value.
  expect(item).toHaveTextContent('BDT 7,200');
});

test('caps cashback at the bank-stated monthly cap and skips the break-even', async () => {
  const cashbackCard: CreditCard = {
    ...baseCard,
    id: 2,
    name: 'Capped Cashback Card',
    annualFee: 500,
    rewardPointsPolicy: '',
    rewardEarnRules: [],
    rewardPointValueBdt: null,
    cashbackRules: [
      {
        category: 'dining',
        percent: 5,
        capText: 'up to BDT 300 monthly',
        text: '5% cashback up to BDT 300 monthly.',
      },
    ],
  };
  getCardsSpy.mockResolvedValue(apiResponse([cashbackCard]));
  renderPage();

  await screen.findByRole('button', { name: /Calculate best value cards/i });
  // Dining spend far above the cap: 50,000 × 5% = BDT 2,500/month → capped at 300.
  await userEvent.type(screen.getByLabelText(/Dining/i), '50000');
  await userEvent.click(screen.getByRole('button', { name: /Calculate best value cards/i }));
  await screen.findByText(/^Top 1 card(s)?:/i);

  const item = screen.getByText(/Capped Cashback Card/).closest('li') as HTMLElement;
  expect(item).toHaveTextContent('BDT 3,600'); // 300 × 12
  expect(item).toHaveTextContent('Dining: 5% cashback (up to BDT 300 monthly)');
  expect(item).toHaveTextContent('Not computable with current allocation');
  expect(item).toHaveTextContent('5% cashback up to BDT 300 monthly.');
});
