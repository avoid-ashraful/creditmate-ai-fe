import { getPlanCopy } from '../locales/plan';
import { runDepositScenario } from '../services/deposits';

import { computeScenarioPreview } from './scenarioPreview';

jest.mock('../services/deposits', () => ({
  runDepositScenario: jest.fn(),
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
});
