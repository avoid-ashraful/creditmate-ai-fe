import { CreditCard } from '../types';

import {
  generateComparisonNarratives,
  getTopReliableExplanation,
  getComparisonSummary,
  ComparisonNarrative,
} from './narratives';

const buildCard = (overrides: Partial<CreditCard>): CreditCard => ({
  id: 1,
  bankId: 1,
  bankName: 'Test Bank',
  name: 'Test Card',
  annualFee: 5000,
  interestRateApr: 24.5,
  loungeAccessInternational: '6 visits',
  loungeAccessDomestic: '12 visits',
  cashAdvanceFee: '2.5% or BDT 500, whichever is higher',
  latePaymentFee: 'BDT 1000',
  annualFeeWaiverPolicy: {
    spendThreshold: 300000,
    period: 'yearly',
    conditions: 'Must spend BDT 300,000 within the card anniversary year',
  },
  rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent.',
  additionalFeatures: ['Feature 1'],
  sourceUrl: 'https://www.example.com',
  isActive: true,
  lastUpdated: new Date('2025-05-15'),
  images: [],
  ...overrides,
});

describe('narratives - ComparisonNarrative type', () => {
  it('has the expected fields', () => {
    const narrative: ComparisonNarrative = {
      key: 'annual-fee',
      label: 'Annual Fee',
      text: 'Test narrative',
      winner: 'card1',
      tie: false,
      unknown: false,
    };
    expect(narrative.key).toBe('annual-fee');
    expect(narrative.winner).toBe('card1');
    expect(narrative.tie).toBe(false);
    expect(narrative.unknown).toBe(false);
  });
});

describe('narratives - generateComparisonNarratives', () => {
  const cardWithFee = buildCard({ annualFee: 5000 });
  const cardWithoutFee = buildCard({ annualFee: null });
  const cardWithSameFee = buildCard({ annualFee: 5000 });

  it('generates narratives for 2 cards with same annual fee', () => {
    const cards = [cardWithFee, cardWithSameFee];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    // Should have a fee narrative with tie=true
    const feeNarrative = narratives.find(n => n.key === 'annual-fee');
    expect(feeNarrative).toBeDefined();
    expect(feeNarrative?.tie).toBe(true);
    expect(feeNarrative?.winner).toBeNull();
  });

  it('generates narratives for 2 cards with different annual fees', () => {
    const cardHighFee = buildCard({ annualFee: 10000 });
    const cards = [cardWithFee, cardHighFee];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const feeNarrative = narratives.find(n => n.key === 'annual-fee');
    expect(feeNarrative).toBeDefined();
    // The card with lower fee should be the winner
    expect(feeNarrative?.winner).toBe('card1');
    expect(feeNarrative?.tie).toBe(false);
    expect(feeNarrative?.unknown).toBe(false);
  });

  it('generates narratives for 2 cards with null annual fees', () => {
    const cards = [cardWithoutFee, cardWithoutFee];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const feeNarrative = narratives.find(n => n.key === 'annual-fee');
    expect(feeNarrative).toBeDefined();
    expect(feeNarrative?.unknown).toBe(true);
    expect(feeNarrative?.winner).toBeNull();
  });

  it('generates narratives for 2 cards with same APR', () => {
    const cardSameApr = buildCard({ interestRateApr: 24.5 });
    const cards = [cardWithFee, cardSameApr];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const aprNarrative = narratives.find(n => n.key === 'apr');
    expect(aprNarrative).toBeDefined();
    expect(aprNarrative?.tie).toBe(true);
    expect(aprNarrative?.winner).toBeNull();
  });

  it('generates narratives for 2 cards with different APR', () => {
    const cardLowApr = buildCard({ interestRateApr: 18.0 });
    const cards = [cardWithFee, cardLowApr];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const aprNarrative = narratives.find(n => n.key === 'apr');
    expect(aprNarrative).toBeDefined();
    expect(aprNarrative?.winner).toBe('card1'); // lower APR is better
    expect(aprNarrative?.tie).toBe(false);
  });

  it('generates narratives for 2 cards with null APR', () => {
    const cardNoApr = buildCard({ interestRateApr: null });
    const cards = [cardWithFee, cardNoApr];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const aprNarrative = narratives.find(n => n.key === 'apr');
    expect(aprNarrative).toBeDefined();
    expect(aprNarrative?.unknown).toBe(true);
  });

  it('generates narratives for 2 cards with same reward policy', () => {
    const cardSameReward = buildCard({
      rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent.',
    });
    const cards = [cardWithFee, cardSameReward];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const rewardNarrative = narratives.find(n => n.key === 'reward-points');
    expect(rewardNarrative).toBeDefined();
    expect(rewardNarrative?.tie).toBe(true);
  });

  it('generates narratives for 2 cards with different reward earn rates', () => {
    const cardBetterReward = buildCard({
      rewardPointsPolicy: 'Earn 1.5 points for every BDT 100 spent.',
    });
    const cards = [cardWithFee, cardBetterReward];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const rewardNarrative = narratives.find(n => n.key === 'reward-points');
    expect(rewardNarrative).toBeDefined();
    // cardBetterReward should have better rate (0.015 vs 0.02 from "1 per 50" = 0.02... wait)
    // Actually "1 point per BDT 50" = 0.02, "1.5 per BDT 100" = 0.015, so cardWithFee is better
    // Let me use a card with clearly better rate
    const cardBetterReward2 = buildCard({
      rewardPointsPolicy: 'Earn 1 point for every BDT 25 spent.',
    });
    const cards2 = [cardWithFee, cardBetterReward2];
    const narratives2 = generateComparisonNarratives(cards2);
    const rewardNarrative2 = narratives2.find(n => n.key === 'reward-points');
    expect(rewardNarrative2).toBeDefined();
    expect(rewardNarrative2?.winner).toBe('card2'); // 1 per 25 = 0.04 > 0.02
  });

  it('generates narratives for 2 cards with null reward policy', () => {
    const cardNoReward = buildCard({ rewardPointsPolicy: '' });
    const cards = [cardWithFee, cardNoReward];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const rewardNarrative = narratives.find(n => n.key === 'reward-points');
    expect(rewardNarrative).toBeDefined();
    expect(rewardNarrative?.unknown).toBe(true);
  });

  it('generates narratives for 2 cards with same lounge access', () => {
    const cardSameLounge = buildCard({
      loungeAccessInternational: '6 visits',
      loungeAccessDomestic: '12 visits',
    });
    const cards = [cardWithFee, cardSameLounge];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const intlNarrative = narratives.find(n => n.key === 'international-lounge');
    const domesticNarrative = narratives.find(n => n.key === 'domestic-lounge');
    expect(intlNarrative).toBeDefined();
    expect(intlNarrative?.tie).toBe(true);
    expect(domesticNarrative).toBeDefined();
    expect(domesticNarrative?.tie).toBe(true);
  });

  it('generates narratives for 2 cards with no lounge access', () => {
    const cardNoLounge = buildCard({ loungeAccessInternational: '', loungeAccessDomestic: '' });
    const cardNoLounge2 = buildCard({ loungeAccessInternational: '', loungeAccessDomestic: '' });
    const cards = [cardNoLounge, cardNoLounge2];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const intlNarrative = narratives.find(n => n.key === 'international-lounge');
    const domesticNarrative = narratives.find(n => n.key === 'domestic-lounge');
    expect(intlNarrative).toBeDefined();
    expect(intlNarrative?.tie).toBe(true);
    expect(domesticNarrative).toBeDefined();
    expect(domesticNarrative?.tie).toBe(true);
  });

  it('generates narratives for 2 cards with different lounge access', () => {
    const cardWithLounge = buildCard({
      loungeAccessInternational: '8 visits',
      loungeAccessDomestic: '16 visits',
    });
    const cards = [cardWithFee, cardWithLounge];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const intlNarrative = narratives.find(n => n.key === 'international-lounge');
    expect(intlNarrative).toBeDefined();
    // More visits do not establish a reliable winner when both cards have access.
    expect([intlNarrative?.tie, intlNarrative?.winner]).toContain(true);
  });

  it('generates narratives for 2 cards with null lounge access', () => {
    const cardNoLounge = buildCard({ loungeAccessInternational: null, loungeAccessDomestic: null });
    const cards = [cardWithFee, cardNoLounge];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const intlNarrative = narratives.find(n => n.key === 'international-lounge');
    const domesticNarrative = narratives.find(n => n.key === 'domestic-lounge');
    expect(intlNarrative).toBeDefined();
    expect(intlNarrative?.unknown).toBe(true);
    expect(domesticNarrative).toBeDefined();
    expect(domesticNarrative?.unknown).toBe(true);
  });

  it('generates narratives for 2 cards with same waiver policy', () => {
    const cardSameWaiver = buildCard({
      annualFeeWaiverPolicy: {
        spendThreshold: 300000,
        period: 'yearly',
        conditions: 'Must spend BDT 300,000 within the card anniversary year',
      },
    });
    const cards = [cardWithFee, cardSameWaiver];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const waiverNarrative = narratives.find(n => n.key === 'fee-waiver');
    expect(waiverNarrative).toBeDefined();
    expect(waiverNarrative?.tie).toBe(true);
  });

  it('generates narratives for 2 cards with different waiver thresholds', () => {
    const cardLowerThreshold = buildCard({
      annualFeeWaiverPolicy: {
        spendThreshold: 200000,
        period: 'yearly',
        conditions: 'Lower spend threshold',
      },
    });
    const cards = [cardWithFee, cardLowerThreshold];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const waiverNarrative = narratives.find(n => n.key === 'fee-waiver');
    expect(waiverNarrative).toBeDefined();
    // cardLowerThreshold has lower threshold, should be winner
    expect(waiverNarrative?.winner).toBe('card2');
  });

  it('generates narratives for 2 cards with null waiver policy', () => {
    const cardNoWaiver = buildCard({ annualFeeWaiverPolicy: null });
    const cards = [cardWithFee, cardNoWaiver];
    const narratives = generateComparisonNarratives(cards);
    expect(narratives.length).toBeGreaterThan(0);

    const waiverNarrative = narratives.find(n => n.key === 'fee-waiver');
    expect(waiverNarrative).toBeDefined();
    expect(waiverNarrative?.unknown).toBe(true);
  });
});

describe('narratives - getTopReliableExplanation', () => {
  it('returns the top narrative with winner when one card clearly wins', () => {
    const cardLowFee = buildCard({ annualFee: 2000 });
    const cardHighFee = buildCard({ annualFee: 10000 });
    const cards = [cardLowFee, cardHighFee];
    const result = getTopReliableExplanation(cards, 'annual-fee');

    expect(result.narrative).toBeDefined();
    expect(result.winner).toBe('card1'); // card1 has lower fee
    expect(result.isTie).toBe(false);
    expect(result.isUnknown).toBe(false);
  });

  it('returns tie when values are equal', () => {
    const cardSame = buildCard({ annualFee: 5000 });
    const cards = [cardSame, cardSame];
    const result = getTopReliableExplanation(cards, 'annual-fee');

    expect(result.narrative).toBeDefined();
    expect(result.isTie).toBe(true);
    expect(result.winner).toBeNull();
    expect(result.isUnknown).toBe(false);
  });

  it('returns unknown when data is missing', () => {
    const cardNoFee = buildCard({ annualFee: null });
    const cards = [cardNoFee, cardNoFee];
    const result = getTopReliableExplanation(cards, 'annual-fee');

    expect(result.narrative).toBeDefined();
    expect(result.isUnknown).toBe(true);
    expect(result.isTie).toBe(false);
    expect(result.winner).toBeNull();
  });

  it('returns first valid narrative when no winner or tie', () => {
    // Both cards have the same everything - should return tie
    const cardSame = buildCard({});
    const cards = [cardSame, cardSame];
    const result = getTopReliableExplanation(cards);

    expect(result.narrative).toBeDefined();
    expect(result.isTie).toBe(true);
  });

  it('handles single card context', () => {
    const card = buildCard({});
    // A single card reports its own facts without inventing a comparison winner.
    const result = getTopReliableExplanation([card]);
    expect(result.narrative).toBeDefined();
    expect(result.winner).toBeNull();
    expect(result.isUnknown).toBe(false);
  });
});

describe('narratives - getComparisonSummary', () => {
  it('returns narrative text when there is a winner', () => {
    const cardLowFee = buildCard({ annualFee: 2000 });
    const cardHighFee = buildCard({ annualFee: 10000 });
    const cards = [cardLowFee, cardHighFee];
    const summary = getComparisonSummary(cards, 'annual-fee');

    expect(summary).toContain('lower annual fee');
  });

  it('returns tie narrative when values are equal', () => {
    const cardSame = buildCard({ annualFee: 5000 });
    const cards = [cardSame, cardSame];
    const summary = getComparisonSummary(cards, 'annual-fee');

    expect(summary).toContain('same annual fee');
  });

  it('returns "No comparison data available" when no narrative', () => {
    const summary = getComparisonSummary([], 'annual-fee');
    expect(summary).toBe('No comparison data available');
  });

  it('returns data not available when unknown', () => {
    const cardNoFee = buildCard({ annualFee: null });
    const cards = [cardNoFee, cardNoFee];
    const summary = getComparisonSummary(cards, 'annual-fee');

    expect(summary).toContain('not available');
  });
});
