import { CreditCard } from '../types';

import {
  calculateAnnualRewardValue,
  calculateFeeBreakEvenSpend,
  calculateNetAnnualValue,
  CategoryAllocation,
  parseRewardRates,
  POINT_VALUE_BDT,
  rankCards,
  validateAllocation,
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

describe('parseRewardRates', () => {
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

describe('calculateAnnualRewardValue', () => {
  it('computes annual reward value from category spend and parsed rates', () => {
    // Base rate 1/50 = 0.02 on every category, total spend 30,000/month.
    // 30,000 × 0.02 = 600 points/month × 12 = 7,200 points/year × BDT 1.
    const value = calculateAnnualRewardValue(buildCard({}), SPEND);
    expect(value).toBeCloseTo(7200 * POINT_VALUE_BDT);
  });

  it('uses boosted rates only for boosted categories', () => {
    const card = buildCard({
      rewardPointsPolicy:
        'Earn 1 point for every BDT 50 spent. Double points on dining and travel.',
    });
    // dining 10,000×0.04 + travel 5,000×0.04 + (8k+4k+3k)×0.02 = 400+200+300 = 900/month × 12
    const value = calculateAnnualRewardValue(card, SPEND);
    expect(value).toBeCloseTo(10800 * POINT_VALUE_BDT);
  });
});

describe('calculateNetAnnualValue', () => {
  it('subtracts the annual fee from the annual reward value', () => {
    const value = calculateNetAnnualValue(buildCard({ annualFee: 5000 }), SPEND);
    expect(value).toBeCloseTo(7200 - 5000);
  });

  it('returns null when the annual fee is unknown', () => {
    expect(calculateNetAnnualValue(buildCard({ annualFee: null }), SPEND)).toBeNull();
  });
});

describe('calculateFeeBreakEvenSpend', () => {
  it('computes the monthly spend needed for rewards to offset the fee', () => {
    // card: 0.02 on all categories, fee 5,000.
    // break-even total monthly = 5000 / (12 × 0.02 × 1)
    const breakEven = calculateFeeBreakEvenSpend(buildCard({}), SPEND);
    expect(breakEven).toBeCloseTo(5000 / (12 * 0.02 * POINT_VALUE_BDT));
  });

  it('scales with the weighted allocation mix', () => {
    const diningHeavy: CategoryAllocation = {
      dining: 29000,
      travel: 250,
      groceries: 250,
      fuel: 250,
      other: 250,
    };
    const boosted = buildCard({
      rewardPointsPolicy:
        'Earn 1 point for every BDT 50 spent. Double points on dining and travel.',
      annualFee: 3600,
    });
    const breakEven = calculateFeeBreakEvenSpend(boosted, diningHeavy);
    expect(breakEven).not.toBeNull();
    // Verify: at break-even total monthly spend distributed like diningHeavy,
    // annual rewards equal the fee.
    const total = 30000;
    const rates = parseRewardRates(boosted.rewardPointsPolicy);
    const weightedRate =
      (diningHeavy.dining / total) * rates.dining +
      (diningHeavy.travel / total) * rates.travel +
      (diningHeavy.groceries / total) * rates.groceries +
      (diningHeavy.fuel / total) * rates.fuel +
      (diningHeavy.other / total) * rates.other;
    expect(breakEven).toBeCloseTo(3600 / (12 * weightedRate * POINT_VALUE_BDT));
  });

  it('returns 0 for free cards and null for unknowable cases', () => {
    expect(calculateFeeBreakEvenSpend(buildCard({ annualFee: 0 }), SPEND)).toBe(0);
    expect(calculateFeeBreakEvenSpend(buildCard({ annualFee: null }), SPEND)).toBeNull();
    const zeroSpend: CategoryAllocation = {
      dining: 0,
      travel: 0,
      groceries: 0,
      fuel: 0,
      other: 0,
    };
    expect(calculateFeeBreakEvenSpend(buildCard({}), zeroSpend)).toBeNull();
    const unparseable = buildCard({ rewardPointsPolicy: 'No numbers here' });
    expect(calculateFeeBreakEvenSpend(unparseable, SPEND)).toBeNull();
  });
});

describe('rankCards', () => {
  it('ranks cards by net annual value descending and limits to 5', () => {
    const cards: CreditCard[] = [
      buildCard({ id: 1, name: 'Low Fee', annualFee: 1000 }),
      buildCard({ id: 2, name: 'High Fee', annualFee: 10000 }),
      buildCard({
        id: 3,
        name: 'Best',
        annualFee: 1000,
        rewardPointsPolicy: 'Earn 1.5 points for every BDT 100 spent.',
      }),
      buildCard({ id: 4, name: 'Free', annualFee: 0 }),
      buildCard({ id: 5, name: 'Mid', annualFee: 4000 }),
      buildCard({ id: 6, name: 'Mediocre', annualFee: 3000 }),
    ];

    const ranked = rankCards(cards, SPEND);

    expect(ranked).toHaveLength(5);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].netAnnualValue).toBeGreaterThanOrEqual(ranked[i].netAnnualValue);
    }
    // 'Best' earns 1.5/100 = 0.015/BDT × 30,000 × 12 = 5,400 − fee 1,000 → not top...
    // 'Free' earns 0.02 × 30,000 × 12 = 7,200 − 0 = 7,200 → highest net value.
    expect(ranked[0].card.name).toBe('Free');
  });

  it('excludes inactive cards and cards with unknown fees', () => {
    const cards: CreditCard[] = [
      buildCard({ id: 1, name: 'Active', annualFee: 1000 }),
      buildCard({ id: 2, name: 'Inactive', annualFee: 0, isActive: false }),
      buildCard({ id: 3, name: 'Unknown fee', annualFee: null }),
    ];

    const ranked = rankCards(cards, SPEND);

    expect(ranked.map(r => r.card.name)).toEqual(['Active']);
  });

  it('excludes cards with unparseable reward policies', () => {
    const cards: CreditCard[] = [
      buildCard({ id: 1, name: 'Parseable', annualFee: 1000 }),
      buildCard({
        id: 2,
        name: 'Unparseable',
        annualFee: 1000,
        rewardPointsPolicy: 'Some opaque policy text',
      }),
      buildCard({ id: 3, name: 'Empty policy', annualFee: 1000, rewardPointsPolicy: '' }),
    ];

    const ranked = rankCards(cards, SPEND);

    expect(ranked.map(r => r.card.name)).toEqual(['Parseable']);
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
