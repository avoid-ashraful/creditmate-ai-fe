import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { ToastProvider } from '../components/ui';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
import { LanguageProvider } from '../locales';
import {
  fetchLoanProducts,
  fetchRegulatoryCaps,
  LoanProductListItem,
  LoanScenarioResponse,
  runLoanScenario,
} from '../services/loans';

import LoansPage from './LoansPage';

jest.mock('../services/loans', () => {
  const actual = jest.requireActual('../services/loans');
  return {
    ...actual,
    fetchLoanProducts: jest.fn(),
    fetchRegulatoryCaps: jest.fn(),
    runLoanScenario: jest.fn(),
  };
});
jest.mock('../utils/seo');

const mockFetchProducts = fetchLoanProducts as jest.Mock;
const mockFetchCaps = fetchRegulatoryCaps as jest.Mock;
const mockRunScenario = runLoanScenario as jest.Mock;

const makeProduct = (partial: Partial<LoanProductListItem>): LoanProductListItem => ({
  id: 1,
  slug: 'test-personal-loan',
  name: 'Test Personal Loan',
  bank: 1,
  bankName: 'Test Bank',
  institutionName: '',
  lenderName: 'Test Bank',
  lenderType: 'bank',
  loanType: 'personal',
  segmentTags: ['salaried'],
  purposeTags: [],
  isIslamic: false,
  shariahMode: '',
  rateLabel: 'interest',
  rateMin: null,
  rateMax: null,
  rateType: 'floating',
  rateSource: 'none',
  spreadOverDepositRate: null,
  usesSimpleInterest: false,
  effectiveRate: {
    min: 9.72,
    max: 11.72,
    source: 'bb_chart',
    label: 'interest',
    category: 'consumer_credit',
  },
  amountMinBdt: 100000,
  amountMaxBdt: 4000000,
  tenureMinMonths: 12,
  tenureMaxMonths: 60,
  ltvPercent: null,
  processingFeePercent: 0.5,
  processingFeePercentMax: null,
  processingFeeCapBdt: 15000,
  minIncomeBySegment: {},
  incomeMetric: 'gross',
  sourceUrl: 'https://example.com/loan',
  verifiedAt: '2026-11-04T00:00:00Z',
  ...partial,
});

const scenario: LoanScenarioResponse = {
  loanType: 'personal',
  amount: 1000000,
  tenureMonths: 60,
  monthlyIncome: 80000,
  notes: ['Estimates from published criteria only.'],
  results: [
    {
      product: makeProduct({ id: 1, slug: 'fits-loan', name: 'Fits Loan' }),
      eligible: true,
      flags: [],
      warnings: [],
      band: { min: 9.72, max: 11.72, source: 'bb_chart', category: 'consumer_credit' },
      rateLabel: 'interest',
      usesSimpleInterest: false,
      processingFee: 5000,
      processingFeeInclVat: 5750,
      supervisionCharge: 1200,
      atMinRate: {
        rate: 9.72,
        emi: 21109.54,
        totalInterestOrProfit: 266572.12,
        totalCost: 1272322.12,
      },
      atMaxRate: {
        rate: 11.72,
        emi: 22103.21,
        totalInterestOrProfit: 326192.8,
        totalCost: 1331942.8,
      },
      note: null,
    },
    {
      product: makeProduct({
        id: 2,
        slug: 'too-small-loan',
        name: 'Too Small Loan',
        amountMaxBdt: 500000,
        segmentTags: ['professional_doctor'],
      }),
      eligible: false,
      flags: [
        {
          code: 'amount_above_max',
          message: "Amount Tk 1,000,000 exceeds this product's published maximum of Tk 500,000.",
        },
      ],
      warnings: [],
      band: { min: 13, max: 15, source: 'annexure_a', category: null },
      rateLabel: 'interest',
      usesSimpleInterest: false,
      processingFee: null,
      processingFeeInclVat: null,
      supervisionCharge: null,
      atMinRate: {
        rate: 13,
        emi: 22753.06,
        totalInterestOrProfit: 365183.6,
        totalCost: 1365183.6,
      },
      atMaxRate: {
        rate: 15,
        emi: 23789.93,
        totalInterestOrProfit: 427395.8,
        totalCost: 1427395.8,
      },
      note: null,
    },
  ],
};

const renderPage = () =>
  render(
    <LanguageProvider>
      <BrowserRouter>
        <ShortlistProvider>
          <ToastProvider>
            <LoansPage />
          </ToastProvider>
        </ShortlistProvider>
      </BrowserRouter>
    </LanguageProvider>
  );

// Cards render in backend order, so the nth "Details" disclosure belongs to
// the nth result card (Fits Loan first, Too Small Loan second in the fixture).
const expandCardDetails = async (index: number) => {
  const buttons = await screen.findAllByRole('button', { name: 'Details' });
  await userEvent.click(buttons[index]);
};

describe('LoansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    // URL state persists across tests in the shared jsdom history — reset it.
    window.history.pushState({}, '', '/loans');
    mockFetchProducts.mockResolvedValue([scenario.results[0].product, scenario.results[1].product]);
    mockFetchCaps.mockResolvedValue([]);
    mockRunScenario.mockResolvedValue(scenario);
  });

  it('renders the catalogue with chart-labelled bands', async () => {
    renderPage();
    expect(await screen.findByText('Fits Loan')).toBeInTheDocument();
    expect(screen.getAllByText(/Bangladesh Bank lending chart/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('9.72–11.72%').length).toBeGreaterThan(0);
  });

  it('auto-runs the scenario and shows both band-end EMI figures', async () => {
    renderPage();
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    // Hero EMI range and total-cost range, formatted by the shared Money
    // component (taka sign, lakh grouping, rounded taka).
    expect(await screen.findByText(/৳21,110/)).toBeInTheDocument();
    expect(screen.getByText(/৳22,103/)).toBeInTheDocument();
    expect(screen.getByText(/৳12,72,322/)).toBeInTheDocument();
    expect(screen.getByText(/৳13,31,943/)).toBeInTheDocument();
    // The ranking basis is labelled: total cost at the band's upper end.
    expect(screen.getByText(/Ranked by total cost at the highest rate/)).toBeInTheDocument();
  });

  it('keeps ineligible products visible, with the reason', async () => {
    renderPage();
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    await expandCardDetails(1);
    expect(
      await screen.findByText(
        /exceeds this product's published maximum of Tk 500,000/,
        {},
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
  });

  it('filters the catalogue by segment tag', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    await userEvent.click(screen.getByRole('button', { name: 'Doctors' }));
    expect(screen.queryByText('Fits Loan')).not.toBeInTheDocument();
    expect(screen.getByText('Too Small Loan')).toBeInTheDocument();
  });

  it('shows the supervision charge separately from the total cost', async () => {
    renderPage();
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    await expandCardDetails(0);
    expect(
      await screen.findByText(/Supervision charge:/, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.getByText(/৳1,200/)).toBeInTheDocument();
    expect(screen.getByText(/not included in total cost/)).toBeInTheDocument();
  });

  it('labels a chart fallback band with its chart category', async () => {
    renderPage();
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    await expandCardDetails(0);
    expect(
      (
        await screen.findAllByText(
          /announced consumer-credit band \(Bangladesh Bank chart\)/,
          {},
          { timeout: 3000 }
        )
      ).length
    ).toBeGreaterThan(0);
  });

  it('shows an alert when the scenario request fails', async () => {
    mockRunScenario.mockRejectedValue(new Error('network down'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not run this comparison/i);
    // The catalogue still renders (band heroes) alongside the error.
    expect(await screen.findByText('Fits Loan', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('never lets a fractional amount reach the scenario API', async () => {
    renderPage();
    await screen.findByText('Fits Loan', {}, { timeout: 3000 });
    const amountInput = screen.getByLabelText(/loan amount/i);
    // MoneyInput is digit-only by construction: the decimal point is stripped
    // as the user types, so the API only ever sees whole taka.
    fireEvent.change(amountInput, { target: { value: '1000000.5' } });
    await waitFor(() =>
      expect(mockRunScenario).toHaveBeenCalledWith(expect.objectContaining({ amount: 10000005 }))
    );
    expect(mockRunScenario.mock.calls.every(([arg]) => Number.isInteger(arg.amount))).toBe(true);
  });

  it('rejects a tenure above the backend cap client-side', async () => {
    renderPage();
    await screen.findByText('Fits Loan', {}, { timeout: 3000 });
    const tenureInput = screen.getByLabelText(/tenure/i);
    await userEvent.clear(tenureInput);
    await userEvent.type(tenureInput, '601');
    expect(
      await screen.findByText(/between 1 and 600/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(mockRunScenario.mock.calls.every(([arg]) => arg.tenureMonths !== 601)).toBe(true);
  });

  it('never lets a negative income reach the scenario API', async () => {
    renderPage();
    await screen.findByText('Fits Loan', {}, { timeout: 3000 });
    const incomeInput = screen.getByLabelText(/monthly income/i);
    // The digit-only MoneyInput strips the minus sign as the user types.
    fireEvent.change(incomeInput, { target: { value: '-5' } });
    await waitFor(() =>
      expect(mockRunScenario).toHaveBeenCalledWith(expect.objectContaining({ monthlyIncome: 5 }))
    );
    expect(
      mockRunScenario.mock.calls.every(
        ([arg]) => arg.monthlyIncome === undefined || arg.monthlyIncome >= 0
      )
    ).toBe(true);
  });

  it('has no axe violations with results rendered', async () => {
    const { container } = renderPage();
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    await screen.findByText('Fits Loan');
    await expectNoAxeViolations(container);
  });

  it('never uses banned approval language anywhere on the page', async () => {
    renderPage();
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    expect(await screen.findByText('Too Small Loan')).toBeInTheDocument();
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/pre-approved/i);
    expect(text).not.toMatch(/guaranteed/i);
  });
});
