import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { LanguageProvider } from '../locales';
import {
  DepositProduct,
  DepositScenarioResponse,
  getDepositProducts,
  runDepositScenario,
} from '../services/deposits';

import DepositsPage from './DepositsPage';

jest.mock('../services/deposits', () => {
  const actual = jest.requireActual('../services/deposits');
  return { ...actual, getDepositProducts: jest.fn(), runDepositScenario: jest.fn() };
});
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));

const mockList = getDepositProducts as jest.Mock;
const mockScenario = runDepositScenario as jest.Mock;

const makeProduct = (partial: Partial<DepositProduct>): DepositProduct => ({
  id: 1,
  bank: 1,
  bankName: 'Alpha Bank',
  institutionName: '',
  institutionDisplayName: 'Alpha Bank',
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
  rateEffectiveDate: '2026-10-01',
  verifiedAt: null,
  ...partial,
});

const scenarioRow = (
  product: DepositProduct,
  netMaturity: number,
  overrides: Record<string, number | boolean> = {}
) => ({
  product,
  rateMin: 9,
  rateMax: 9,
  isRange: false,
  rateIsDerived: false,
  grossMaturity: netMaturity + 4500,
  interestEarned: 45000,
  sourceTax: 4500,
  taxRatePercent: 10,
  netMaturity,
  netMaturityAtMaxRate: null,
  effectiveYieldPercent: 8.1,
  ...overrides,
});

const scenarioResponse: DepositScenarioResponse = {
  results: [
    scenarioRow(makeProduct({ id: 1, name: 'Alpha FDR', slug: 'alpha-fdr' }), 540500),
    scenarioRow(
      makeProduct({ id: 2, name: 'Beta FDR', slug: 'beta-fdr', bankName: 'Beta Bank' }),
      535062
    ),
  ],
  benchmarks: [
    scenarioRow(
      makeProduct({
        id: 9,
        name: '5-Year Bangladesh Sanchayapatra',
        slug: 'sanchayapatra',
        isBenchmark: true,
        bank: null,
        bankName: null,
        institutionDisplayName: 'National Savings Directorate (Sanchayapatra)',
      }),
      556192,
      { taxRatePercent: 5 }
    ),
  ],
  excludedWithoutRate: 3,
  notes: ['Ranked by net maturity value (after source tax), highest first.'],
};

const renderPage = () =>
  render(
    <LanguageProvider>
      <BrowserRouter>
        <DepositsPage />
      </BrowserRouter>
    </LanguageProvider>
  );

describe('DepositsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    mockScenario.mockResolvedValue(scenarioResponse);
  });

  it('renders the ranked results in backend order', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare deposits' }));

    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'fdr', amount: 500000, months: 12, hasTin: true })
    );

    const tables = screen.getAllByRole('table');
    const rows = within(tables[0]).getAllByRole('row');
    // Header + 2 result rows, in the backend's ranking order.
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('Alpha FDR');
    expect(rows[1]).toHaveTextContent('BDT 540,500.00');
    expect(rows[2]).toHaveTextContent('Beta FDR');
  });

  it('shows the Sanchayapatra benchmark separately from the bank ranking', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare deposits' }));

    expect(await screen.findByText('Government benchmark — Sanchayapatra')).toBeInTheDocument();
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    // The benchmark lives only in the second (benchmark) table, never in
    // the bank ranking table.
    expect(
      within(tables[0]).queryByText('5-Year Bangladesh Sanchayapatra')
    ).not.toBeInTheDocument();
    expect(within(tables[1]).getByText('5-Year Bangladesh Sanchayapatra')).toBeInTheDocument();
  });

  it('reports how many products had no covering rate', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Compare deposits' }));
    expect(await screen.findByText(/3 product\(s\) publish no rate/)).toBeInTheDocument();
  });

  it('switches to the DPS scenario', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Monthly savings (DPS)' }));
    await user.click(screen.getByRole('button', { name: 'Compare deposits' }));
    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'dps', monthlyInstalment: 5000, months: 12 })
    );
  });

  it('validates the amount before calling the API', async () => {
    const user = userEvent.setup();
    renderPage();
    const amountInput = screen.getByLabelText('Deposit amount (BDT)');
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    await user.click(screen.getByRole('button', { name: 'Compare deposits' }));
    expect(
      await screen.findByText('Enter a deposit amount greater than zero.')
    ).toBeInTheDocument();
    expect(mockScenario).not.toHaveBeenCalled();
  });
});
