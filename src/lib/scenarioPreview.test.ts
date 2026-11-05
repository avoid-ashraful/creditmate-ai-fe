import { getPlanCopy } from '../locales/plan';
import { runDepositScenario } from '../services/deposits';
import { runLoanScenario } from '../services/loans';

import { computeScenarioPreview } from './scenarioPreview';

jest.mock('../services/deposits', () => ({
  runDepositScenario: jest.fn(),
}));

jest.mock('../services/loans', () => ({
  runLoanScenario: jest.fn(),
}));

const copy = getPlanCopy('en');

describe('computeScenarioPreview', () => {
  it('computes the EMI preview with the same engine the tool uses', async () => {
    const text = await computeScenarioPreview(
      'emi',
      { amount: '120000', rate: '25', months: '12' },
      copy
    );
    expect(text).toContain('a month');
    expect(text).toContain('paid in total');
  });

  it('returns null when the saved rate is missing — no invented number', async () => {
    await expect(
      computeScenarioPreview('emi', { amount: '120000', months: '12' }, copy)
    ).resolves.toBeNull();
  });

  it('returns null when a payoff payment never clears the balance', async () => {
    // 100k at 25% APR charges ~2,083 in the first month; 1,000 never clears.
    await expect(
      computeScenarioPreview('payoff', { balance: '100000', rate: '25', payment: '1000' }, copy)
    ).resolves.toBeNull();
  });

  it('previews a deposit scenario from the scenario engine response', async () => {
    (runDepositScenario as jest.Mock).mockResolvedValue({
      results: [{ netMaturity: 545000, product: { name: 'Example FDR' } }],
      benchmarks: [],
      notes: [],
    });
    const text = await computeScenarioPreview(
      'deposit',
      { amount: '500000', months: '12', tin: '1' },
      copy
    );
    expect(text).toContain('Best net return');
    expect(text).toContain('Example FDR');
    expect(runDepositScenario).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'fdr', amount: 500000, months: 12 })
    );
  });

  it('previews the cheapest ELIGIBLE loan, skipping ineligible results (F3)', async () => {
    // Fixture mirrors the real LoanScenarioResponse payload shape
    // (services/loans ScenarioResultItem): the endpoint still costs
    // products flagged `eligible: false`, and here the cheapest one
    // is ineligible at the saved amount.
    const cost = (totalCost: number) => ({
      rate: 12,
      emi: 10000,
      totalInterestOrProfit: totalCost - 100000,
      totalCost,
    });
    const resultItem = (name: string, eligible: boolean, totalCost: number) => ({
      product: { name },
      eligible,
      flags: eligible ? [] : [{ code: 'amount_out_of_range', message: 'Amount out of range' }],
      warnings: [],
      band: { min: 10, max: 15, source: 'product_page', category: null },
      rateLabel: 'interest',
      usesSimpleInterest: false,
      processingFee: 0,
      processingFeeInclVat: 0,
      supervisionCharge: null,
      atMinRate: cost(totalCost),
      atMaxRate: cost(totalCost + 5000),
      note: null,
    });
    (runLoanScenario as jest.Mock).mockResolvedValue({
      loanType: 'personal',
      amount: 100000,
      tenureMonths: 12,
      monthlyIncome: null,
      results: [
        resultItem('Cheapest But Ineligible Loan', false, 108000),
        resultItem('Cheapest Eligible Loan', true, 115000),
        resultItem('Pricier Eligible Loan', true, 121000),
      ],
      notes: [],
    });
    const text = await computeScenarioPreview(
      'loan',
      { amount: '100000', months: '12', type: 'personal' },
      copy
    );
    expect(text).toContain('Lowest total cost');
    expect(text).toContain('Cheapest Eligible Loan');
    expect(text).not.toContain('Ineligible Loan');
    expect(runLoanScenario).toHaveBeenCalledWith(
      expect.objectContaining({ loanType: 'personal', amount: 100000, tenureMonths: 12 })
    );
  });
});
