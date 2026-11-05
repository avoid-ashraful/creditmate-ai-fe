import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { expectNoAxeViolations } from '../a11y/axe';
import { ToastProvider } from '../components/ui';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { renderWithAuth } from '../mocks/renderAuth';
import { advancedSearchService } from '../services/advancedSearch';
import { apiService, CreditCardApiResponse } from '../services/api';
import { getAccountProducts, runAccountScenario } from '../services/bankAccounts';
import { fetchAllBanks } from '../services/banks';
import { getDepositProducts, runDepositScenario } from '../services/deposits';
import { fetchLoanProducts, runLoanScenario } from '../services/loans';

import HomePage from './HomePage';

jest.mock('../services/api', () => {
  const actual = jest.requireActual('../services/api');
  actual.apiService.getCreditCards = jest.fn();
  return actual;
});
jest.mock('../services/advancedSearch', () => {
  const actual = jest.requireActual('../services/advancedSearch');
  actual.advancedSearchService.search = jest.fn();
  return actual;
});
jest.mock('../services/banks', () => {
  const actual = jest.requireActual('../services/banks');
  return { ...actual, fetchAllBanks: jest.fn() };
});
jest.mock('../services/deposits', () => {
  const actual = jest.requireActual('../services/deposits');
  return { ...actual, getDepositProducts: jest.fn(), runDepositScenario: jest.fn() };
});
jest.mock('../services/loans', () => {
  const actual = jest.requireActual('../services/loans');
  return { ...actual, fetchLoanProducts: jest.fn(), runLoanScenario: jest.fn() };
});
jest.mock('../services/bankAccounts', () => {
  const actual = jest.requireActual('../services/bankAccounts');
  return { ...actual, getAccountProducts: jest.fn(), runAccountScenario: jest.fn() };
});
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockGetCards = apiService.getCreditCards as jest.Mock;
const mockSearch = advancedSearchService.search as jest.Mock;
const mockBanks = fetchAllBanks as jest.Mock;
const mockDepositList = getDepositProducts as jest.Mock;
const mockDepositScenario = runDepositScenario as jest.Mock;
const mockLoanList = fetchLoanProducts as jest.Mock;
const mockLoanScenario = runLoanScenario as jest.Mock;
const mockAccountList = getAccountProducts as jest.Mock;
const mockAccountScenario = runAccountScenario as jest.Mock;

const rawCard: CreditCardApiResponse = {
  id: 42,
  bank_name: 'Example Bank',
  name: 'Example Card',
  annual_fee: '2000.00',
  interest_rate_apr: '25.00',
  lounge_access_international: '5 visits',
  lounge_access_domestic: 'Unlimited',
  has_lounge_access: true,
  has_annual_fee: true,
  is_active: true,
  creditmate_score: '7.5',
  verified_at: '2026-10-01T00:00:00Z',
};

const depositProduct = {
  id: 1,
  bank: { id: 1, name: 'Example Bank' },
  institutionName: '',
  institutionDisplayName: 'Example Bank',
  institutionType: 'conventional',
  kind: 'fdr',
  name: 'Alpha FDR',
  slug: 'alpha-fdr',
  rateType: 'interest',
  isIslamic: false,
  isBenchmark: false,
  isGeneric: true,
  segment: 'general',
  payoutStyle: 'at_maturity',
  compounding: 'annual',
  minAmount: null,
  maxAmount: null,
  minInstalment: null,
  maxInstalment: null,
  tenuresMonths: [],
  loanAgainstPercent: null,
  sourceUrl: '',
  sourceKind: 'bb_chart',
  rateEffectiveDate: '2026-10-05',
  verifiedAt: null,
};

const accountProduct = {
  id: 1,
  slug: 'alpha-savings',
  name: 'Alpha Savings',
  bank: { id: 1, name: 'Example Bank' },
  segment: 'general',
  variantOf: null,
  rateEffectiveDate: '2026-10-03',
  verifiedAt: null,
};

const renderHome = () =>
  renderWithAuth(
    <ShortlistProvider>
      <ToastProvider>
        <HomePage />
      </ToastProvider>
    </ShortlistProvider>,
    { route: '/' }
  );

describe('HomePage decision dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockBanks.mockResolvedValue([
      { id: 1, name: 'Example Bank' },
      { id: 2, name: 'Beta Bank' },
    ]);
    mockGetCards.mockImplementation(async (params: { page_size?: number }) =>
      params.page_size === 1
        ? { count: 105, next: null, previous: null, results: [] }
        : { count: 105, next: null, previous: null, results: [rawCard] }
    );
    mockSearch.mockResolvedValue({
      query: '',
      total: 1,
      page: 1,
      page_size: 1,
      results: [rawCard],
      facets: {},
      took: 1,
      source: 'database',
      sort_options: [],
      categories: [],
      normalized_query: {},
    });
    mockDepositList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [depositProduct],
    });
    mockDepositScenario.mockResolvedValue({
      results: [{ product: depositProduct, netMaturity: 554000 }],
      benchmarks: [],
      excludedWithoutRate: 0,
      notes: [],
    });
    mockLoanList.mockResolvedValue([{ id: 1 }]);
    mockLoanScenario.mockResolvedValue({
      loanType: 'personal',
      amount: 500000,
      tenureMonths: 60,
      monthlyIncome: null,
      notes: [],
      results: [
        {
          product: { id: 1, name: 'Loan' },
          atMaxRate: { rate: 13, emi: 11500, totalInterestOrProfit: 190000, totalCost: 690000 },
          atMinRate: { rate: 11, emi: 10900, totalInterestOrProfit: 154000, totalCost: 654000 },
        },
      ],
    });
    mockAccountList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [accountProduct],
    });
    mockAccountScenario.mockResolvedValue({
      averageBalance: 50000,
      accountType: 'savings',
      count: 1,
      excludedWithoutRate: 0,
      results: [{ product: accountProduct, netAnnualValue: 1250 }],
      segmentExcluded: [],
      unrankedWithoutFees: [],
      notes: [],
    });
  });

  it('leads with the promise and live coverage provenance, not a catalogue', async () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: /where do you stand/i })
    ).toBeInTheDocument();
    // 105 cards + 1 deposit + 1 loan + 1 account = 108 products, 2 banks.
    expect(await screen.findByText('2 banks · 108 products compared')).toBeInTheDocument();
  });

  it('never prints a coverage count it failed to load', async () => {
    mockBanks.mockRejectedValue(new Error('down'));
    renderHome();
    // Headlines still arrive (fault isolation), but the coverage line — which
    // would have to claim a bank count — stays hidden.
    expect(await screen.findByText(/Highest CreditMate Score/)).toBeInTheDocument();
    expect(screen.queryByText(/products compared/)).not.toBeInTheDocument();
  });

  it('computes the four mode headlines from the scenario engines', async () => {
    renderHome();
    expect(
      await screen.findByText('Highest CreditMate Score: 7.5 — Example Card')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Best net return on ৳5,00,000 for 12 months: ৳5,54,000\.00 \(Alpha FDR\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Best net value at a ৳50,000 balance: ৳1,250\.00 a year \(Alpha Savings\)/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cheapest personal loan at ৳5,00,000: EMI ৳11,500 \/ month/)
    ).toBeInTheDocument();
  });

  it('saves the profile numbers on this device and confirms with a toast', async () => {
    const user = userEvent.setup();
    renderHome();
    const balance = await screen.findByLabelText(/typical account balance/i);
    await user.clear(balance);
    await user.type(balance, '75000');
    await user.click(screen.getByRole('button', { name: 'Save as my defaults' }));
    expect(await screen.findByText('Your defaults are saved on this device.')).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem('creditmate.profile.v1') ?? '{}');
    expect(stored.balance).toBe(75000);
  });

  it('shows the most recently verified products under What changed, newest first', async () => {
    renderHome();
    const deposit = await screen.findByRole('link', { name: /Alpha FDR/ });
    const account = screen.getByRole('link', { name: /Alpha Savings/ });
    const card = screen.getByRole('link', { name: /Example Card/ });
    expect(
      deposit.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(account.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('previews the on-device shortlist', async () => {
    window.localStorage.setItem(
      'creditmate.shortlist.v1',
      JSON.stringify([
        {
          vertical: 'cards',
          key: '42',
          name: 'Example Card',
          bankName: 'Example Bank',
          detailHref: '/cards/example',
          cardId: 42,
        },
      ])
    );
    renderHome();
    expect(await screen.findByText('Your shortlist & saved')).toBeInTheDocument();
    // The preview links the saved item as "name · bank".
    expect(
      await screen.findByRole('link', { name: /Example Card · Example Bank/ })
    ).toBeInTheDocument();
  });

  it('has no axe violations on the dashboard', async () => {
    const { container } = renderHome();
    await screen.findByText('2 banks · 108 products compared');
    await expectNoAxeViolations(container);
  });

  it('links the trust strip to the methodology', async () => {
    renderHome();
    expect(screen.getByText('How CreditMate stays honest')).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: /methodology/i });
    expect(links.some(link => link.getAttribute('href') === '/methodology')).toBe(true);
  });
});
