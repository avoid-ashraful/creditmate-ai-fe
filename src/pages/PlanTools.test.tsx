import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { ToastProvider } from '../components/ui';
import { AuthProvider } from '../hooks/AuthProvider';
import { LanguageProvider } from '../locales';
import { apiService } from '../services/api';
import { runAccountScenario } from '../services/bankAccounts';
import { runLoanScenario } from '../services/loans';
import { CreditCard } from '../types';

import CalculatorsPage from './CalculatorsPage';
import PlanAccountPage from './PlanAccountPage';
import PlanLoanPage from './PlanLoanPage';

jest.mock('../services/loans', () => ({
  runLoanScenario: jest.fn(),
}));
jest.mock('../services/bankAccounts', () => ({
  runAccountScenario: jest.fn(),
}));
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockLoan = runLoanScenario as jest.Mock;
const mockAccount = runAccountScenario as jest.Mock;

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

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  jest.spyOn(apiService, 'getCreditCards').mockResolvedValue({
    count: 1,
    next: null,
    previous: null,
    results: [baseCard],
  } as never);
  jest
    .spyOn(apiService, 'transformCreditCard')
    .mockImplementation(card => card as unknown as CreditCard);
});

const wrap = (ui: React.ReactNode) => (
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
);

describe('Plan EMI tool (CalculatorsPage in Plan mode)', () => {
  it('initialises its inputs from the URL and hides the legacy tab bar', async () => {
    window.history.replaceState(null, '', '/plan/emi?amount=200000&months=24&rate=20');
    render(wrap(<CalculatorsPage planTool="emi" />));
    expect(await screen.findByLabelText(/Purchase amount/)).toHaveValue(200000);
    expect(screen.getByLabelText(/Tenure \(months\)/, { selector: 'input' })).toHaveValue(24);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('writes edits back into the URL so the scenario is shareable', async () => {
    window.history.replaceState(null, '', '/plan/emi');
    render(wrap(<CalculatorsPage planTool="emi" />));
    const amount = await screen.findByLabelText(/Purchase amount/);
    await userEvent.type(amount, '75000');
    expect(window.location.search).toContain('amount=75000');
  });
});

describe('Plan loan tool', () => {
  it('prices a loan at both ends of the band from the scenario endpoint', async () => {
    window.history.replaceState(null, '', '/plan/loan');
    mockLoan.mockResolvedValue({
      loanType: 'personal',
      amount: 500000,
      tenureMonths: 36,
      monthlyIncome: null,
      notes: [],
      results: [
        {
          product: {
            id: 9,
            slug: 'example-personal-loan',
            name: 'Example Personal Loan',
            lenderName: 'Example Bank',
            isIslamic: false,
          },
          eligible: true,
          flags: [],
          warnings: [],
          band: { min: 12, max: 15, source: 'bank_page', category: null },
          rateLabel: 'interest',
          usesSimpleInterest: false,
          processingFee: null,
          processingFeeInclVat: null,
          supervisionCharge: null,
          atMinRate: { rate: 12, emi: 16607, totalInterestOrProfit: 97852, totalCost: 597852 },
          atMaxRate: { rate: 15, emi: 17333, totalInterestOrProfit: 123988, totalCost: 623988 },
          note: null,
        },
      ],
    });
    render(wrap(<PlanLoanPage />));
    await userEvent.click(screen.getByRole('button', { name: 'Compare loans' }));
    expect(await screen.findByText('Example Personal Loan')).toBeInTheDocument();
    expect(mockLoan).toHaveBeenCalledWith(
      expect.objectContaining({ loanType: 'personal', tenureMonths: 36 })
    );
    // The amount opened preset with the profile's planned loan amount.
    expect(mockLoan.mock.calls[0][0].amount).toBe(500000);
  });
});

describe('Plan account tool', () => {
  it('ranks accounts by net annual value at the profile balance', async () => {
    window.history.replaceState(null, '', '/plan/account');
    mockAccount.mockResolvedValue({
      averageBalance: 50000,
      accountType: 'savings',
      count: 1,
      excludedWithoutRate: 0,
      segmentExcluded: [],
      unrankedWithoutFees: [],
      notes: [],
      results: [
        {
          product: {
            id: 3,
            slug: 'example-savings',
            name: 'Example Savings',
            bank: { id: 1, name: 'Example Bank', slug: 'example-bank' },
            isIslamic: false,
          },
          balance: 50000,
          rate: 4,
          rateMax: null,
          isRange: false,
          interestBasis: 'daily',
          basisNote: '',
          interestBlockedByMinBalance: false,
          interestEarned: 2000,
          interestEarnedAtMaxRate: null,
          maintenanceFeeAnnual: 300,
          debitCardFeeAnnual: null,
          smsFeeAnnual: null,
          onlineBankingFeeAnnual: null,
          totalFees: 300,
          feesComplete: true,
          waiversApplied: [],
          netAnnualValue: 1700,
        },
      ],
    });
    render(wrap(<PlanAccountPage />));
    await userEvent.click(screen.getByRole('button', { name: 'Compare accounts' }));
    expect(await screen.findByText('Example Savings')).toBeInTheDocument();
    expect(mockAccount).toHaveBeenCalledWith({ averageBalance: 50000 });
  });
});
