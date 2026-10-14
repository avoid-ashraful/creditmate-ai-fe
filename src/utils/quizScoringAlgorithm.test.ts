import { CreditCard } from '../types';

import {
  calculateCardScore,
  rankCards,
  encodeQuizResult,
  decodeQuizResult,
} from './quizScoringAlgorithm';

const mockCard = (overrides?: Partial<CreditCard>): CreditCard => ({
  id: 1,
  name: 'Test Card',
  bankName: 'Test Bank',
  annualFee: 5000,
  interestRateApr: 20,
  loungeAccessInternational: '5 visits',
  loungeAccessDomestic: '10 visits',
  cashAdvanceFee: '100',
  latePaymentFee: '500',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: '2x points on all purchases',
  additionalFeatures: [],
  sourceUrl: '',
  isActive: true,
  lastUpdated: null,
  images: [],
  ...overrides,
});

describe('quizScoringAlgorithm', () => {
  describe('calculateCardScore', () => {
    it('scores a card based on quiz answers', () => {
      const card = mockCard();
      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };

      const score = calculateCardScore(card, answers);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    it('higher score for travel card with frequent travel', () => {
      const travelCard = mockCard({
        loungeAccessInternational: '10 visits',
        loungeAccessDomestic: '20 visits',
        rewardPointsPolicy: 'Earn 5x points on travel',
      });

      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };

      const score = calculateCardScore(travelCard, answers);
      expect(score).toBeGreaterThan(100);
    });

    it('scores dining benefits when primaryUse is dining', () => {
      const diningCard = mockCard({
        rewardPointsPolicy: 'Earn 3x points on dining',
      });

      const diningAnswers = {
        monthlySpend: 50000,
        primaryUse: 'dining' as const,
        travelFrequency: 'never' as const,
        feeTolerance: 'low' as const,
        cardTier: 'standard' as const,
      };

      const score = calculateCardScore(diningCard, diningAnswers);
      expect(score).toBeGreaterThan(100);
    });

    it('penalizes high annual fee for no-fee tolerance', () => {
      const feeCard = mockCard({ annualFee: 50000 });
      const noFeeCard = mockCard({ annualFee: 0 });

      const noFeeAnswers = {
        monthlySpend: 50000,
        primaryUse: 'shopping' as const,
        travelFrequency: 'never' as const,
        feeTolerance: 'none' as const,
        cardTier: 'basic' as const,
      };

      const feeScore = calculateCardScore(feeCard, noFeeAnswers);
      const noFeeScore = calculateCardScore(noFeeCard, noFeeAnswers);

      expect(noFeeScore).toBeGreaterThan(feeScore);
    });

    it('scores fee waivers based on spend threshold', () => {
      const waiverCard = mockCard({
        annualFee: 10000,
        annualFeeWaiverPolicy: { spendThreshold: 500000 },
      });

      const highSpendAnswers = {
        monthlySpend: 100000,
        primaryUse: 'shopping' as const,
        travelFrequency: 'never' as const,
        feeTolerance: 'moderate' as const,
        cardTier: 'standard' as const,
      };

      const lowSpendAnswers = {
        monthlySpend: 10000,
        primaryUse: 'shopping' as const,
        travelFrequency: 'never' as const,
        feeTolerance: 'moderate' as const,
        cardTier: 'basic' as const,
      };

      const highScore = calculateCardScore(waiverCard, highSpendAnswers);
      const lowScore = calculateCardScore(waiverCard, lowSpendAnswers);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('rankCards', () => {
    it('ranks cards by score in descending order', () => {
      const travelCard = mockCard({
        id: 1,
        name: 'Travel Card',
        loungeAccessInternational: '10 visits',
        rewardPointsPolicy: 'Earn 5x points on travel',
      });

      const basicCard = mockCard({
        id: 2,
        name: 'Basic Card',
        annualFee: 0,
        loungeAccessInternational: null,
        rewardPointsPolicy: 'Earn 1x point on all',
      });

      const cards = [basicCard, travelCard];
      const answers = {
        monthlySpend: 100000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'high' as const,
        cardTier: 'premium' as const,
      };

      const ranked = rankCards(cards, answers, 2);

      expect(ranked[0].card.id).toBe(1);
      expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    });

    it('respects limit parameter', () => {
      const cards = [
        mockCard({ id: 1 }),
        mockCard({ id: 2 }),
        mockCard({ id: 3 }),
        mockCard({ id: 4 }),
      ];

      const answers = {
        monthlySpend: 50000,
        primaryUse: 'shopping' as const,
        travelFrequency: 'occasional' as const,
        feeTolerance: 'moderate' as const,
        cardTier: 'standard' as const,
      };

      const ranked2 = rankCards(cards, answers, 2);
      expect(ranked2).toHaveLength(2);

      const ranked3 = rankCards(cards, answers, 3);
      expect(ranked3).toHaveLength(3);
    });

    it('filters inactive cards', () => {
      const activeCard = mockCard({ id: 1, isActive: true });
      const inactiveCard = mockCard({ id: 2, isActive: false });

      const cards = [activeCard, inactiveCard];
      const answers = {
        monthlySpend: 50000,
        primaryUse: 'shopping' as const,
        travelFrequency: 'never' as const,
        feeTolerance: 'low' as const,
        cardTier: 'standard' as const,
      };

      const ranked = rankCards(cards, answers, 10);
      expect(ranked).toHaveLength(1);
      expect(ranked[0].card.id).toBe(1);
    });

    it('includes reason for each recommendation', () => {
      const card = mockCard({
        annualFee: 0,
        loungeAccessInternational: '5 visits',
      });

      const answers = {
        monthlySpend: 50000,
        primaryUse: 'travel' as const,
        travelFrequency: 'frequent' as const,
        feeTolerance: 'moderate' as const,
        cardTier: 'standard' as const,
      };

      const ranked = rankCards([card], answers, 1);
      expect(ranked[0].reason).toBeTruthy();
      expect(typeof ranked[0].reason).toBe('string');
      expect(ranked[0].reason.length).toBeGreaterThan(0);
    });
  });

  describe('encodeQuizResult', () => {
    it('encodes result as base64 string', () => {
      const result = {
        cardIds: [1, 2, 3],
        answers: {
          monthlySpend: 100000,
          primaryUse: 'travel' as const,
          travelFrequency: 'frequent' as const,
          feeTolerance: 'high' as const,
          cardTier: 'premium' as const,
        },
      };

      const encoded = encodeQuizResult(result);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      expect(/^[A-Za-z0-9+/=]+$/.test(encoded)).toBe(true);
    });

    it('encodes different results differently', () => {
      const result1 = {
        cardIds: [1],
        answers: {
          monthlySpend: 50000,
          primaryUse: 'travel' as const,
          travelFrequency: 'frequent' as const,
          feeTolerance: 'high' as const,
          cardTier: 'premium' as const,
        },
      };

      const result2 = {
        cardIds: [2],
        answers: {
          monthlySpend: 100000,
          primaryUse: 'dining' as const,
          travelFrequency: 'never' as const,
          feeTolerance: 'none' as const,
          cardTier: 'basic' as const,
        },
      };

      const encoded1 = encodeQuizResult(result1);
      const encoded2 = encodeQuizResult(result2);

      expect(encoded1).not.toBe(encoded2);
    });
  });

  describe('decodeQuizResult', () => {
    it('decodes encoded result back to original', () => {
      const original = {
        cardIds: [1, 2, 3],
        answers: {
          monthlySpend: 100000,
          primaryUse: 'travel' as const,
          travelFrequency: 'frequent' as const,
          feeTolerance: 'high' as const,
          cardTier: 'premium' as const,
        },
      };

      const encoded = encodeQuizResult(original);
      const decoded = decodeQuizResult(encoded);

      expect(decoded).toEqual(original);
    });

    it('returns null for invalid encoded string', () => {
      const decoded = decodeQuizResult('invalid base64!!!');
      expect(decoded).toBeNull();
    });

    it('returns null for empty string', () => {
      const decoded = decodeQuizResult('');
      expect(decoded).toBeNull();
    });

    it('returns null for malformed JSON', () => {
      const invalid = Buffer.from('not valid json').toString('base64');
      const decoded = decodeQuizResult(invalid);
      expect(decoded).toBeNull();
    });

    it('rejects valid JSON with invalid answer fields', () => {
      const encoded = btoa(JSON.stringify({ cardIds: [1], answers: { monthlySpend: -1 } }));
      expect(decodeQuizResult(encoded)).toBeNull();
    });

    it('roundtrips complex answers correctly', () => {
      const original = {
        cardIds: [42, 100, 999],
        answers: {
          monthlySpend: 250000,
          primaryUse: 'cashback' as const,
          travelFrequency: 'occasional' as const,
          feeTolerance: 'moderate' as const,
          cardTier: 'premium' as const,
        },
      };

      const encoded = encodeQuizResult(original);
      const decoded = decodeQuizResult(encoded);

      expect(decoded?.cardIds).toEqual([42, 100, 999]);
      expect(decoded?.answers.monthlySpend).toBe(250000);
      expect(decoded?.answers.primaryUse).toBe('cashback');
      expect(decoded?.answers.travelFrequency).toBe('occasional');
      expect(decoded?.answers.feeTolerance).toBe('moderate');
      expect(decoded?.answers.cardTier).toBe('premium');
    });
  });

  describe('Encoding/Decoding Integration', () => {
    it('quiz results are shareable through URL encoding', () => {
      const answers = {
        monthlySpend: 75000,
        primaryUse: 'shopping' as const,
        travelFrequency: 'occasional' as const,
        feeTolerance: 'low' as const,
        cardTier: 'standard' as const,
      };

      const result = { cardIds: [5, 10], answers };
      const encoded = encodeQuizResult(result);
      const url = `https://example.com/quiz?quiz_result=${encoded}`;

      expect(url).toContain('quiz_result=');

      const extracted = url.split('quiz_result=')[1];
      const decoded = decodeQuizResult(extracted);

      expect(decoded).toEqual(result);
    });

    it('encodes results with URL-safe characters', () => {
      const encoded = encodeQuizResult({
        cardIds: [1],
        answers: {
          monthlySpend: 1000,
          primaryUse: 'shopping',
          travelFrequency: 'never',
          feeTolerance: 'none',
          cardTier: 'basic',
        },
      });
      expect(encoded).not.toMatch(/[+/=]/);
    });
  });
});
