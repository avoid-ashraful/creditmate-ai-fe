import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { apiService } from '../services/api';
import { CreditCard } from '../types';

import CalculatorsPage from './CalculatorsPage';

const baseCard: CreditCard = {
  id: 1,
  bankId: 1,
  bankName: 'Dutch-Bangla Bank PLC',
  name: 'MasterCard Titanium Credit Card',
  annualFee: 1500,
  interestRateApr: 18,
  loungeAccessInternational: null,
  loungeAccessDomestic: null,
  cashAdvanceFee: '',
  latePaymentFee: '',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: '',
  additionalFeatures: [],
  sourceUrl: '',
  isActive: true,
  lastUpdated: null,
  images: [],
};

const islamicCard: CreditCard = {
  ...baseCard,
  id: 2,
  bankId: 2,
  bankName: 'City Bank PLC',
  name: 'City Islamic Gold American Express Card',
  interestRateApr: null,
  isIslamic: true,
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
      <CalculatorsPage />
    </BrowserRouter>
  );

let getCardsSpy: jest.SpyInstance;
let transformSpy: jest.SpyInstance;
let consoleError: jest.SpyInstance;

beforeEach(() => {
  getCardsSpy = jest.spyOn(apiService, 'getCreditCards');
  getCardsSpy.mockResolvedValue(apiResponse([baseCard, islamicCard]));
  transformSpy = jest
    .spyOn(apiService, 'transformCreditCard')
    .mockImplementation(card => card as unknown as CreditCard);
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  getCardsSpy.mockRestore();
  transformSpy.mockRestore();
  consoleError.mockRestore();
});

describe('CalculatorsPage — EMI tool', () => {
  it('calculates EMI from a real card’s published APR and names the source', async () => {
    renderPage();
    await screen.findByLabelText(/Card \(uses its published APR\)/);

    await userEvent.selectOptions(screen.getByLabelText(/Card \(uses its published APR\)/), '1');
    await userEvent.type(screen.getByLabelText(/Purchase amount/), '120000');
    // Tenure defaults to 12 months. Reference: 120,000 at 18% over 12 = EMI 11,001.60.
    await userEvent.click(screen.getByRole('button', { name: /Calculate EMI/i }));

    expect(await screen.findByText('BDT 11,001.60')).toBeInTheDocument();
    expect(screen.getByText('BDT 12,019.19')).toBeInTheDocument();
    expect(screen.getByText('BDT 132,019.19')).toBeInTheDocument();
    expect(screen.getByText(/APR 18% — MasterCard Titanium Credit Card/)).toBeInTheDocument();
  });

  it('calculates EMI from a custom APR', async () => {
    renderPage();
    await screen.findByLabelText(/APR \(%\)/);

    await userEvent.type(screen.getByLabelText(/APR \(%\)/), '25');
    await userEvent.type(screen.getByLabelText(/Purchase amount/), '120000');
    await userEvent.click(screen.getByRole('button', { name: /Calculate EMI/i }));

    // Reference: 120,000 at 25% over 12 months = EMI 11,405.30.
    expect(await screen.findByText('BDT 11,405.30')).toBeInTheDocument();
    expect(screen.getByText(/Custom APR 25%/)).toBeInTheDocument();
  });

  it('explains a card with no published APR and uses the user’s own rate instead', async () => {
    renderPage();
    await screen.findByLabelText(/Card \(uses its published APR\)/);

    await userEvent.selectOptions(screen.getByLabelText(/Card \(uses its published APR\)/), '2');
    expect(await screen.findByText(/publishes no APR/)).toBeInTheDocument();
    expect(screen.getByText(/never treat a missing APR as 0%/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/APR \(%\)/), '20');
    await userEvent.type(screen.getByLabelText(/Purchase amount/), '60000');
    await userEvent.click(screen.getByRole('button', { name: /Calculate EMI/i }));

    expect(await screen.findByText(/Custom APR 20%/)).toBeInTheDocument();
  });

  it('validates empty inputs instead of calculating', async () => {
    renderPage();
    await screen.findByRole('button', { name: /Calculate EMI/i });

    await userEvent.click(screen.getByRole('button', { name: /Calculate EMI/i }));
    expect(
      await screen.findByText(/Enter a purchase amount greater than zero/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Enter an APR of 0% or more/)).toBeInTheDocument();
  });
});

describe('CalculatorsPage — payoff tool', () => {
  const goToPayoff = async () => {
    renderPage();
    await screen.findByRole('tab', { name: /Payoff calculator/i });
    await userEvent.click(screen.getByRole('tab', { name: /Payoff calculator/i }));
  };

  it('shows months, total interest and total paid for a clearing balance', async () => {
    await goToPayoff();
    await userEvent.type(screen.getByLabelText(/APR \(%\)/), '24');
    await userEvent.type(screen.getByLabelText(/Current balance/), '50000');
    await userEvent.type(screen.getByLabelText(/Monthly payment/), '5000');
    await userEvent.click(screen.getByRole('button', { name: /Calculate payoff time/i }));

    // Reference simulation: 50,000 at 24% paying 5,000/month clears in 12 months.
    expect(await screen.findByText('12 months')).toBeInTheDocument();
    expect(screen.getByText('BDT 6,351.64')).toBeInTheDocument();
    expect(screen.getByText('BDT 56,351.64')).toBeInTheDocument();
  });

  it('warns clearly when the payment never clears the balance', async () => {
    await goToPayoff();
    await userEvent.type(screen.getByLabelText(/APR \(%\)/), '25');
    await userEvent.type(screen.getByLabelText(/Current balance/), '100000');
    await userEvent.type(screen.getByLabelText(/Monthly payment/), '2000');
    await userEvent.click(screen.getByRole('button', { name: /Calculate payoff time/i }));

    expect(await screen.findByText(/never clears the balance/i)).toBeInTheDocument();
    // First month's interest on 100,000 at 25% APR is 2,083.33 — above the 2,000 payment.
    expect(screen.getByText(/BDT 2,083\.33/)).toBeInTheDocument();
  });
});
