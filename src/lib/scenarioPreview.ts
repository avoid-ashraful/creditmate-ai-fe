/**
 * Ghost-preview for saved Plan scenarios (Phase 4, addendum B5).
 *
 * Before a saved scenario is applied, its outcome is computed with the
 * SAME engines the tool itself uses — calculateEmi / calculatePayoff /
 * the deposit maths for the calculator tools, the scenario endpoints
 * for loan and account, rankCards over the live catalogue for rewards.
 * Nothing here estimates or stubs: when the saved parameters cannot
 * produce the tool's real outcome (a missing custom rate, an
 * unparseable amount), the preview is null and the UI says so plainly
 * instead of inventing a number.
 */

import { fillCopy } from '../locales';
import type { PlanCopy } from '../locales/plan';
import { apiService } from '../services/api';
import { runAccountScenario } from '../services/bankAccounts';
import { runDepositScenario } from '../services/deposits';
import { runLoanScenario, type LoanType } from '../services/loans';
import type { SavedScenarioTool } from '../services/saved';
import { calculateEmi, calculatePayoff } from '../utils/emiPayoffCalculator';
import { rankCards, type CategoryAllocation } from '../utils/rewardCalculator';

import { formatTaka } from './format';

const num = (raw: string | undefined): number | null => {
  if (raw === undefined || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
};

const money = (value: number): string => formatTaka(Math.round(value));

export const computeScenarioPreview = async (
  tool: SavedScenarioTool,
  params: Record<string, string>,
  copy: PlanCopy
): Promise<string | null> => {
  try {
    switch (tool) {
      case 'emi': {
        const principal = num(params.amount);
        const apr = num(params.rate);
        const months = num(params.months);
        if (principal === null || apr === null || months === null) return null;
        const result = calculateEmi({ principal, aprPercent: apr, months });
        if (!result) return null;
        return fillCopy(copy.previewEmiResult, {
          emi: money(result.monthlyEmi),
          total: money(result.totalPayable),
        });
      }
      case 'payoff': {
        const balance = num(params.balance);
        const apr = num(params.rate);
        const payment = num(params.payment);
        if (balance === null || apr === null || payment === null) return null;
        const result = calculatePayoff({ balance, aprPercent: apr, monthlyPayment: payment });
        if (!result || !result.clears) return null;
        return fillCopy(copy.previewPayoffResult, {
          months: String(result.months),
          interest: money(result.totalInterest),
        });
      }
      case 'deposit': {
        // The discovery scenario engine ranks real products at these
        // numbers — the same response the Deposits page renders.
        const months = num(params.months);
        if (months === null) return null;
        const kind = params.kind === 'dps' ? 'dps' : 'fdr';
        const amount = num(params.amount);
        const instalment = num(params.instalment);
        if (kind === 'fdr' && amount === null) return null;
        if (kind === 'dps' && instalment === null) return null;
        const response = await runDepositScenario({
          kind,
          months,
          hasTin: params.tin !== '0',
          ...(kind === 'dps'
            ? { monthlyInstalment: instalment as number }
            : { amount: amount as number }),
        });
        const first = response.results[0];
        if (!first) return null;
        return fillCopy(copy.previewDepositResult, {
          value: money(first.netMaturity),
          name: first.product.name,
        });
      }
      case 'loan': {
        const amount = num(params.amount);
        const months = num(params.months);
        if (amount === null || months === null) return null;
        const response = await runLoanScenario({
          loanType: (params.type as LoanType) ?? 'personal',
          amount,
          tenureMonths: months,
        });
        // "Lowest total cost" = the cheapest band-end across products,
        // exactly as the loan tool ranks them.
        const costed = response.results.filter(result => result.atMinRate !== null);
        if (costed.length === 0) return null;
        const cheapest = costed.reduce((a, b) =>
          (a.atMinRate?.totalCost ?? Infinity) <= (b.atMinRate?.totalCost ?? Infinity) ? a : b
        );
        return fillCopy(copy.previewLoanResult, {
          total: money(cheapest.atMinRate?.totalCost ?? 0),
          name: cheapest.product.name,
        });
      }
      case 'account': {
        const balance = num(params.balance);
        if (balance === null) return null;
        const response = await runAccountScenario({ averageBalance: balance });
        const first = response.results[0];
        if (!first || first.netAnnualValue === null) return null;
        return fillCopy(copy.previewAccountResult, {
          value: money(first.netAnnualValue),
          name: first.product.name,
        });
      }
      case 'rewards': {
        const allocation: CategoryAllocation = {
          dining: num(params.dining) ?? 0,
          travel: num(params.travel) ?? 0,
          groceries: num(params.groceries) ?? 0,
          fuel: num(params.fuel) ?? 0,
          other: num(params.other) ?? 0,
        };
        if (Object.values(allocation).every(value => value <= 0)) return null;
        const response = await apiService.getCreditCards({ page_size: 200 });
        const cards = response.results.map(card => apiService.transformCreditCard(card));
        const ranked = rankCards(cards, allocation, cards.length);
        const best = ranked.find(entry => entry.netAnnualValue !== null);
        if (!best || best.netAnnualValue === null) return null;
        return fillCopy(copy.previewRewardsResult, {
          value: money(best.netAnnualValue),
          name: best.card.name,
        });
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
};
