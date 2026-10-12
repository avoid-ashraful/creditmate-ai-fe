import { CreditCard } from '../types';

/**
 * Category allocation for monthly spend in BDT.
 */
export type CategoryAllocation = {
  dining: number;
  travel: number;
  groceries: number;
  fuel: number;
  other: number;
};

/**
 * Reward rates per category in "points per BDT spent".
 *
 * IMPORTANT (assumption guard): the backend card data (reward_points_policy)
 * is free text and does not provide an explicit, authoritative "points → BDT"
 * redemption value or per-category earn rates for every category. The rates
 * below are therefore DERIVED ONLY from the published policy text of each card.
 * Where the policy does not mention a category specifically, the card's base
 * earn rate is used (never a boosted rate). Where the policy text cannot be
 * parsed at all, no rate is assumed and the card is excluded from calcuation
 * rather than inventing a value.
 */
export type RewardRates = {
  dining: number;
  travel: number;
  groceries: number;
  fuel: number;
  other: number;
};

/** Fallback when a policy cannot be parsed: no assumed rates. */
const UNKNOWN_RATES: RewardRates = { dining: 0, travel: 0, groceries: 0, fuel: 0, other: 0 };

/**
 * Parse a card's rewardPointsPolicy free text into per-category earn rates
 * (points per BDT). Only patterns actually present in the published data are
 * recognised; anything unrecognised yields UNKNOWN_RATES and the card is
 * skipped for ranking instead of having values invented.
 *
 * Recognised published patterns (from the card data in the application):
 *  - "Earn 1 point for every BDT 50 spent. Double points on dining and travel."
 *  - "Earn 1 reward point for every BDT 40 spent. 5X points on weekend dining."
 *  - "Earn 2 points for every BDT 100 spent locally, 3 points for international spending."
 *  - "Earn 1 point for every BDT 75 spent. ..."
 *  - "Earn Amex Membership Rewards points. 1 point for every BDT 50 spent."
 *  - "Earn 1 point for every BDT 100 spent[ on retail purchases]."
 *  - "Earn 1.5 points for every BDT 100 spent."
 *
 * Category mapping assumptions (documented, conservative):
 *  - "Dining" maps directly to the dining boost when stated.
 *  - "Travel" maps to "travel" and to "international spending" when stated.
 *  - "Local/locally" and "retail purchases" map to groceries/fuel/other (the
 *    base everyday-spend categories) at the stated rate.
 *  - Categories not explicitly boosted always fall back to the base rate,
 *    never to a boosted rate.
 */
export const parseRewardRates = (policy: string): RewardRates => {
  if (!policy || !policy.trim()) return UNKNOWN_RATES;

  const lower = policy.toLowerCase();

  // Base earn pattern: "N point(s) for every BDT M spent"
  const baseMatch = policy.match(
    /(\d+(?:\.\d+)?)\s+(?:\w+\s+)*?point[s]?\s+for\s+every\s+BDT\s+(\d+(?:\.\d+)?)\s+spent/i
  );
  if (!baseMatch) {
    return UNKNOWN_RATES;
  }

  const base = Number(baseMatch[1]) / Number(baseMatch[2]);
  if (!Number.isFinite(base) || base <= 0) {
    return UNKNOWN_RATES;
  }

  // Start every category at the base rate: we never invent boosts.
  const rates: RewardRates = {
    dining: base,
    travel: base,
    groceries: base,
    fuel: base,
    other: base,
  };

  // Guarded boosts — only applied when explicitly stated in the policy text.
  if (/double points on dining and travel/i.test(lower)) {
    rates.dining = base * 2;
    rates.travel = base * 2;
  }

  const multiplierMatch = lower.match(/(\d+)x\s+points\s+on\s+(?:weekend\s+)?dining/i);
  if (multiplierMatch) {
    rates.dining = base * Number(multiplierMatch[1]);
  }

  // "N points for international spending" → travel rate.
  const intlMatch = policy.match(/(\d+(?:\.\d+)?)\s+point[s]?\s+for\s+international\s+spend/i);
  if (intlMatch) {
    // The "every BDT M" part comes from the base pattern for the same policy.
    rates.travel = Number(intlMatch[1]) / Number(baseMatch[2]);
  }

  return rates;
};

/**
 * Assumed value of one reward point in BDT.
 *
 * IMPORTANT (assumption guard): the published card data does NOT include an
 * explicit conversion from points to BDT value. To convert "points earned"
 * into a comparable monetary estimate, the calculator uses a conservative,
 * uniform assumption across all cards of 1 point = BDT 1.00. This assumption
 * is displayed to the user on the page so it can never be mistaken for a
 * bank-stated value.
 */
export const POINT_VALUE_BDT = 1;

/**
 * Estimated annual reward value (in BDT) for a card given a monthly category
 * allocation: monthlySpend × earnRate summed across categories × 12 months ×
 * the assumed point value.
 */
export const calculateAnnualRewardValue = (
  card: CreditCard,
  allocation: CategoryAllocation
): number => {
  const rates = parseRewardRates(card.rewardPointsPolicy || '');

  const monthlyPoints =
    allocation.dining * rates.dining +
    allocation.travel * rates.travel +
    allocation.groceries * rates.groceries +
    allocation.fuel * rates.fuel +
    allocation.other * rates.other;

  return monthlyPoints * 12 * POINT_VALUE_BDT;
};

/**
 * Net annual value of a card: annual estimated reward value minus the annual
 * fee. Cards with an unknown (null) annual fee are excluded by returning
 * null rather than treating the fee as zero.
 */
export const calculateNetAnnualValue = (
  card: CreditCard,
  allocation: CategoryAllocation
): number | null => {
  if (card.annualFee === null) return null;
  return calculateAnnualRewardValue(card, allocation) - card.annualFee;
};

/**
 * Break-even monthly spend (BDT/month, summed across all categories in the
 * user's current allocation proportions) at which the card's annual reward
 * value exactly offsets its annual fee:
 *   breakEvenTotalMonthlySpend × Σ(rate_c × share_c) × 12 = annualFee
 * so that:
 *   breakEvenTotalMonthlySpend = annualFee / (12 × Σ(rate_c × share_c))
 * where share_c is the fraction of total monthly spend in category c.
 *
 * Returns:
 *  - 0 for cards with no annual fee,
 *  - null when the spend shares are all zero, the card has no parseable
 *    reward rate, or the fee is unknown (null) — in those cases a meaningful
 *    break-even cannot be computed and one must not be invented.
 */
export const calculateFeeBreakEvenSpend = (
  card: CreditCard,
  allocation: CategoryAllocation
): number | null => {
  if (card.annualFee === null) return null;
  if (card.annualFee === 0) return 0;

  const rates = parseRewardRates(card.rewardPointsPolicy || '');
  const totalSpend =
    allocation.dining +
    allocation.travel +
    allocation.groceries +
    allocation.fuel +
    allocation.other;

  if (totalSpend <= 0) return null;

  const weightedRate =
    (allocation.dining / totalSpend) * rates.dining +
    (allocation.travel / totalSpend) * rates.travel +
    (allocation.groceries / totalSpend) * rates.groceries +
    (allocation.fuel / totalSpend) * rates.fuel +
    (allocation.other / totalSpend) * rates.other;

  if (weightedRate <= 0) return null;

  return card.annualFee / (12 * weightedRate * POINT_VALUE_BDT);
};

/**
 * A ranked card result for display.
 */
export interface RankedCard {
  card: CreditCard;
  annualRewardValue: number;
  netAnnualValue: number;
  breakEvenMonthlySpend: number | null;
}

/**
 * Rank cards by net annual value (annual estimated rewards minus annual
 * fee), descending. Cards with unknown annual fees, unparseable reward
 * policies, or inactive status are excluded so that nothing is invented.
 * Returns at most `limit` entries.
 */
export const rankCards = (
  cards: CreditCard[],
  allocation: CategoryAllocation,
  limit = 5
): RankedCard[] => {
  return cards
    .filter(card => {
      if (!card || card.annualFee === null || !card.isActive) return false;
      const rates = parseRewardRates(card.rewardPointsPolicy || '');
      const hasParseablePolicy =
        rates.dining > 0 ||
        rates.travel > 0 ||
        rates.groceries > 0 ||
        rates.fuel > 0 ||
        rates.other > 0;
      return hasParseablePolicy;
    })
    .map(card => ({
      card,
      annualRewardValue: calculateAnnualRewardValue(card, allocation),
      netAnnualValue: calculateNetAnnualValue(card, allocation) as number,
      breakEvenMonthlySpend: calculateFeeBreakEvenSpend(card, allocation),
    }))
    .sort((a, b) => b.netAnnualValue - a.netAnnualValue)
    .slice(0, limit);
};

/**
 * Validate the category allocation.
 * Returns a map of field name → error message; empty object means valid.
 * Rules:
 *  - every field must be a finite number ≥ 0,
 *  - at least one field must be > 0 (a nullable "all zero" input is not meaningful).
 */
export const validateAllocation = (
  allocation: CategoryAllocation
): Partial<Record<keyof CategoryAllocation | 'form', string>> => {
  const errors: Partial<Record<keyof CategoryAllocation | 'form', string>> = {};

  (Object.keys(allocation) as (keyof CategoryAllocation)[]).forEach(key => {
    const value = allocation[key];
    if (!Number.isFinite(value) || value < 0) {
      errors[key] = 'Enter a non-negative amount';
    }
  });

  const total =
    allocation.dining +
    allocation.travel +
    allocation.groceries +
    allocation.fuel +
    allocation.other;

  if (Number.isFinite(total) && total <= 0) {
    errors.form = 'Total monthly spend must be greater than zero';
  }

  return errors;
};
