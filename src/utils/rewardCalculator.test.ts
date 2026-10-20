import { CreditCard } from '../types';

import {
  calculateFeeBreakEvenSpend,
  CategoryAllocation,
  computeCardEstimate,
  estimateAnnualInterest,
  MAX_AVERAGE_REVOLVING_BALANCE,
  parseCashbackCap,
  parseRewardRates,
  rankCards,
  validateAllocation,
  validateAverageRevolvingBalance,
} from './rewardCalculator';

const buildCard = (overrides: Partial<CreditCard>): CreditCard => ({
  id: 1,
  bankId: 1,
  bankName: 'Test Bank',
  name: 'Test Card',
  annualFee: 5000,
  interestRateApr: 24,
  loungeAccessInternational: null,
  loungeAccessDomestic: null,
  cashAdvanceFee: '',
  latePaymentFee: '',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent.',
  additionalFeatures: [],
  sourceUrl: '',
  isActive: true,
  lastUpdated: null,
  images: [],
  ...overrides,
});

const SPEND: CategoryAllocation = {
  dining: 10000,
  travel: 5000,
  groceries: 8000,
  fuel: 4000,
  other: 3000,
};

const allRule = (pointsPerUnit = 1, spendUnitBdt = 50) => ({
  category: 'all' as const,
  pointsPerUnit,
  spendUnitBdt,
  text: `Earn ${pointsPerUnit} point for every BDT ${spendUnitBdt} spent.`,
});

describe('parseRewardRates (legacy free-text fallback)', () => {
  it('parses a base earn rate and applies it to every category', () => {
    const rates = parseRewardRates('Earn 1 point for every BDT 50 spent.');
    expect(rates).toEqual({
      dining: 0.02,
      travel: 0.02,
      groceries: 0.02,
      fuel: 0.02,
      other: 0.02,
    });
  });

  it('applies explicit dining and travel boosts only when stated', () => {
    const rates = parseRewardRates(
      'Earn 1 point for every BDT 50 spent. Double points on dining and travel.'
    );
    expect(rates.dining).toBeCloseTo(0.04);
    expect(rates.travel).toBeCloseTo(0.04);
    expect(rates.groceries).toBeCloseTo(0.02);
    expect(rates.fuel).toBeCloseTo(0.02);
    expect(rates.other).toBeCloseTo(0.02);
  });

  it('applies a multiplier on dining only when stated', () => {
    const rates = parseRewardRates(
      'Earn 1 reward point for every BDT 40 spent. 5X points on weekend dining.'
    );
    expect(rates.dining).toBeCloseTo(0.125);
    expect(rates.travel).toBeCloseTo(0.025);
  });

  it('parses local vs international rates', () => {
    const rates = parseRewardRates(
      'Earn 2 points for every BDT 100 spent locally, 3 points for international spending.'
    );
    expect(rates.travel).toBeCloseTo(0.03);
    expect(rates.groceries).toBeCloseTo(0.02);
    expect(rates.fuel).toBeCloseTo(0.02);
    expect(rates.other).toBeCloseTo(0.02);
  });

  it('returns zero rates for unrecognised policies instead of inventing values', () => {
    expect(parseRewardRates('Some opaque policy without numbers')).toEqual({
      dining: 0,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: 0,
    });
    expect(parseRewardRates('')).toEqual({
      dining: 0,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: 0,
    });
  });
});

describe('parseCashbackCap', () => {
  it('parses an unambiguous monthly cap', () => {
    expect(parseCashbackCap('up to BDT 300 monthly')).toEqual({ amount: 300, period: 'monthly' });
    expect(parseCashbackCap('Up to BDT 1,000 per month')).toEqual({
      amount: 1000,
      period: 'monthly',
    });
  });

  it('parses a yearly cap', () => {
    expect(parseCashbackCap('up to BDT 2,000 per year')).toEqual({
      amount: 2000,
      period: 'yearly',
    });
  });

  it('refuses caps without an amount or a period', () => {
    expect(parseCashbackCap('Conditions apply')).toBeNull();
    expect(parseCashbackCap(null)).toBeNull();
    // Amount without a period: shown as text, never applied numerically.
    expect(parseCashbackCap('up to BDT 300')).toEqual({ amount: 300, period: null });
    // Both periods: ambiguous -> not applied.
    expect(parseCashbackCap('up to BDT 300 monthly or BDT 3,000 per year')).toEqual({
      amount: 300,
      period: null,
    });
  });
});

describe('computeCardEstimate (structured rules)', () => {
  it('honours category precedence: the category rule beats the "all" rule', () => {
    const card = buildCard({
      rewardEarnRules: [
        {
          category: 'dining',
          pointsPerUnit: 5,
          spendUnitBdt: 100,
          text: '5 points per BDT 100 dining.',
        },
        allRule(1, 50),
      ],
    });
    const estimate = computeCardEstimate(card, { ...SPEND, dining: 10000 });
    // dining: 10,000/100 × 5 = 500/month; everything else: 20,000/50 × 1 = 400/month
    expect(estimate.annualPoints).toBeCloseTo((500 + 400) * 12);
    const diningRule = estimate.appliedRules.find(r => r.inputCategory === 'dining');
    expect(diningRule?.earn).toEqual({ pointsPerUnit: 5, spendUnitBdt: 100 });
  });

  it('falls back to the "all" rule for categories without their own rule', () => {
    const card = buildCard({
      rewardEarnRules: [
        { category: 'groceries', pointsPerUnit: 3, spendUnitBdt: 100, text: 'groceries boost' },
      ],
      rewardPointsPolicy: '',
    });
    const estimate = computeCardEstimate(card, SPEND);
    // No 'all' rule: only groceries earns points. 8,000/100 × 3 = 240/month.
    expect(estimate.annualPoints).toBeCloseTo(240 * 12);
  });

  it('converts points to BDT only when the bank states a point value', () => {
    // DBBL-style: 1 point per BDT 50, and 3 points = BDT 1 (0.3333 per point).
    const dbbl = buildCard({
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: 0.3333,
    });
    const estimate = computeCardEstimate(dbbl, SPEND);
    // 30,000/50 = 600 pts/month × 12 = 7,200 pts × 0.3333
    expect(estimate.annualPoints).toBeCloseTo(7200);
    expect(estimate.annualValueBdt).toBeCloseTo(7200 * 0.3333);
    expect(estimate.hasStatedPointValue).toBe(true);

    // Same card without a stated value: points are still estimated, no BDT.
    const withoutValue = buildCard({ rewardPointValueBdt: null });
    const noValue = computeCardEstimate(withoutValue, SPEND);
    expect(noValue.annualPoints).toBeCloseTo(7200);
    expect(noValue.annualValueBdt).toBeNull();
    expect(noValue.hasStatedPointValue).toBe(false);
  });

  it('values cashback in BDT without any point value, using the unambiguous cap', () => {
    const card = buildCard({
      rewardPointsPolicy: '',
      rewardEarnRules: [],
      cashbackRules: [
        {
          category: 'dining',
          percent: 5,
          capText: 'up to BDT 300 monthly',
          text: '5% cashback on dining up to BDT 300 monthly.',
        },
      ],
    });
    // Dining spend 50,000 × 5% = 2,500/month → capped at 300/month.
    const capped = computeCardEstimate(card, { ...SPEND, dining: 50000 });
    expect(capped.annualValueBdt).toBeCloseTo(300 * 12);
    expect(capped.annualPoints).toBeNull();
    expect(capped.capApplied).toBe(true);
    expect(capped.capTexts).toEqual(['up to BDT 300 monthly']);

    // Below the cap the cashback is proportional: 5,000 × 5% = 250/month.
    const uncapped = computeCardEstimate(card, { ...SPEND, dining: 5000 });
    expect(uncapped.annualValueBdt).toBeCloseTo(250 * 12);
    expect(uncapped.capApplied).toBe(false);
  });

  it('never numerically applies an ambiguous cap', () => {
    const card = buildCard({
      rewardPointsPolicy: '',
      cashbackRules: [
        {
          category: 'all',
          percent: 5,
          capText: 'up to BDT 300',
          text: '5% cashback, conditions apply.',
        },
      ],
    });
    const estimate = computeCardEstimate(card, {
      dining: 100000,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: 0,
    });
    // 100,000 × 5% = full amount: the printed but un-parsable cap is not applied.
    expect(estimate.annualValueBdt).toBeCloseTo(100000 * 0.05 * 12);
    expect(estimate.capApplied).toBe(false);
    expect(estimate.capTexts).toEqual(['up to BDT 300']);
  });

  it('reports when no rule is applicable to the allocation', () => {
    const card = buildCard({
      rewardPointsPolicy: '',
      rewardEarnRules: [],
      cashbackRules: [{ category: 'dining', percent: 2, capText: null, text: '2% dining only.' }],
    });
    // Spend nothing on dining.
    const estimate = computeCardEstimate(card, {
      dining: 0,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: 5000,
    });
    expect(estimate.annualPoints).toBeNull();
    expect(estimate.annualValueBdt).toBeNull();
    expect(estimate.appliedRules).toEqual([]);
  });
});

describe('computeCardEstimate (legacy policy fallback)', () => {
  it('is used when both structured rule lists are empty', () => {
    const card = buildCard({
      rewardEarnRules: [],
      cashbackRules: [],
      rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent.',
      rewardPointValueBdt: null,
    });
    const estimate = computeCardEstimate(card, SPEND);
    expect(estimate.ruleMode).toBe('policy-fallback');
    expect(estimate.annualPoints).toBeCloseTo(7200);
    // The fallback must never assume a point value.
    expect(estimate.annualValueBdt).toBeNull();
  });

  it('uses the bank-stated value when it exists in fallback mode', () => {
    const card = buildCard({
      rewardEarnRules: [],
      cashbackRules: [],
      rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent.',
      rewardPointValueBdt: 0.3333,
    });
    const estimate = computeCardEstimate(card, SPEND);
    expect(estimate.annualValueBdt).toBeCloseTo(7200 * 0.3333);
  });

  it('yields no ranking signal for an unparseable policy', () => {
    const estimate = computeCardEstimate(
      buildCard({ rewardPointsPolicy: 'Some opaque text' }),
      SPEND
    );
    expect(estimate.ruleMode).toBe('none');
    expect(estimate.annualPoints).toBeNull();
    expect(estimate.annualValueBdt).toBeNull();
  });
});

describe('calculateFeeBreakEvenSpend', () => {
  it('computes the monthly spend needed for rewards to offset the fee', () => {
    // 1 point per BDT 50 with a stated value of BDT 1 per point: slope 0.02.
    const card = buildCard({
      annualFee: 5000,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: 1,
    });
    const estimate = computeCardEstimate(card, SPEND);
    const breakEven = calculateFeeBreakEvenSpend(card, estimate, SPEND);
    expect(breakEven).toBeCloseTo(5000 / (12 * 0.02));
  });

  it('returns null when there is no bank-stated point value', () => {
    const card = buildCard({
      annualFee: 5000,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: null,
    });
    const estimate = computeCardEstimate(card, SPEND);
    expect(calculateFeeBreakEvenSpend(card, estimate, SPEND)).toBeNull();
  });

  it('returns null when a cashback cap truncates the value (no proportional trade-off)', () => {
    const card = buildCard({
      annualFee: 5000,
      rewardPointsPolicy: '',
      rewardEarnRules: [],
      cashbackRules: [
        {
          category: 'dining',
          percent: 5,
          capText: 'up to BDT 300 monthly',
          text: '5% cashback on dining.',
        },
      ],
    });
    const estimate = computeCardEstimate(card, { ...SPEND, dining: 50000 });
    expect(estimate.capApplied).toBe(true);
    expect(calculateFeeBreakEvenSpend(card, estimate, { ...SPEND, dining: 50000 })).toBeNull();
  });

  it('returns 0 for free cards and null for unknown fees', () => {
    const free = buildCard({
      annualFee: 0,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: 1,
    });
    const estimate = computeCardEstimate(free, SPEND);
    expect(calculateFeeBreakEvenSpend(free, estimate, SPEND)).toBe(0);

    const unknownFee = buildCard({
      annualFee: null,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: 1,
    });
    const unknownEstimate = computeCardEstimate(unknownFee, SPEND);
    expect(calculateFeeBreakEvenSpend(unknownFee, unknownEstimate, SPEND)).toBeNull();
  });
});

describe('rankCards', () => {
  it('ranks cards with a BDT value above points-only cards and limits results', () => {
    // Value tier: point value stated, fee differs.
    const valuedHigh = buildCard({
      id: 1,
      name: 'Valued High',
      annualFee: 1000,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: 1,
    });
    const valuedLow = buildCard({
      id: 2,
      name: 'Valued Low',
      annualFee: 10000,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: 1,
    });
    // Points-only tier: no stated value → estimated points, no invented BDT.
    const pointsOnly = buildCard({
      id: 3,
      name: 'Points Only',
      annualFee: 0,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: null,
    });

    const ranked = rankCards([pointsOnly, valuedLow, valuedHigh], SPEND);

    expect(ranked.map(r => r.card.name)).toEqual(['Valued High', 'Valued Low', 'Points Only']);
    expect(ranked[0].annualRewardValue).toBeCloseTo(7200);
    expect(ranked[1].annualRewardValue).toBeCloseTo(7200);
    expect(ranked[1].netAnnualValue).toBeCloseTo(-2800);
    expect(ranked[2].annualRewardValue).toBeNull();
    expect(ranked[2].annualPoints).toBeCloseTo(7200);
    expect(ranked[2].netAnnualValue).toBeNull();
  });

  it('ranks a cashback card in the value tier without any point value', () => {
    const cashback = buildCard({
      id: 1,
      name: 'Dining Cashback',
      annualFee: 1000,
      rewardPointsPolicy: '',
      rewardEarnRules: [],
      cashbackRules: [
        { category: 'all', percent: 1, capText: null, text: '1% cashback everywhere.' },
      ],
      rewardPointValueBdt: null,
    });
    const pointsOnly = buildCard({
      id: 2,
      name: 'Points Only',
      annualFee: 0,
      rewardEarnRules: [allRule(1, 50)],
      rewardPointValueBdt: null,
    });

    const ranked = rankCards([pointsOnly, cashback], SPEND);
    expect(ranked.map(r => r.card.name)).toEqual(['Dining Cashback', 'Points Only']);
    // 30,000 × 1% = 300/month → 3,600 − fee 1,000.
    expect(ranked[0].annualRewardValue).toBeCloseTo(3600);
    expect(ranked[0].netAnnualValue).toBeCloseTo(2600);
  });

  it('excludes inactive cards and cards with no reward signal', () => {
    const cards: CreditCard[] = [
      buildCard({ id: 1, name: 'Active', annualFee: 1000, rewardPointValueBdt: 1 }),
      buildCard({ id: 2, name: 'Inactive', annualFee: 0, isActive: false, rewardPointValueBdt: 1 }),
      buildCard({
        id: 3,
        name: 'No Rewards',
        annualFee: 0,
        rewardPointsPolicy: '',
        rewardEarnRules: [],
        cashbackRules: [],
      }),
    ];

    const ranked = rankCards(cards, SPEND);
    expect(ranked.map(r => r.card.name)).toEqual(['Active']);
  });

  it('limits the results to the requested number of cards', () => {
    const cards = [1, 2, 3].map(id =>
      buildCard({
        id,
        annualFee: id * 1000,
        rewardEarnRules: [allRule(1, 50)],
        rewardPointValueBdt: 1,
      })
    );
    expect(rankCards(cards, SPEND, 2)).toHaveLength(2);
  });
});

describe('validateAllocation', () => {
  it('accepts a valid allocation with positive total', () => {
    expect(validateAllocation(SPEND)).toEqual({});
  });

  it('rejects negative values', () => {
    const errors = validateAllocation({ ...SPEND, dining: -100 });
    expect(errors.dining).toBe('Enter a non-negative amount');
  });

  it('rejects an all-zero allocation', () => {
    const errors = validateAllocation({
      dining: 0,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: 0,
    });
    expect(errors.form).toBe('Total monthly spend must be greater than zero');
  });

  it('rejects non-finite values', () => {
    const errors = validateAllocation({ ...SPEND, fuel: NaN });
    expect(errors.fuel).toBe('Enter a non-negative amount');
  });
});

describe('borrowing cost scenario', () => {
  const valuedCard = (overrides: Partial<CreditCard> = {}) =>
    buildCard({
      annualFee: 0,
      rewardEarnRules: [allRule()],
      rewardPointValueBdt: 1,
      ...overrides,
    });

  it('changes the ranking when interest outweighs higher rewards', () => {
    const highReward = valuedCard({ id: 1, interestRateApr: 30 });
    const lowerApr = valuedCard({
      id: 2,
      interestRateApr: 10,
      annualFee: 1000,
    });
    expect(rankCards([highReward, lowerApr], SPEND).map(r => r.card.id)).toEqual([1, 2]);
    const ranked = rankCards([highReward, lowerApr], SPEND, 5, 20000);
    expect(ranked.map(r => r.card.id)).toEqual([2, 1]);
    expect(ranked[0].annualInterest).toBe(2000);
    expect(ranked[0].netAnnualValueAfterInterest).toBe(4200);
    expect(ranked[1].netAnnualValueAfterInterest).toBe(1200);
  });

  it('preserves the existing order and net values when balance is zero', () => {
    const cards = [valuedCard({ id: 1, interestRateApr: null }), valuedCard({ id: 2 })];
    expect(rankCards(cards, SPEND)).toEqual(rankCards(cards, SPEND, 5, 0));
    rankCards(cards, SPEND).forEach(result => {
      expect(result.annualInterest).toBe(0);
      expect(result.netAnnualValueAfterInterest).toBe(result.netAnnualValue);
    });
  });

  it('respects published zero APR and zero annual fee', () => {
    const result = rankCards([valuedCard({ interestRateApr: 0 })], SPEND, 5, 100000)[0];
    expect(result.annualInterest).toBe(0);
    expect(result.netAnnualValueAfterInterest).toBe(7200);
    expect(result.rankable).toBe(true);
  });

  it.each([null, NaN, Infinity, -10])('keeps unavailable or invalid APR %p unrankable', apr => {
    const unknown = valuedCard({ id: 1, interestRateApr: apr });
    const known = valuedCard({ id: 2, annualFee: 20000 });
    const results = rankCards([unknown, known], SPEND, 5, 10000);
    expect(results.map(r => r.card.id)).toEqual([2, 1]);
    expect(results[1].rankable).toBe(false);
    expect(results[1].annualInterest).toBeNull();
    expect(results[1].netAnnualValueAfterInterest).toBeNull();
  });

  it('does not infer free borrowing for an Islamic card without APR', () => {
    const card = valuedCard({ name: 'Islamic Card', interestRateApr: null });
    expect(estimateAnnualInterest(card, 10000)).toBeNull();
    expect(rankCards([card], SPEND, 5, 10000)[0].rankable).toBe(false);
  });

  it('keeps unknown fees and point values unknown after interest', () => {
    expect(
      rankCards([valuedCard({ annualFee: null })], SPEND, 5, 10000)[0].netAnnualValueAfterInterest
    ).toBeNull();
    expect(
      rankCards([valuedCard({ rewardPointValueBdt: null })], SPEND, 5, 10000)[0]
        .netAnnualValueAfterInterest
    ).toBeNull();
  });

  it.each([-1, NaN, Infinity, MAX_AVERAGE_REVOLVING_BALANCE + 1])(
    'rejects invalid balance %p rather than silently changing the scenario',
    balance => {
      expect(validateAverageRevolvingBalance(balance)).not.toBeNull();
      expect(() => estimateAnnualInterest(valuedCard(), balance)).toThrow(RangeError);
      expect(() => rankCards([], SPEND, 5, balance)).toThrow(RangeError);
    }
  );

  it('accepts the bounded balance endpoints', () => {
    expect(validateAverageRevolvingBalance(0)).toBeNull();
    expect(validateAverageRevolvingBalance(MAX_AVERAGE_REVOLVING_BALANCE)).toBeNull();
  });
});
