import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

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
    <BrowserRouter>
      <LoansPage />
    </BrowserRouter>
  );

describe('LoansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProducts.mockResolvedValue([scenario.results[0].product, scenario.results[1].product]);
    mockFetchCaps.mockResolvedValue([]);
    mockRunScenario.mockResolvedValue(scenario);
  });

  it('renders the catalogue with chart-labelled bands', async () => {
    renderPage();
    expect(await screen.findByText('Fits Loan')).toBeInTheDocument();
    expect(screen.getAllByText(/Bangladesh Bank lending chart/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('9.72% – 11.72%').length).toBeGreaterThan(0);
  });

  it('runs the scenario and shows both band-end EMI figures', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    await waitFor(() => expect(mockRunScenario).toHaveBeenCalled());
    expect(await screen.findByText(/21,110 – BDT 22,103/)).toBeInTheDocument();
    expect(screen.getByText(/1,272,322 – BDT 1,331,943/)).toBeInTheDocument();
  });

  it('keeps ineligible products visible, greyed, with the reason', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    const row = await screen.findByTestId('scenario-row-too-small-loan');
    expect(row).toHaveClass('loans-row-ineligible');
    expect(
      screen.getByText(/exceeds this product's published maximum of Tk 500,000/)
    ).toBeInTheDocument();
    expect(screen.getByText('Too Small Loan')).toBeInTheDocument();
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
    await screen.findByText('Fits Loan');
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    expect(await screen.findByText(/Supervision charge: BDT 1,200/)).toBeInTheDocument();
    expect(screen.getByText(/not included in total cost/)).toBeInTheDocument();
  });

  it('labels a chart fallback band with its chart category', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    expect(
      screen.getAllByText(/announced consumer-credit band \(Bangladesh Bank chart\)/).length
    ).toBeGreaterThan(0);
  });

  it('shows an alert when the scenario request fails', async () => {
    mockRunScenario.mockRejectedValue(new Error('network down'));
    renderPage();
    await screen.findByText('Fits Loan');
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not run this comparison/i);
  });

  it('rejects a fractional amount client-side without calling the scenario API', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    const amountInput = screen.getByLabelText(/loan amount/i);
    fireEvent.change(amountInput, { target: { value: '1000000.5' } });
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/whole number of taka/i);
    expect(mockRunScenario).not.toHaveBeenCalled();
  });

  it('rejects a tenure above the backend cap client-side', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    const tenureInput = screen.getByLabelText(/tenure/i);
    await userEvent.clear(tenureInput);
    await userEvent.type(tenureInput, '601');
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/between 1 and 600/i);
    expect(mockRunScenario).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric income instead of silently dropping it', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    const incomeInput = screen.getByLabelText(/monthly income/i);
    fireEvent.change(incomeInput, { target: { value: '-5' } });
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/monthly income/i);
    expect(mockRunScenario).not.toHaveBeenCalled();
  });

  it('never uses banned approval language anywhere on the page', async () => {
    renderPage();
    await screen.findByText('Fits Loan');
    await userEvent.click(screen.getByRole('button', { name: /compare this scenario/i }));
    await screen.findByTestId('scenario-row-too-small-loan');
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/pre-approved/i);
    expect(text).not.toMatch(/guaranteed/i);
  });
});
