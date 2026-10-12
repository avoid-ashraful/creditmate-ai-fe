import { CreditCard } from '../types';

export interface QuizAnswers {
  monthlySpend: number;
  primaryUse: 'travel' | 'dining' | 'shopping' | 'cashback' | 'premium';
  travelFrequency: 'frequent' | 'occasional' | 'never';
  feeTolerance: 'none' | 'low' | 'moderate' | 'high';
  cardTier: 'basic' | 'standard' | 'premium';
}

interface ScoringWeights {
  annualFee: number;
  rewardPoints: number;
  loungeAccess: number;
  primaryUseMatch: number;
  feeWaiver: number;
}

const BASE_SCORE = 100;

// Weights for different quiz answers
const WEIGHT_CONFIGURATIONS: Record<string, ScoringWeights> = {
  travel_frequent: {
    annualFee: 0.15,
    rewardPoints: 0.2,
    loungeAccess: 0.35,
    primaryUseMatch: 0.2,
    feeWaiver: 0.1,
  },
  travel_occasional: {
    annualFee: 0.2,
    rewardPoints: 0.25,
    loungeAccess: 0.25,
    primaryUseMatch: 0.15,
    feeWaiver: 0.15,
  },
  travel_never: {
    annualFee: 0.35,
    rewardPoints: 0.3,
    loungeAccess: 0.05,
    primaryUseMatch: 0.15,
    feeWaiver: 0.15,
  },
  dining_frequent: {
    annualFee: 0.2,
    rewardPoints: 0.35,
    loungeAccess: 0.15,
    primaryUseMatch: 0.2,
    feeWaiver: 0.1,
  },
  default: {
    annualFee: 0.25,
    rewardPoints: 0.25,
    loungeAccess: 0.15,
    primaryUseMatch: 0.2,
    feeWaiver: 0.15,
  },
};

const PRIMARY_USE_KEYS = {
  travel: 'travel',
  dining: 'dining',
  shopping: 'shopping',
  cashback: 'cashback',
  premium: 'premium',
} as const;

const getWeights = (answers: QuizAnswers): ScoringWeights => {
  const key = `${answers.primaryUse}_${answers.travelFrequency}`;
  return WEIGHT_CONFIGURATIONS[key] || WEIGHT_CONFIGURATIONS.default;
};

const scoreAnnualFee = (fee: number | null, monthlySpend: number, tolerance: string): number => {
  if (fee === null || fee === 0) return 100;

  const canWaiveFee = fee < 10000 && monthlySpend > 50000;

  switch (tolerance) {
    case 'none':
      return fee === 0 ? 100 : Math.max(0, 100 - fee / 100);
    case 'low':
      return Math.max(0, canWaiveFee ? 95 : 100 - fee / 200);
    case 'moderate':
      return Math.max(0, 100 - fee / 300);
    case 'high':
      return Math.max(0, 100 - fee / 500);
    default:
      return 100 - fee / 300;
  }
};

const scoreRewardPoints = (pointsPolicy: string, primaryUse: string): number => {
  const policy = pointsPolicy.toLowerCase();

  const usageBoosts: Record<string, string[]> = {
    [PRIMARY_USE_KEYS.travel]: ['travel', 'flight', 'hotel', 'booking.com', 'airbnb'],
    [PRIMARY_USE_KEYS.dining]: ['dining', 'restaurant', 'food', 'cafe'],
    [PRIMARY_USE_KEYS.shopping]: ['shopping', 'retail', 'e-commerce', 'general'],
    [PRIMARY_USE_KEYS.cashback]: ['cashback', 'cash back', 'return'],
  };

  let score = 80;

  if (policy.includes('1 point') || policy.includes('1point')) {
    score = 75;
  } else if (policy.includes('2') || policy.includes('double')) {
    score = 85;
  } else if (policy.includes('5x') || policy.includes('5 x')) {
    score = 95;
  }

  // Boost if policy matches primary use
  const relevantTerms = usageBoosts[primaryUse] || [];
  if (relevantTerms.some(term => policy.includes(term))) {
    score = Math.min(100, score + 10);
  }

  return score;
};

const scoreLounge = (
  international: string | null,
  domestic: string | null,
  travelFrequency: string
): number => {
  if (travelFrequency === 'never') {
    return international || domestic ? 30 : 50;
  }

  let score = 0;

  // Parse lounge visit counts if available
  const internationalVisits = international ? parseInt(international) : 0;
  const domesticVisits = domestic ? parseInt(domestic) : 0;

  if (travelFrequency === 'frequent') {
    if (internationalVisits >= 6) score += 40;
    else if (internationalVisits >= 2) score += 25;
    else score += 10;

    if (domesticVisits >= 12) score += 30;
    else if (domesticVisits >= 6) score += 20;
    else score += 10;
  } else {
    // occasional
    if (internationalVisits >= 2) score += 30;
    else if (internationalVisits > 0) score += 15;
    else score += 5;

    if (domesticVisits >= 6) score += 20;
    else if (domesticVisits >= 2) score += 15;
    else score += 5;
  }

  return Math.min(100, score);
};

const scorePrimaryUse = (card: CreditCard, primaryUse: string): number => {
  const allText = `${card.name} ${card.rewardPointsPolicy} ${card.additionalFeatures.join(
    ' '
  )}`.toLowerCase();

  const useMatches: Record<string, string[]> = {
    [PRIMARY_USE_KEYS.travel]: ['travel', 'flight', 'hotel', 'lounge', 'airport', 'visa'],
    [PRIMARY_USE_KEYS.dining]: ['dining', 'restaurant', 'food', 'cafe', 'mastercard'],
    [PRIMARY_USE_KEYS.shopping]: ['shopping', 'retail', 'points', 'reward'],
    [PRIMARY_USE_KEYS.cashback]: ['cashback', 'cash back', 'return', 'bonus'],
    [PRIMARY_USE_KEYS.premium]: ['premium', 'platinum', 'exclusive', 'vip'],
  };

  const terms = useMatches[primaryUse] || [];
  const matches = terms.filter(term => allText.includes(term)).length;

  return Math.min(100, 60 + matches * 10);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const scoreFeeWaiver = (policy: Record<string, any> | null, monthlySpend: number): number => {
  if (!policy) return 0;

  const threshold = policy.spendThreshold || policy.spend_threshold || Infinity;

  if (monthlySpend * 12 > threshold) {
    return 100;
  }

  if (monthlySpend * 12 > threshold * 0.7) {
    return 70;
  }

  if (monthlySpend * 12 > threshold * 0.4) {
    return 40;
  }

  return 0;
};

export const calculateCardScore = (card: CreditCard, answers: QuizAnswers): number => {
  const weights = getWeights(answers);

  const feeScore = scoreAnnualFee(card.annualFee, answers.monthlySpend, answers.feeTolerance);
  const rewardScore = scoreRewardPoints(card.rewardPointsPolicy, answers.primaryUse);
  const loungeScore = scoreLounge(
    card.loungeAccessInternational,
    card.loungeAccessDomestic,
    answers.travelFrequency
  );
  const useScore = scorePrimaryUse(card, answers.primaryUse);
  const waiverScore = scoreFeeWaiver(card.annualFeeWaiverPolicy, answers.monthlySpend);

  const totalScore =
    BASE_SCORE +
    feeScore * weights.annualFee +
    rewardScore * weights.rewardPoints +
    loungeScore * weights.loungeAccess +
    useScore * weights.primaryUseMatch +
    waiverScore * weights.feeWaiver;

  const fee = card.annualFee;
  const premiumBenefits = Boolean(card.loungeAccessInternational || card.loungeAccessDomestic);
  let tierScore = 50;
  if (fee !== null && answers.cardTier === 'basic') {
    tierScore = fee <= 5000 ? 100 : 40;
  } else if (fee !== null && answers.cardTier === 'standard') {
    tierScore = fee > 0 && fee <= 10000 ? 100 : 60;
  } else if (fee !== null && answers.cardTier === 'premium') {
    tierScore = fee >= 10000 || premiumBenefits ? 100 : 50;
  }
  return Math.round(totalScore + tierScore * 0.1);
};

export const rankCards = (
  cards: CreditCard[],
  answers: QuizAnswers,
  limit = 3
): Array<{ card: CreditCard; score: number; reason: string }> => {
  const scored = cards
    .filter(card => card.isActive)
    .map(card => ({
      card,
      score: calculateCardScore(card, answers),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ card, score }) => ({
    card,
    score,
    reason: generateRecommendationReason(card, answers),
  }));
};

const generateRecommendationReason = (card: CreditCard, answers: QuizAnswers): string => {
  const reasons: string[] = [];

  // Annual fee reason
  if (card.annualFee === null || card.annualFee === 0) {
    reasons.push('No annual fee');
  } else if (answers.feeTolerance === 'high' && card.annualFeeWaiverPolicy) {
    reasons.push('Achievable fee waiver with your spending');
  }

  // Primary use reason
  if (answers.primaryUse === 'travel' && card.loungeAccessInternational) {
    reasons.push(`${card.loungeAccessInternational} international lounge visits`);
  } else if (answers.primaryUse === 'dining' && card.rewardPointsPolicy.includes('dining')) {
    reasons.push('Bonus rewards on dining');
  }

  // Lounge access for frequent travelers
  if (
    answers.travelFrequency === 'frequent' &&
    (card.loungeAccessInternational || card.loungeAccessDomestic)
  ) {
    reasons.push('Great lounge access benefits');
  }

  // Reward points
  if (!reasons.includes('Bonus rewards on dining')) {
    reasons.push('Competitive rewards program');
  }

  return reasons.slice(0, 2).join('. ') || 'Recommended for your profile';
};

export const encodeQuizResult = (result: { cardIds: number[]; answers: QuizAnswers }): string => {
  const data = JSON.stringify(result);
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

export const decodeQuizResult = (
  encoded: string
): {
  cardIds: number[];
  answers: QuizAnswers;
} | null => {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const data = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
    const parsed = JSON.parse(data);
    const answers = parsed?.answers;
    if (
      !Array.isArray(parsed?.cardIds) ||
      !parsed.cardIds.every((id: unknown) => Number.isInteger(id)) ||
      !Number.isFinite(answers?.monthlySpend) ||
      answers.monthlySpend < 0 ||
      !['travel', 'dining', 'shopping', 'cashback', 'premium'].includes(answers?.primaryUse) ||
      !['frequent', 'occasional', 'never'].includes(answers?.travelFrequency) ||
      !['none', 'low', 'moderate', 'high'].includes(answers?.feeTolerance) ||
      !['basic', 'standard', 'premium'].includes(answers?.cardTier)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
