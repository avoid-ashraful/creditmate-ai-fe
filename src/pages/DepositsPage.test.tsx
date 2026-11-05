import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import { ToastProvider } from '../components/ui';
import { ShortlistProvider } from '../hooks/ShortlistProvider';
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
  bank: { id: 1, name: 'Alpha Bank' },
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
  rateRange: null,
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
      makeProduct({
        id: 2,
        name: 'Beta FDR',
        slug: 'beta-fdr',
        bank: { id: 2, name: 'Beta Bank' },
      }),
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
        <ShortlistProvider>
          <ToastProvider>
            <DepositsPage />
          </ToastProvider>
        </ShortlistProvider>
      </BrowserRouter>
    </LanguageProvider>
  );

describe('DepositsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    // URL state persists across tests in the shared jsdom history — reset it.
    window.history.pushState({}, '', '/deposits');
    mockList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    mockScenario.mockResolvedValue(scenarioResponse);
  });

  it('auto-runs the scenario and renders the ranked results in backend order', async () => {
    renderPage();

    await waitFor(() => expect(mockScenario).toHaveBeenCalled());
    expect(mockScenario).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'fdr', amount: 500000, months: 12, hasTin: true })
    );

    await screen.findByRole('link', { name: 'Alpha FDR' });
    // Backend ranking order is preserved in the DOM link sequence.
    const order = screen
      .getAllByRole('link')
      .map(link => link.textContent)
      .filter(text => text === 'Alpha FDR' || text === 'Beta FDR');
    expect(order).toEqual(['Alpha FDR', 'Beta FDR']);
    // Net maturity hero uses the shared Money formatter (lakh grouping).
    expect(screen.getByText('৳5,40,500.00')).toBeInTheDocument();
    expect(screen.getByText('৳5,35,062.00')).toBeInTheDocument();
  });

  it('shows the Sanchayapatra benchmark separately from the bank ranking', async () => {
    renderPage();

    expect(await screen.findByText('Government benchmark — Sanchayapatra')).toBeInTheDocument();
    // The benchmark link comes after both ranked results — it lives in its
    // own band below the ranking, never inside it.
    const order = screen
      .getAllByRole('link')
      .map(link => link.textContent)
      .filter(
        text =>
          text === 'Alpha FDR' || text === 'Beta FDR' || text === '5-Year Bangladesh Sanchayapatra'
      );
    expect(order).toEqual(['Alpha FDR', 'Beta FDR', '5-Year Bangladesh Sanchayapatra']);
  });

  it('reports how many products had no covering rate', async () => {
    renderPage();
    expect(await screen.findByText(/3 product\(s\) publish no rate/)).toBeInTheDocument();
  });

  it('builds the bank filter from the products and sends the chosen bank id', async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        makeProduct({ id: 1 }),
        makeProduct({
          id: 2,
          name: 'Beta FDR',
          slug: 'beta-fdr',
          bank: { id: 2, name: 'Beta Bank' },
        }),
      ],
    });
    renderPage();

    // Options appear once the product list (which carries the banks) loads.
    expect(await screen.findByRole('option', { name: 'Alpha Bank' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Beta Bank' })).toBeInTheDocument();
    const bankSelect = screen.getByLabelText('Bank');

    await user.selectOptions(bankSelect, '1');
    await waitFor(() =>
      expect(mockScenario).toHaveBeenCalledWith(expect.objectContaining({ bank: 1 }))
    );
  });

  it('switches to the DPS scenario', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Monthly savings (DPS)' }));
    await waitFor(() =>
      expect(mockScenario).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'dps', monthlyInstalment: 5000, months: 12 })
      )
    );
  });

  it('has no axe violations with results rendered', async () => {
    const { container } = renderPage();
    await screen.findByRole('link', { name: 'Alpha FDR' });
    await expectNoAxeViolations(container);
  });

  it('validates the amount before calling the API', async () => {
    const user = userEvent.setup();
    renderPage();

    const amountInput = screen.getByLabelText('Deposit amount (BDT)');
    await user.clear(amountInput);
    await user.type(amountInput, '0');
    expect(
      await screen.findByText('Enter a deposit amount greater than zero.')
    ).toBeInTheDocument();
    // No scenario call may ever carry the invalid amount.
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(
      mockScenario.mock.calls.every(
        ([arg]) => arg.amount === undefined || (arg.amount as number) > 0
      )
    ).toBe(true);
  });
});
