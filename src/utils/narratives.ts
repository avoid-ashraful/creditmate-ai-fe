/**
 * CreditMate AI - Deterministic Rule-Based Comparison Narratives
 *
 * Note: parseRewardRates is imported from rewardCalculator for reward policy parsing.
 */
import { CreditCard } from '../types';

import { parseRewardRates } from './rewardCalculator';
import { summarizeCardText } from './summarizeCardText';

/**
 * Comparison narrative for a single feature between two cards.
 * Top-level `winner` is only set when one card clearly beats the other;
 * `tie` is true when values are meaningfully equal; `unknown` when data is
 * insufficient to form a reliable comparison.
 */
export type ComparisonNarrative = {
  /** Feature key */
  key: string;
  /** Human-readable label */
  label: string;
  /** The primary narrative text */
  text: string;
  /** True if one card clearly outperforms the other */
  winner: 'card1' | 'card2' | null;
  /** True if the values are meaningfully tied / equal */
  tie: boolean;
  /** True if the comparison cannot be made due to missing data */
  unknown: boolean;
};

/**
 * Generate all comparison narratives for a set of cards.
 * Returns narratives sorted by priority (costs first, then benefits, then card info).
 * The first narrative with `winner` set or `tie` true is the "top reliable explanation".
 */
export const generateComparisonNarratives = (cards: CreditCard[]): ComparisonNarrative[] => {
  if (!cards || cards.length === 0) return [];
  if (cards.length === 1) return singleCardNarratives(cards[0]);

  return [
    ...feeNarrative(cards),
    ...aprNarrative(cards),
    ...rewardNarrative(cards),
    ...loungeNarrative(cards),
    ...waiverNarrative(cards),
    ...cardInfoNarrative(cards),
  ];
};

/**
 * Narratives for a single card (used when only one card is in comparison context).
 */
const singleCardNarratives = (card: CreditCard): ComparisonNarrative[] => [
  formatFee(card),
  formatApr(card),
  formatReward(card),
  ...formatLounge(card),
  formatWaiver(card),
];

/**
 * ------------------------
   FEE NARRATIVES
   ------------------------ */

/**
 * Generate fee comparison narratives for multiple cards.
 */
const feeNarrative = (cards: CreditCard[]): ComparisonNarrative[] => {
  const annualFees = cards.map(c => c.annualFee);

  // All null → unknown
  if (annualFees.every(f => f === null)) {
    return [
      {
        key: 'annual-fee',
        label: 'Annual Fee',
        text: 'Annual fee data not available for either card',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All have the same known fee → tie
  const allSame = annualFees.every(f => f === annualFees[0] && f !== null);
  const sameFee = annualFees[0];
  if (allSame && sameFee !== null && sameFee !== undefined) {
    const fee = sameFee;
    return [
      {
        key: 'annual-fee',
        label: 'Annual Fee',
        text: `Both cards have the same annual fee of BDT ${fee.toLocaleString()}`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Some have fees, some don't → mixed
  const hasNull = annualFees.some(f => f === null);
  const knownFees = annualFees.filter((f): f is number => f !== null);

  if (hasNull && knownFees.length > 0) {
    if (cards.length === 2) {
      return [
        {
          key: 'annual-fee',
          label: 'Annual Fee',
          text: 'Annual fee comparison not reliably possible - one card has fee data, the other does not',
          winner: null,
          tie: false,
          unknown: true,
        },
      ];
    }
    // More than 2 cards with mixed null/known
    return [
      {
        key: 'annual-fee',
        label: 'Annual Fee',
        text: 'Annual fee comparison not reliably possible with mixed data',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All known, compare values
  const minFee = Math.min(...knownFees);
  const maxFee = Math.max(...knownFees);

  if (minFee === maxFee) {
    return [
      {
        key: 'annual-fee',
        label: 'Annual Fee',
        text: `All cards have the same annual fee of BDT ${minFee.toLocaleString()}`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Find the card with min fee and card with max fee
  const minFeeCard = cards.find(c => c.annualFee === minFee);
  const maxFeeCard = cards.find(c => c.annualFee === maxFee);
  if (!minFeeCard || !maxFeeCard) return [];

  // If more than one card has the min fee, it's a tie for best
  const minFeeCount = cards.filter(c => c.annualFee === minFee).length;
  const maxFeeCount = cards.filter(c => c.annualFee === maxFee).length;

  if (minFeeCount > 1) {
    return [
      {
        key: 'annual-fee',
        label: 'Annual Fee',
        text: `Multiple cards share the lowest annual fee of BDT ${minFee.toLocaleString()}`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  if (maxFeeCount > 1) {
    return [
      {
        key: 'annual-fee',
        label: 'Annual Fee',
        text: `Multiple cards have the highest annual fee of BDT ${maxFee.toLocaleString()}`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Clear winner (lowest fee)
  return [
    {
      key: 'annual-fee',
      label: 'Annual Fee',
      text: `${minFeeCard.name} has a lower annual fee of BDT ${minFee.toLocaleString()} ${
        maxFeeCard.name !== minFeeCard.name
          ? `than ${maxFeeCard.name}'s BDT ${maxFee.toLocaleString()}`
          : ''
      }`,
      winner: 'card1',
      tie: false,
      unknown: false,
    },
  ];
};

/**
 * ------------------------
   APR NARRATIVES
   ------------------------ */

/**
 * Generate APR comparison narratives for multiple cards.
 */
const aprNarrative = (cards: CreditCard[]): ComparisonNarrative[] => {
  const aprs = cards.map(c => c.interestRateApr);

  // All null → unknown
  if (aprs.every(a => a === null)) {
    return [
      {
        key: 'apr',
        label: 'Interest Rate (APR)',
        text: 'APR data not available for either card',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All have the same known APR → tie
  const allSameApr = aprs.every(a => a === aprs[0] && a !== null);
  const sameApr = aprs[0];
  if (allSameApr && sameApr !== null && sameApr !== undefined) {
    const apr = sameApr;
    return [
      {
        key: 'apr',
        label: 'Interest Rate (APR)',
        text: `Both cards have the same APR of ${apr}%`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Mixed null and known - never claim superiority from absent data
  const hasNull = aprs.some(a => a === null);
  const knownAprs = aprs.filter((a): a is number => a !== null);

  if (hasNull && knownAprs.length > 0) {
    if (cards.length === 2) {
      return [
        {
          key: 'apr',
          label: 'Interest Rate (APR)',
          text: 'APR comparison not reliably possible - one card has APR data, the other does not',
          winner: null,
          tie: false,
          unknown: true,
        },
      ];
    }
    // More than 2 cards with mixed null/known
    return [
      {
        key: 'apr',
        label: 'Interest Rate (APR)',
        text: 'APR comparison not reliably possible with mixed data',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All known, compare values
  const minApr = Math.min(...knownAprs);
  const maxApr = Math.max(...knownAprs);

  if (minApr === maxApr) {
    return [
      {
        key: 'apr',
        label: 'Interest Rate (APR)',
        text: `All cards have the same APR of ${minApr}%`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  const minAprCard = cards.find(c => c.interestRateApr === minApr);
  const maxAprCard = cards.find(c => c.interestRateApr === maxApr);
  if (!minAprCard || !maxAprCard) return [];

  const minAprCount = cards.filter(c => c.interestRateApr === minApr).length;
  const maxAprCount = cards.filter(c => c.interestRateApr === maxApr).length;

  if (minAprCount > 1) {
    return [
      {
        key: 'apr',
        label: 'Interest Rate (APR)',
        text: `Multiple cards share the lowest APR of ${minApr}%`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  if (maxAprCount > 1) {
    return [
      {
        key: 'apr',
        label: 'Interest Rate (APR)',
        text: `Multiple cards have the highest APR of ${maxApr}%`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  return [
    {
      key: 'apr',
      label: 'Interest Rate (APR)',
      text: `${minAprCard.name} has a lower APR of ${minApr}% ${
        maxAprCard.name !== minAprCard.name ? `than ${maxAprCard.name}'s ${maxApr}%` : ''
      }`,
      winner: 'card1',
      tie: false,
      unknown: false,
    },
  ];
};

/**
 * ------------------------
   REWARD NARRATIVES
   ------------------------ */

/**
 * Generate reward comparison narratives.
 */
const rewardNarrative = (cards: CreditCard[]): ComparisonNarrative[] => {
  const policies = cards.map(c => c.rewardPointsPolicy);

  // All empty/null → unknown
  const allEmpty = policies.every(p => !p || p.trim() === '');
  if (allEmpty) {
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: 'Reward policy data not available for either card',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All have the same policy text → tie
  const allSamePolicy = policies.every(
    (p, _i) => p === policies[0] && (p === null || p.trim() !== '')
  );
  const samePolicy = policies[0];
  if (allSamePolicy && samePolicy !== null && samePolicy !== undefined) {
    const policy = samePolicy;
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: `Both cards offer the same reward policy: ${policy}`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Mixed - some have policies, some don't
  const hasPolicy = policies.some(p => p && p.trim() !== '');
  const hasNoPolicy = policies.some(p => !p || p.trim() === '');

  if (hasPolicy && hasNoPolicy) {
    if (cards.length === 2) {
      return [
        {
          key: 'reward-points',
          label: 'Reward Points',
          text: 'Reward comparison not reliably possible - one card has reward policy, the other does not',
          winner: null,
          tie: false,
          unknown: true,
        },
      ];
    }
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: 'Reward comparison not reliably possible with mixed data',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All have policies, compare base earn rates using parseRewardRates
  const rateResults = policies.map(p => parseRewardRates(p || ''));
  const rates = rateResults.map(rates => ({
    base: rates.dining,
    hasBase: rates.dining > 0,
  }));

  const allHaveBase = rates.every(r => r.hasBase);
  if (!allHaveBase) {
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: 'Reward rates could not be parsed reliably for comparison',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // Compare base earn rates (points per BDT 50 spent)
  // Higher base = better earn rate (more points per BDT spent)
  const bases = rates.map(r => r.base);
  const minBase = Math.min(...bases);
  const maxBase = Math.max(...bases);

  if (minBase === maxBase) {
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: `All cards offer the same earn rate: ${minBase} points per BDT 50 spent`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  const minBaseIndex = bases.indexOf(minBase);
  const maxBaseIndex = bases.indexOf(maxBase);
  const minBaseCount = bases.filter(b => b === minBase).length;
  const maxBaseCount = bases.filter(b => b === maxBase).length;

  if (minBaseCount > 1) {
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: `Multiple cards share the best earn rate of ${minBase} points per BDT 50 spent`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  if (maxBaseCount > 1) {
    return [
      {
        key: 'reward-points',
        label: 'Reward Points',
        text: `Multiple cards have the lowest earn rate of ${maxBase} points per BDT 50 spent`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // The card with the higher base rate has the better earn rate
  const winnerIndex = maxBaseIndex; // card with higher rate wins
  const winnerCard = cards[winnerIndex];
  const loserIndex = minBaseIndex;
  const loserCard = cards[loserIndex];

  return [
    {
      key: 'reward-points',
      label: 'Reward Points',
      text: `${winnerCard.name} has a better earn rate of ${maxBase} points per BDT 50 spent ${
        loserCard.name !== winnerCard.name ? `than ${loserCard.name}'s ${minBase} points` : ''
      }`,
      winner: winnerIndex === 0 ? 'card1' : 'card2',
      tie: false,
      unknown: false,
    },
  ];
};

/**
 * ------------------------
   LOUNGE ACCESS NARRATIVES
   ------------------------ */

/**
 * Generate lounge access comparison narratives.
 */
const loungeNarrative = (cards: CreditCard[]): ComparisonNarrative[] => {
  const intlAccess = cards.map(c => c.loungeAccessInternational);
  const domesticAccess = cards.map(c => c.loungeAccessDomestic);

  // International lounge
  const intlNarratives = generateLoungeComparisons('international', intlAccess, cards);
  // Domestic lounge
  const domesticNarratives = generateLoungeComparisons('domestic', domesticAccess, cards);

  return [...intlNarratives, ...domesticNarratives];
};

/**
 * Generate lounge access comparisons for a single type (international/domestic).
 * Uses accessValues array and cards array for naming.
 */
const generateLoungeComparisons = (
  type: 'international' | 'domestic',
  accessValues: (string | null)[],
  cards: CreditCard[]
): ComparisonNarrative[] => {
  const accessCounts: Record<string, number> = {
    unknown: 0,
    none: 0,
    has: 0,
    totalCards: accessValues.length,
  };

  accessValues.forEach(val => {
    if (val === null || val === undefined) {
      accessCounts.unknown += 1;
    } else if (val === '') {
      accessCounts.none += 1;
    } else {
      accessCounts.has += 1;
    }
  });

  // All unknown → unknown narrative
  if (accessCounts.unknown === accessCounts.totalCards) {
    return [
      {
        key: `${type}-lounge`,
        label: type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
        text: `Lounge access data not available for either card`,
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All none → tie (no lounge access)
  if (accessCounts.none === accessCounts.totalCards && accessCounts.none > 0) {
    return [
      {
        key: `${type}-lounge`,
        label: type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
        text: `Neither card includes ${
          type === 'international' ? 'international' : 'domestic'
        } lounge access`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // All have access → check if same
  if (accessCounts.has === accessCounts.totalCards && accessCounts.has > 0) {
    const firstVal = accessValues[0];
    const allSame = accessValues.every(v => v === firstVal);
    if (allSame && firstVal !== null && firstVal !== '') {
      return [
        {
          key: `${type}-lounge`,
          label:
            type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
          text: `Both cards include ${
            type === 'international' ? 'international' : 'domestic'
          } lounge access: ${summarizeCardText(firstVal, true)}`,
          winner: null,
          tie: true,
          unknown: false,
        },
      ];
    }
    // All have access but different amounts - tie
    return [
      {
        key: `${type}-lounge`,
        label: type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
        text: `Both cards include ${
          type === 'international' ? 'international' : 'domestic'
        } lounge access, but amounts differ`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Mixed: some have, some don't - never claim superiority from absent data
  const hasCount = accessCounts.has;
  const noneCount = accessCounts.none;
  const unknownCount = accessCounts.unknown;

  // When mixed access (some have, some don't), return unknown rather than claiming winner
  if (hasCount > 0 && noneCount > 0) {
    return [
      {
        key: `${type}-lounge`,
        label: type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
        text: 'Lounge access comparison not reliably possible - one card has access, the other does not',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  if (cards.length === 2 && hasCount === 1 && noneCount === 1 && unknownCount === 0) {
    const cardWith = accessCounts.has === 1 ? cards[0] : cards[1];
    const cardWithout = cardWith === cards[0] ? cards[1] : cards[0];
    return [
      {
        key: `${type}-lounge`,
        label: type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
        text: `${cardWith.name} includes ${
          type === 'international' ? 'international' : 'domestic'
        } lounge access (${cardWith.loungeAccessInternational || cardWith.loungeAccessDomestic}), ${
          cardWithout.name
        } has no ${type === 'international' ? 'international' : 'domestic'} lounge access`,
        winner: 'card1',
        tie: false,
        unknown: false,
      },
    ];
  }

  return [
    {
      key: `${type}-lounge`,
      label: type === 'international' ? 'International Lounge Access' : 'Domestic Lounge Access',
      text: 'Lounge access comparison not reliably possible with mixed data',
      winner: null,
      tie: false,
      unknown: true,
    },
  ];
};

/**
 * ------------------------
   WAIVER NARRATIVES
   ------------------------ */

/**
 * Generate annual fee waiver comparison narratives.
 */
const waiverNarrative = (cards: CreditCard[]): ComparisonNarrative[] => {
  const waiverPolicies = cards.map(c => c.annualFeeWaiverPolicy);

  // All null → unknown
  const allNull = waiverPolicies.every(p => p === null);
  if (allNull) {
    return [
      {
        key: 'fee-waiver',
        label: 'Annual Fee Waiver',
        text: 'Annual fee waiver policy data not available for either card',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All have the same waiver conditions → tie
  const allSameWaiver = waiverPolicies.every((p, _i) => p === waiverPolicies[0] && p !== null);
  const sameWaiver = waiverPolicies[0];
  if (allSameWaiver && sameWaiver !== null && sameWaiver !== undefined) {
    const policy = sameWaiver;
    const conditions =
      typeof policy === 'object' && policy.conditions
        ? (policy.conditions as string)
        : String(policy);
    return [
      {
        key: 'fee-waiver',
        label: 'Annual Fee Waiver',
        text: `Both cards offer annual fee waivers with similar conditions: ${conditions}`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  // Mixed: some have waivers, some don't
  const hasWaiver = waiverPolicies.some(p => p !== null);
  const hasNoWaiver = waiverPolicies.some(p => p === null);

  if (hasWaiver && hasNoWaiver) {
    if (cards.length === 2) {
      return [
        {
          key: 'fee-waiver',
          label: 'Annual Fee Waiver',
          text: 'Waiver comparison not reliably possible - one card has waiver policy, the other does not',
          winner: null,
          tie: false,
          unknown: true,
        },
      ];
    }
    return [
      {
        key: 'fee-waiver',
        label: 'Annual Fee Waiver',
        text: 'Waiver comparison not reliably possible with mixed data',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // All have waivers, compare thresholds
  const knownThresholds = waiverPolicies
    .map((p, i) => {
      const policy = p as Record<string, unknown> | null;
      if (!policy || typeof policy.spendThreshold !== 'number') return null;
      return { card: cards[i], threshold: policy.spendThreshold };
    })
    .filter((t): t is { card: CreditCard; threshold: number } => t !== null);

  if (knownThresholds.length === 0) {
    // All have waiver policies but no numeric thresholds
    return [
      {
        key: 'fee-waiver',
        label: 'Annual Fee Waiver',
        text: 'All cards have waiver policies, but spend thresholds could not be compared',
        winner: null,
        tie: false,
        unknown: true,
      },
    ];
  }

  // Compare thresholds
  const minThreshold = Math.min(...knownThresholds.map(t => t.threshold));
  const maxThreshold = Math.max(...knownThresholds.map(t => t.threshold));

  const minThresholdCard = knownThresholds.find(t => t.threshold === minThreshold);
  const maxThresholdCard = knownThresholds.find(t => t.threshold === maxThreshold);
  if (!minThresholdCard || !maxThresholdCard) return [];

  const minThresholdIndex = knownThresholds.findIndex(t => t.threshold === minThreshold);
  const winnerIndex = minThresholdIndex; // card with lower threshold wins
  const winnerCard = minThresholdCard.card;

  if (minThreshold === maxThreshold) {
    return [
      {
        key: 'fee-waiver',
        label: 'Annual Fee Waiver',
        text: `All cards have the same annual fee waiver threshold of BDT ${minThreshold.toLocaleString()} per year`,
        winner: null,
        tie: true,
        unknown: false,
      },
    ];
  }

  return [
    {
      key: 'fee-waiver',
      label: 'Annual Fee Waiver',
      text: `${
        winnerCard.name
      } has a lower waiver threshold of BDT ${minThreshold.toLocaleString()} per year ${
        maxThresholdCard.card.name !== winnerCard.name
          ? `than ${maxThresholdCard.card.name}'s BDT ${maxThreshold.toLocaleString()}`
          : ''
      }`,
      winner: winnerIndex === 0 ? 'card1' : 'card2',
      tie: false,
      unknown: false,
    },
  ];
};

/**
 * ------------------------
   CARD INFORMATION NARRATIVES
   ------------------------ */

/**
 * Generate card information comparison narratives (bank, status, etc.)
 */
const cardInfoNarrative = (cards: CreditCard[]): ComparisonNarrative[] => {
  const bankNames = cards.map(c => c.bankName).filter(Boolean);
  const allSameActive = cards.length > 0 && cards.every(c => c.isActive === cards[0].isActive);
  const lastUpdated = cards.map(c => c.lastUpdated).filter((d): d is Date => d !== null);

  const narratives: ComparisonNarrative[] = [];

  // Bank name comparison
  const uniqueBanks = Array.from(new Set(bankNames));
  if (uniqueBanks.length === 1) {
    narratives.push({
      key: 'bank',
      label: 'Bank',
      text: `All cards are from ${uniqueBanks[0]}`,
      winner: null,
      tie: true,
      unknown: false,
    });
  } else if (uniqueBanks.length > 1 && cards.length <= 2) {
    const card1Has = !!cards[0].bankName;
    const card2Has = !!cards[1].bankName;
    if (card1Has !== card2Has) {
      narratives.push({
        key: 'bank',
        label: 'Bank',
        text: `${cards[0].bankName || 'Unknown bank'} vs ${cards[1].bankName || 'Unknown bank'}`,
        winner: card1Has ? 'card1' : 'card2',
        tie: false,
        unknown: false,
      });
    }
  }

  // Active status comparison
  // All cards must have the same isActive status and we must have 2 or fewer cards
  if (cards.length > 0 && cards.length <= 2 && allSameActive) {
    narratives.push({
      key: 'status',
      label: 'Card Status',
      text: `All cards are ${cards[0].isActive ? 'active' : 'inactive'}`,
      winner: null,
      tie: true,
      unknown: false,
    });
  }

  // Last updated comparison
  if (lastUpdated.length > 0 && lastUpdated.every(d => d.getTime() === lastUpdated[0].getTime())) {
    narratives.push({
      key: 'last-updated',
      label: 'Last Updated',
      text: `All cards were last updated on ${lastUpdated[0].toLocaleDateString()}`,
      winner: null,
      tie: true,
      unknown: false,
    });
  }

  return narratives;
};

/**
 * Format annual fee as a narrative component
 */
const formatFee = (card: CreditCard): ComparisonNarrative => ({
  key: 'annual-fee',
  label: 'Annual Fee',
  text:
    card.annualFee === null
      ? 'Annual fee data not available'
      : `Annual fee: BDT ${card.annualFee.toLocaleString()}`,
  winner: null,
  tie: false,
  unknown: card.annualFee === null,
});

/**
 * Format APR as a narrative component
 */
const formatApr = (card: CreditCard): ComparisonNarrative => ({
  key: 'apr',
  label: 'Interest Rate (APR)',
  text: card.interestRateApr === null ? 'APR data not available' : `${card.interestRateApr}% APR`,
  winner: null,
  tie: false,
  unknown: card.interestRateApr === null,
});

/**
 * Format reward points as a narrative component
 */
const formatReward = (card: CreditCard): ComparisonNarrative => ({
  key: 'reward-points',
  label: 'Reward Points',
  text:
    card.rewardPointsPolicy && card.rewardPointsPolicy.trim() !== ''
      ? `Reward policy: ${card.rewardPointsPolicy}`
      : 'Reward policy data not available',
  winner: null,
  tie: false,
  unknown: !card.rewardPointsPolicy || card.rewardPointsPolicy.trim() === '',
});

/**
 * Format lounge access as a narrative component
 */
const formatLounge = (card: CreditCard): ComparisonNarrative[] => {
  const narratives: ComparisonNarrative[] = [];

  if (card.loungeAccessInternational !== null) {
    narratives.push({
      key: 'international-lounge',
      label: 'International Lounge Access',
      text: card.loungeAccessInternational
        ? summarizeCardText(card.loungeAccessInternational, true)
        : 'None',
      winner: null,
      tie: false,
      unknown: false,
    });
  } else {
    narratives.push({
      key: 'international-lounge',
      label: 'International Lounge Access',
      text: 'Data not available',
      winner: null,
      tie: false,
      unknown: true,
    });
  }

  if (card.loungeAccessDomestic !== null) {
    narratives.push({
      key: 'domestic-lounge',
      label: 'Domestic Lounge Access',
      text: card.loungeAccessDomestic ? summarizeCardText(card.loungeAccessDomestic, true) : 'None',
      winner: null,
      tie: false,
      unknown: false,
    });
  } else {
    narratives.push({
      key: 'domestic-lounge',
      label: 'Domestic Lounge Access',
      text: 'Data not available',
      winner: null,
      tie: false,
      unknown: true,
    });
  }

  return narratives;
};

/**
 * Format waiver as a narrative component
 */
const formatWaiver = (card: CreditCard): ComparisonNarrative => ({
  key: 'fee-waiver',
  label: 'Annual Fee Waiver',
  text: card.annualFeeWaiverPolicy ? 'Waiver policy available' : 'No waiver policy data',
  winner: null,
  tie: false,
  unknown: card.annualFeeWaiverPolicy === null,
});

/**
 * Get the top reliable explanation from the narratives list.
 * Priority: winner > tie > first narrative (but never claim superiority from absent data)
 */
export const getTopReliableExplanation = (
  cards: CreditCard[],
  featureKey?: string
): {
  narrative: ComparisonNarrative | null;
  isTie: boolean;
  isUnknown: boolean;
  winner: 'card1' | 'card2' | null;
} => {
  const narratives = generateComparisonNarratives(cards);

  // Filter by feature key if specified
  const featureNarratives = featureKey ? narratives.filter(n => n.key === featureKey) : narratives;

  if (featureNarratives.length === 0) {
    return { narrative: null, isTie: false, isUnknown: false, winner: null };
  }

  // Look for a narrative with a declared winner (only when we have enough data to compare)
  const winnerNarrative = featureNarratives.find(n => n.winner !== null);
  if (winnerNarrative) {
    return {
      narrative: winnerNarrative,
      isTie: false,
      isUnknown: winnerNarrative.unknown,
      winner: winnerNarrative.winner,
    };
  }

  // Look for a tie
  const tieNarrative = featureNarratives.find(n => n.tie && !n.unknown);
  if (tieNarrative) {
    return {
      narrative: tieNarrative,
      isTie: true,
      isUnknown: false,
      winner: null,
    };
  }

  // Fallback: first narrative that's not unknown
  const firstValid = featureNarratives.find(n => !n.unknown);
  if (firstValid) {
    return {
      narrative: firstValid,
      isTie: firstValid.tie,
      isUnknown: false,
      winner: firstValid.winner,
    };
  }

  // All unknown
  return {
    narrative: featureNarratives[0] || null,
    isTie: false,
    isUnknown: true,
    winner: null,
  };
};

/**
 * Get the top narrative text for display on comparison page.
 * Never claims superiority from absent data.
 */
export const getComparisonSummary = (cards: CreditCard[], featureKey?: string): string => {
  const { narrative, isTie, isUnknown } = getTopReliableExplanation(cards, featureKey);

  if (!narrative) return 'No comparison data available';

  if (isUnknown) {
    return narrative.text; // data not available, just state that
  }

  if (isTie) {
    return narrative.text; // tie - no winner claimed
  }

  // Has a winner - only when data supports it
  return narrative.text;
};

const narratives = {
  generateComparisonNarratives,
  getTopReliableExplanation,
  getComparisonSummary,
};

export default narratives;
