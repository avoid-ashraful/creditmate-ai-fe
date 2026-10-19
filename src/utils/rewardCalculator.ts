import { CashbackRule, CreditCard, RewardCategory, RewardEarnRule } from '../types';

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
 * IMPORTANT (assumption guard): used only as the fallback for legacy free-text
 * policies (reward_points_policy) when the structured reward_earn_rules and
 * cashback_rules lists are both empty. The rates below are derived ONLY from
 * the published policy text of each card, and they carry NO point value: a
 * fallback card without a bank-stated redemption value is never converted into
 * BDT (see computeCardEstimate).
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

const INPUT_CATEGORIES: ReadonlyArray<keyof CategoryAllocation> = [
  'dining',
  'travel',
  'groceries',
  'fuel',
  'other',
];

/**
 * Which calculator input category a structured rule category spend feeds into
 * ('all' rules are resolved separately as the generic fallback).
 */
const RULE_INPUT_CATEGORY: Record<Exclude<RewardCategory, 'all'>, keyof CategoryAllocation> = {
  dining: 'dining',
  travel: 'travel',
  groceries: 'groceries',
  fuel: 'fuel',
  online: 'other',
  international: 'travel',
  other: 'other',
};

/**
 * Pick the most specific earn/cashback rule for an input category:
 * the first rule whose (non-'all') category maps to the input category, else
 * the first 'all' rule, else none. First match wins so the rule order in the
 * bank data is preserved.
 */
const ruleForCategory = <T extends { category: RewardCategory }>(
  rules: T[],
  inputCategory: keyof CategoryAllocation
): T | null => {
  const specific = rules.find(
    rule => rule.category !== 'all' && RULE_INPUT_CATEGORY[rule.category] === inputCategory
  );
  if (specific) return specific;
  return rules.find(rule => rule.category === 'all') ?? null;
};

/** A numeric cap parsed from a bank's verbatim cap wording, or null. */
export interface CashbackCap {
  amount: number;
  period: 'monthly' | 'yearly' | null;
}

/**
 * Parse a numeric cashback cap only when the wording is unambiguous, e.g.
 * "up to BDT 300 monthly". Note: "monthly" here means the calendar-month
 * cap printed by the bank. Anything vague ("up to BDT 300" with no period,
 * USD amounts, conditions embedded in the text) yields period = null or no
 * cap at all: then the cap is shown as text but never applied numerically.
 */
export const parseCashbackCap = (capText: string | null): CashbackCap | null => {
  if (!capText || !capText.trim()) return null;
  const amountMatch = capText.match(/(?:BDT|৳|Tk\.?)\s*([\d,]+(?:\.\d+)?)/i);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[1].replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const lower = capText.toLowerCase();
  let period: CashbackCap['period'] = null;
  if (/monthly|per month|\/month|a month/.test(lower)) period = 'monthly';
  else if (/yearly|per year|a year|annually|annual/.test(lower)) period = 'yearly';
  // Without a stated period the cap is not applied numerically.
  if (
    /monthly|per month|\/month|a month/.test(lower) &&
    /yearly|per year|a year|annually/.test(lower)
  ) {
    // Both keywords: ambiguous, refuse to apply.
    period = null;
  }

  return { amount, period };
};

/**
 * One rule that the estimate actually applied, kept structured so the UI can
 * render short localized summaries plus the bank's verbatim text.
 */
export interface AppliedRule {
  kind: 'earn' | 'cashback';
  /** The category as published by the bank (may be 'all'). */
  ruleCategory: RewardCategory;
  /** The calculator input category the rule was applied to. */
  inputCategory: keyof CategoryAllocation;
  /** Verbatim wording from the bank. */
  text: string;
  /** Present for earn rules. */
  earn?: { pointsPerUnit: number; spendUnitBdt: number };
  /** Present for cashback rules; capPeriod null = text-only cap. */
  cashback?: { percent: number; capText: string | null; capPeriod: 'monthly' | 'yearly' | null };
}

/**
 * The full estimate for one card against a category allocation.
 *
 * Value guards:
 *  - points are converted to BDT ONLY when the bank states a redemption value;
 *  - cashback is bank-stated percentage, capped numerically only when the cap
 *    wording is unambiguous;
 *  - when no BDT value is computable, annualValueBdt stays null and the UI
 *    shows the estimated points with "value not published by the bank".
 */
export interface CardRewardEstimate {
  /** Estimated reward points per year; null when no points rule applies. */
  annualPoints: number | null;
  /** Estimated annual reward value in BDT; null if no value was computable without inventing. */
  annualValueBdt: number | null;

  annualValueBdt: number | null;
  /** Whether the bank states a point redemption value. */
  hasStatedPointValue: boolean;
  /** Where the earn rates came from. */
  ruleMode: 'structured' | 'policy-fallback' | 'none';
  /** Rules actually applied to the current allocation. */
  appliedRules: AppliedRule[];
  /** Verbatim bank texts for the details expander (earn + cashback rules, or the legacy policy). */
  ruleTexts: string[];
  /** Cashback cap wording shown to the user verbatim. */
  capTexts: string[];
  /**
   * True when a numeric cap actually reduced the estimated cashback
   * (break-even then depends on the cap, not spend).
   */
  capApplied: boolean;
}

const buildEstimate = (overrides: Partial<CardRewardEstimate>): CardRewardEstimate => ({
  annualPoints: null,
  annualValueBdt: null,
  hasStatedPointValue: false,
  ruleMode: 'none',
  appliedRules: [],
  ruleTexts: [],
  capTexts: [],
  capApplied: false,
  ...overrides,
});

/**
 * Estimate a card's annual points and BDT value for the given allocation.
 *
 * Points per year for a category = monthlySpend × 12 / spendUnit × pointsPerUnit.
 * Cashback per year capped monthly = min(monthlySpend × percent/100, cap) × 12.
 */
export const computeCardEstimate = (
  card: CreditCard,
  allocation: CategoryAllocation
): CardRewardEstimate => {
  const earnRules = card.rewardEarnRules ?? [];
  const cashbackRules = card.cashbackRules ?? [];
  const pointValue = card.rewardPointValueBdt ?? null;
  const hasStatedPointValue = pointValue !== null;

  if (earnRules.length === 0 && cashbackRules.length === 0) {
    // Fallback: legacy free-text policy. Rates give points only; a BDT value is
    // shown only when the bank separately states a point redemption value.
    // We NEVER assume a point value here.
    const rates = parseRewardRates(card.rewardPointsPolicy || '');
    const pointsPerMonth = INPUT_CATEGORIES.reduce(
      (sum, key) => sum + allocation[key] * rates[key],
      0
    );
    const annualPoints = pointsPerMonth * 12;
    const hasRates =
      rates.dining > 0 ||
      rates.travel > 0 ||
      rates.groceries > 0 ||
      rates.fuel > 0 ||
      rates.other > 0;
    if (!hasRates) {
      return buildEstimate({ ruleMode: 'none' });
    }
    return buildEstimate({
      annualPoints,
      annualValueBdt: hasStatedPointValue ? annualPoints * pointValue : null,
      hasStatedPointValue,
      ruleMode: 'policy-fallback',
      ruleTexts: card.rewardPointsPolicy ? [card.rewardPointsPolicy] : [],
    });
  }

  // Structured rules.
  let annualPoints = 0;
  let annualCashback = 0;
  let annualPointsEarned = false;
  let annualCashbackApply = false;
  const appliedRules: AppliedRule[] = [];
  const capTexts: string[] = [];
  let capApplied = false;

  INPUT_CATEGORIES.forEach(inputCategory => {
    const spend = allocation[inputCategory];
    if (!(spend > 0)) return;

    const earnRule: RewardEarnRule | null = ruleForCategory(earnRules, inputCategory);
    if (earnRule && earnRule.spendUnitBdt > 0 && earnRule.pointsPerUnit > 0) {
      const monthly = (spend / earnRule.spendUnitBdt) * earnRule.pointsPerUnit;
      annualPoints += monthly * 12;
      annualPointsEarned = true;
      appliedRules.push({
        kind: 'earn',
        ruleCategory: earnRule.category,
        inputCategory,
        text: earnRule.text,
        earn: { pointsPerUnit: earnRule.pointsPerUnit, spendUnitBdt: earnRule.spendUnitBdt },
      });
    }

    const cashbackRule: CashbackRule | null = ruleForCategory(cashbackRules, inputCategory);
    if (cashbackRule && cashbackRule.percent > 0) {
      const monthlyCashback = (spend * cashbackRule.percent) / 100;
      const cap = parseCashbackCap(cashbackRule.capText);
      const annualForRule =
        cap && cap.period === 'monthly'
          ? Math.min(monthlyCashback, cap.amount) * 12
          : cap && cap.period === 'yearly'
          ? Math.min(monthlyCashback * 12, cap.amount)
          : monthlyCashback * 12;
      if (cap && annualForRule < monthlyCashback * 12 - 1e-9) {
        capApplied = true;
      }
      annualCashback += annualForRule;
      annualCashbackApply = true;
      if (cashbackRule.capText) capTexts.push(cashbackRule.capText);
      appliedRules.push({
        kind: 'cashback',
        ruleCategory: cashbackRule.category,
        inputCategory,
        text: cashbackRule.text,
        cashback: {
          percent: cashbackRule.percent,
          capText: cashbackRule.capText,
          capPeriod: cap?.period ?? null,
        },
      });
    }
  });

  const valueFromPoints = hasStatedPointValue ? annualPoints * pointValue : 0;
  const annualValue = valueFromPoints + annualCashback;

  return buildEstimate({
    annualPoints: annualPointsEarned ? annualPoints : null,
    annualValueBdt:
      annualCashbackApply || (annualPointsEarned && hasStatedPointValue) ? annualValue : null,
    hasStatedPointValue,
    ruleMode: 'structured',
    appliedRules,
    ruleTexts: [...earnRules, ...cashbackRules].map(rule => rule.text).filter(Boolean),
    capTexts,
    capApplied,
  });
};

/**
 * Estimated BDT value of one unit of total monthly spend (the marginal value
 * "slope" used for break-even). Returns null when the value is not proportional
 * to spend (cap truncation) or relies on an unstated point value.
 */
const estimateValueSlope = (
  card: CreditCard,
  estimate: CardRewardEstimate,
  allocation: CategoryAllocation
): number | null => {
  if (estimate.capApplied) return null;

  const totalSpend = INPUT_CATEGORIES.reduce((sum, key) => sum + allocation[key], 0);
  if (totalSpend <= 0) return null;

  const pointValue = card.rewardPointValueBdt ?? null;
  const earnRules = card.rewardEarnRules ?? [];
  const cashbackRules = card.cashbackRules ?? [];

  if (estimate.ruleMode === 'policy-fallback') {
    if (pointValue === null) return null;
    const rates = parseRewardRates(card.rewardPointsPolicy || '');
    const weightedRate = INPUT_CATEGORIES.reduce(
      (sum, key) => sum + (allocation[key] / totalSpend) * rates[key],
      0
    );
    return weightedRate * pointValue;
  }

  if (estimate.ruleMode !== 'structured') return null;

  let slope = 0;
  INPUT_CATEGORIES.forEach(inputCategory => {
    const share = allocation[inputCategory] / totalSpend;
    const earnRule = ruleForCategory(earnRules, inputCategory);
    if (earnRule && earnRule.spendUnitBdt > 0) {
      slope += share * (earnRule.pointsPerUnit / earnRule.spendUnitBdt) * (pointValue ?? 0);
    }
    const cashbackRule = ruleForCategory(cashbackRules, inputCategory);
    if (cashbackRule) {
      slope += share * (cashbackRule.percent / 100);
    }
  });
  return slope;
};

/**
 * Break-even monthly spend (BDT/month, summed across all categories in the
 * user's current allocation proportions) at which the card's annual reward
 * value exactly offsets its annual fee.
 *
 * Returns:
 *  - 0 for cards with no annual fee,
 *  - null when the fee is unknown, the value is not computable/proportional,
 *    or a cap truncates the value (no honest linear break-even exists).
 */
export const calculateFeeBreakEvenSpend = (
  card: CreditCard,
  estimate: CardRewardEstimate,
  allocation: CategoryAllocation
): number | null => {
  if (card.annualFee === null) return null;
  if (card.annualFee === 0) return 0;
  if (estimate.annualValueBdt === null || estimate.annualValueBdt <= 0) return null;

  const slope = estimateValueSlope(card, estimate, allocation);
  if (slope === null || slope <= 0) return null;

  return card.annualFee / (12 * slope);
};

/**
 * A ranked card result for display.
 */
export interface RankedCard {
  card: CreditCard;
  estimate: CardRewardEstimate;
  annualPoints: number | null;
  annualRewardValue: number | null;
  netAnnualValue: number | null;
  breakEvenMonthlySpend: number | null;
}

const hasRankingSignal = (estimate: CardRewardEstimate): boolean =>
  (estimate.annualPoints !== null && estimate.annualPoints > 0) ||
  (estimate.annualValueBdt !== null && estimate.annualValueBdt > 0);

/**
 * Rank cards for display:
 *  - cards with a computable annual BDT value (bank-stated point value and/or
 *    cashback) rank above cards with estimated points but no published value;
 *  - inside each group, cards with a known annual fee sort by net annual value
 *    (rewards − fee) and unknown-fee cards follow at the bottom of the group;
 *  - cards with no reward signal, unknown fee in the points-only group remain
 *    visible but rank below anything with a value — a value is never invented.
 * Returns at most `limit` entries.
 */
export const rankCards = (
  cards: CreditCard[],
  allocation: CategoryAllocation,
  limit = 5
): RankedCard[] => {
  return cards
    .filter(card => Boolean(card) && card.isActive)
    .map(card => {
      const estimate = computeCardEstimate(card, allocation);
      const netAnnualValue =
        card.annualFee === null || estimate.annualValueBdt === null
          ? null
          : estimate.annualValueBdt - card.annualFee;
      return {
        card,
        estimate,
        annualPoints: estimate.annualPoints,
        annualRewardValue: estimate.annualValueBdt,
        netAnnualValue,
        breakEvenMonthlySpend: calculateFeeBreakEvenSpend(card, estimate, allocation),
      } as RankedCard;
    })
    .filter(ranked => hasRankingSignal(ranked.estimate))
    .sort((a, b) => {
      // Group 0: cards with a positive annual BDT value; group 1: the rest.
      const tierOf = (ranked: RankedCard): number =>
        ranked.annualRewardValue !== null && ranked.annualRewardValue > 0 ? 0 : 1;
      if (tierOf(a) !== tierOf(b)) return tierOf(a) - tierOf(b);
      // Known fees first within a tier, then by net / value / points descending.
      if ((a.netAnnualValue === null) !== (b.netAnnualValue === null)) {
        return a.netAnnualValue === null ? 1 : -1;
      }
      const netDiff = (b.netAnnualValue ?? 0) - (a.netAnnualValue ?? 0);
      if (netDiff !== 0) return netDiff;
      const valueDiff = (b.annualRewardValue ?? 0) - (a.annualRewardValue ?? 0);
      if (valueDiff !== 0) return valueDiff;
      return (b.annualPoints ?? 0) - (a.annualPoints ?? 0);
    })
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
