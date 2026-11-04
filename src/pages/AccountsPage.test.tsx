import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { LanguageProvider } from '../locales';
import { ACCOUNTS_COPY } from '../locales/accounts';
import {
  AccountProduct,
  AccountScenarioResponse,
  AccountScenarioResult,
  getAccountProducts,
  runAccountScenario,
} from '../services/bankAccounts';

import AccountsPage from './AccountsPage';

jest.mock('../services/bankAccounts', () => {
  const actual = jest.requireActual('../services/bankAccounts');
  return { ...actual, getAccountProducts: jest.fn(), runAccountScenario: jest.fn() };
});
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockList = getAccountProducts as jest.Mock;
const mockScenario = runAccountScenario as jest.Mock;

const makeProduct = (partial: Partial<AccountProduct>): AccountProduct => ({
  id: 1,
  slug: 'alpha-savings',
  name: 'Alpha Savings',
  accountType: 'savings',
  bank: { id: 1, name: 'Alpha Bank' },
  variantOf: null,
  variantsCount: 0,
  segment: 'general',
  isIslamic: false,
  contractType: 'interest',
  rateType: 'interest',
  rateSlabs: [{ balanceMin: 0, balanceMax: null, rate: 3, rateMax: null, isRange: false }],
  interestBasis: 'unknown',
  interestPayoutFrequency: 'unknown',
  minBalanceToEarn: null,
  maintenanceFeeSlabs: [{ balanceMin: 0, balanceMax: null, fee: 200 }],
  debitCardFeeAnnual: 600,
  debitCardWaiverText: '',
  debitCardWaiverMinBalance: null,
  smsFeeAnnual: 300,
  onlineBankingFeeAnnual: 0,
  chequePerLeaf: 20,
  chequeFirstBookFree: false,
  closureFee: 200,
  feeDataComplete: true,
  feesIncludeVat: false,
  sourceSocUrl: '',
  sourceRateUrl: '',
  socEffectiveDate: null,
  rateEffectiveDate: null,
  verifiedAt: null,
  ...partial,
});

const makeRow = (
  product: AccountProduct,
  overrides: Partial<AccountScenarioResult> = {}
): AccountScenarioResult => ({
  product,
  balance: 50000,
  rate: 3,
  rateMax: null,
  isRange: false,
  interestBasis: 'unknown',
  basisNote: '',
  interestBlockedByMinBalance: false,
  interestEarned: 1500,
  interestEarnedAtMaxRate: null,
  maintenanceFeeAnnual: 400,
  debitCardFeeAnnual: 600,
  smsFeeAnnual: 300,
  onlineBankingFeeAnnual: 0,
  totalFees: 1300,
  feesComplete: true,
  waiversApplied: [],
  netAnnualValue: 200,
  netAnnualValueAtMaxRate: null,
  ...overrides,
});

const scenarioResponse: AccountScenarioResponse = {
  averageBalance: 50000,
  accountType: 'savings',
  count: 2,
  excludedWithoutRate: 21,
  results: [
    makeRow(makeProduct({ id: 1, name: 'Fee Free Savings', slug: 'fee-free' }), {
      maintenanceFeeAnnual: 0,
      debitCardFeeAnnual: 0,
      smsFeeAnnual: 0,
      totalFees: 0,
      netAnnualValue: 1500,
    }),
    makeRow(makeProduct({ id: 2, name: 'Fee Heavy Savings', slug: 'fee-heavy' })),
  ],
  segmentExcluded: [
    makeRow(makeProduct({ id: 3, name: 'Payroll Savings', slug: 'payroll', segment: 'salary' }), {
      netAnnualValue: 900,
    }),
  ],
  unrankedWithoutFees: [
    makeRow(
      makeProduct({
        id: 4,
        name: 'Mystery Bank Savings',
        slug: 'mystery',
        bank: { id: 4, name: 'Mystery Bank' },
        feeDataComplete: false,
      }),
      {
        maintenanceFeeAnnual: null,
        debitCardFeeAnnual: null,
        smsFeeAnnual: null,
        onlineBankingFeeAnnual: null,
        totalFees: null,
        feesComplete: false,
        netAnnualValue: null,
      }
    ),
  ],
  notes: [
    'Ranked by net annual value at your average balance.',
    'Savings account maintenance fees are fixed by Bangladesh Bank on one slab for every bank.',
  ],
};

const renderPage = () =>
  render(
    <LanguageProvider>
      <BrowserRouter>
        <AccountsPage />
      </BrowserRouter>
    </LanguageProvider>
  );

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    mockScenario.mockResolvedValue(scenarioResponse);
  });

  it('renders the ranked breakdown in backend order with visible arithmetic', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare accounts' }));

    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(
      expect.objectContaining({ averageBalance: 50000, accountType: 'savings' })
    );

    const tables = screen.getAllByRole('table');
    const rows = within(tables[0]).getAllByRole('row');
    // Header + 2 ranked rows, in the backend's order (never re-sorted).
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('Fee Free Savings');
    expect(rows[2]).toHaveTextContent('Fee Heavy Savings');
    // Breakdown arithmetic is visible: 1,500 interest − 1,300 fees = 200 net.
    expect(rows[2]).toHaveTextContent('BDT 1,500.00');
    expect(rows[2]).toHaveTextContent('BDT 400.00');
    expect(rows[2]).toHaveTextContent('BDT 600.00');
    expect(rows[2]).toHaveTextContent('BDT 300.00');
    expect(rows[2]).toHaveTextContent('BDT 200.00');
  });

  it('keeps salary accounts out of the ranking table, in their own section', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare accounts' }));

    expect(await screen.findByText('Salary & employer-agreement accounts')).toBeInTheDocument();
    const tables = screen.getAllByRole('table');
    expect(within(tables[0]).queryByText('Payroll Savings')).not.toBeInTheDocument();
    expect(within(tables[1]).getByText('Payroll Savings')).toBeInTheDocument();
  });

  it('shows unpublished fees as "Not published", never as zero', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare accounts' }));

    expect(await screen.findByText('Interest known, fees not published')).toBeInTheDocument();
    const tables = screen.getAllByRole('table');
    const unrankedRow = within(tables[2]).getAllByRole('row')[1];
    expect(unrankedRow).toHaveTextContent('Mystery Bank Savings');
    expect(unrankedRow).toHaveTextContent('Not published');
    expect(unrankedRow).toHaveTextContent('Partial fees');
  });

  it('reports how many accounts had no covering rate', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare accounts' }));
    expect(await screen.findByText(/21 account\(s\) publish no rate/)).toBeInTheDocument();
  });

  it('switches to current accounts and sends the account type', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Current' }));
    await user.click(screen.getByRole('button', { name: 'Compare accounts' }));
    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(expect.objectContaining({ accountType: 'current' }));
  });

  it('uses a balance preset', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'BDT 100,000.00' }));
    await user.click(screen.getByRole('button', { name: 'Compare accounts' }));
    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(expect.objectContaining({ averageBalance: 100000 }));
  });

  it('explains that the maintenance fee is BB-fixed and identical at every bank', async () => {
    renderPage();
    expect(
      await screen.findByText('One honest note about the maintenance fee')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/fixed by Bangladesh Bank on a single slab for every bank/)
    ).toBeInTheDocument();
    expect(screen.getByText(/It is identical everywhere/)).toBeInTheDocument();
  });
});

describe('accounts copy discipline', () => {
  // The maintenance fee must never be presented as differing by bank:
  // scan both locales for phrasings that would imply it does.
  const banned = [
    /maintenance fee (varies|differs|is lower|is higher|cheaper)/i,
    /lowest maintenance fee/i,
    /maintenance fees? (from|starting at) BDT/i,
    /save on maintenance/i,
  ];

  it.each(['en', 'bn'] as const)('locale %s never implies maintenance differs by bank', locale => {
    const strings = Object.values(ACCOUNTS_COPY[locale]).join('\n');
    banned.forEach(pattern => expect(strings).not.toMatch(pattern));
  });

  it('the English explainer states the fee is fixed and identical', () => {
    const body = ACCOUNTS_COPY.en.explainerBody;
    expect(body).toMatch(/fixed by Bangladesh Bank/);
    expect(body).toMatch(/identical everywhere/);
  });
});
