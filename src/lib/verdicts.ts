/**
 * Verdict lines for a set of compared cards (plan Section 4.7), shared by
 * the compare workspace and public shared-comparison pages so both frame
 * the same numbers the same way.
 *
 * Computed from published fields only: a card whose fee or rate is not
 * published does not compete for that line, and a line with no published
 * value at all is omitted rather than guessed.
 */

import type { CreditCard } from '../types';

import { formatTaka } from './format';

export interface CompareVerdictLabels {
  lowestFee: string;
  lowestApr: string;
}

export const compareVerdicts = (
  cards: CreditCard[],
  labels: CompareVerdictLabels
): { label: string; value: string }[] => {
  const items: { label: string; value: string }[] = [];
  if (cards.length < 2) return items;
  const feeCards = cards.filter(card => card.annualFee !== null);
  if (feeCards.length > 0) {
    const lowest = feeCards.reduce((best, card) =>
      (card.annualFee as number) < (best.annualFee as number) ? card : best
    );
    items.push({
      label: labels.lowestFee,
      value: `${lowest.name} · ${formatTaka(lowest.annualFee as number)}`,
    });
  }
  const aprCards = cards.filter(card => card.interestRateApr !== null);
  if (aprCards.length > 0) {
    const lowest = aprCards.reduce((best, card) =>
      (card.interestRateApr as number) < (best.interestRateApr as number) ? card : best
    );
    items.push({
      label: labels.lowestApr,
      value: `${lowest.name} · ${lowest.interestRateApr}%`,
    });
  }
  return items;
};
