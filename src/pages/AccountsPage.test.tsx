import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { ToastProvider } from '../components/ui';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
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
        <ShortlistProvider>
          <ToastProvider>
            <AccountsPage />
          </ToastProvider>
        </ShortlistProvider>
      </BrowserRouter>
    </LanguageProvider>
  );

// Cards render in backend order, so the nth "Details" disclosure belongs to
// the nth result card.
const expandCardDetails = async (index: number) => {
  const buttons = await screen.findAllByRole('button', { name: 'Details' });
  await userEvent.click(buttons[index]);
};

const linkSequence = (names: string[]) =>
  screen
    .getAllByRole('link')
    .map(link => link.textContent)
    .filter(text => (text ? names.includes(text) : false));

describe('AccountsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    // URL state persists across tests in the shared jsdom history — reset it.
    window.history.pushState({}, '', '/accounts');
    mockList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    mockScenario.mockResolvedValue(scenarioResponse);
  });

  it('renders the ranked breakdown in backend order with visible arithmetic', async () => {
    renderPage();

    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(
      expect.objectContaining({ averageBalance: 50000, accountType: 'savings' })
    );

    await screen.findByRole('link', { name: 'Fee Heavy Savings' });
    // Backend ranking order is preserved in the DOM (never re-sorted).
    expect(linkSequence(['Fee Free Savings', 'Fee Heavy Savings'])).toEqual([
      'Fee Free Savings',
      'Fee Heavy Savings',
    ]);
    // Layer-1 arithmetic for the fee-heavy card: 400 maintenance, 200 net hero.
    expect(screen.getAllByText('৳400.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('৳200.00').length).toBeGreaterThan(0);
    // Layer-2 fee split (card 600 + SMS 300 + maintenance 400 = 1,300 fees).
    await expandCardDetails(1);
    expect(screen.getByText('৳600.00')).toBeInTheDocument();
    expect(screen.getByText('৳300.00')).toBeInTheDocument();
  });

  it('keeps salary accounts out of the ranking, in their own section', async () => {
    renderPage();

    expect(await screen.findByText('Salary & employer-agreement accounts')).toBeInTheDocument();
    // DOM sequence proves the grouping: ranked first, then the salary group,
    // then the unranked group.
    expect(
      linkSequence([
        'Fee Free Savings',
        'Fee Heavy Savings',
        'Payroll Savings',
        'Mystery Bank Savings',
      ])
    ).toEqual(['Fee Free Savings', 'Fee Heavy Savings', 'Payroll Savings', 'Mystery Bank Savings']);
  });

  it('shows unpublished fees as "Not published", never as zero', async () => {
    renderPage();

    expect(await screen.findByText('Interest known, fees not published')).toBeInTheDocument();
    await screen.findByRole('link', { name: 'Mystery Bank Savings' });
    expect(screen.getAllByText('Not published').length).toBeGreaterThan(0);
    expect(screen.getByText(/Partial fees/)).toBeInTheDocument();
  });

  it('reports how many accounts had no covering rate', async () => {
    renderPage();
    expect(await screen.findByText(/21 account\(s\) publish no rate/)).toBeInTheDocument();
  });

  it('switches to current accounts and sends the account type', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Current' }));
    await waitFor(() =>
      expect(mockScenario).toHaveBeenCalledWith(expect.objectContaining({ accountType: 'current' }))
    );
  });

  it('uses a balance preset', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: '৳1,00,000' }));
    await waitFor(() =>
      expect(mockScenario).toHaveBeenCalledWith(expect.objectContaining({ averageBalance: 100000 }))
    );
  });

  it('explains when interest is blocked by the published minimum balance', async () => {
    mockScenario.mockResolvedValue({
      ...scenarioResponse,
      results: [
        makeRow(
          makeProduct({
            id: 5,
            name: 'Threshold Savings',
            slug: 'threshold',
            minBalanceToEarn: 100000,
          }),
          { interestEarned: 0, interestBlockedByMinBalance: true }
        ),
      ],
      segmentExcluded: [],
      unrankedWithoutFees: [],
    });
    renderPage();

    await screen.findByRole('link', { name: 'Threshold Savings' });
    expect(screen.getByText('৳0.00')).toBeInTheDocument();
    await expandCardDetails(0);
    expect(
      screen.getByText(/No interest or profit below the published minimum balance of ৳1,00,000/)
    ).toBeInTheDocument();
  });

  it('renders the per-product basis note supplied by the API', async () => {
    mockScenario.mockResolvedValue({
      ...scenarioResponse,
      results: [
        makeRow(makeProduct({ id: 6, name: 'Lowest Balance Savings', slug: 'lowest' }), {
          interestBasis: 'lowest_monthly_balance',
          basisNote: 'Estimate assumes your balance never dips below this average in any month.',
        }),
      ],
      segmentExcluded: [],
      unrankedWithoutFees: [],
    });
    renderPage();

    await screen.findByRole('link', { name: 'Lowest Balance Savings' });
    await expandCardDetails(0);
    expect(
      screen.getByText('Estimate assumes your balance never dips below this average in any month.')
    ).toBeInTheDocument();
  });

  it('shows the at-max interest and net figures for range-rate rows', async () => {
    mockScenario.mockResolvedValue({
      ...scenarioResponse,
      results: [
        makeRow(makeProduct({ id: 7, name: 'Range Savings', slug: 'range' }), {
          rate: 2.5,
          rateMax: 3.85,
          isRange: true,
          interestEarned: 1250,
          interestEarnedAtMaxRate: 1925,
          netAnnualValue: -50,
          netAnnualValueAtMaxRate: 625,
        }),
      ],
      segmentExcluded: [],
      unrankedWithoutFees: [],
    });
    renderPage();

    await screen.findByRole('link', { name: 'Range Savings' });
    await expandCardDetails(0);
    expect(screen.getByText(/At 3\.85%: ৳1,925\.00/)).toBeInTheDocument();
    expect(screen.getByText(/At 3\.85%: ৳625\.00/)).toBeInTheDocument();
  });

  it('labels scenario rows that are variants of another product', async () => {
    mockScenario.mockResolvedValue({
      ...scenarioResponse,
      results: [
        makeRow(
          makeProduct({
            id: 8,
            name: 'Alo Savings',
            slug: 'alo',
            variantOf: { slug: 'base-savings', name: 'Base Savings' },
          })
        ),
      ],
      segmentExcluded: [],
      unrankedWithoutFees: [],
    });
    renderPage();

    await screen.findByRole('link', { name: 'Alo Savings' });
    await expandCardDetails(0);
    expect(screen.getByText('Variant of Base Savings')).toBeInTheDocument();
  });

  it('shows a scenario-specific error when the comparison fails', async () => {
    mockScenario.mockRejectedValue(new Error('boom'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to run the comparison. Please check your balance and try again.'
    );
    expect(
      screen.queryByText('Failed to load accounts. Please try again later.')
    ).not.toBeInTheDocument();
  });

  it('rounds the balance to 2 decimal places before posting', async () => {
    // The balance can arrive with paisa precision via the shareable URL.
    window.history.pushState({}, '', '/accounts?balance=50000.567');
    renderPage();
    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(
      expect.objectContaining({ averageBalance: 50000.57 })
    );
  });

  it('has no axe violations with results rendered', async () => {
    const { container } = renderPage();
    await screen.findByRole('link', { name: 'Fee Heavy Savings' });
    await expectNoAxeViolations(container);
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
