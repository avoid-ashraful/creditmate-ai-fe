/**
 * UI copy for the CreditMate Score (card tiles and the card detail
 * breakdown). Bengali strings are drafted and need review by a native
 * speaker before release.
 *
 * The score is computed by the backend from published card data only
 * (see the Methodology page). Bands are tuned to the score distribution
 * of the current catalogue (scores run roughly 2.7-7.5 of 10), so
 * "Excellent" is rare by design.
 */

import type { Language } from './types';

export type ScoreBand = 'excellent' | 'good' | 'fair' | 'basic';

export const scoreBand = (score: number): ScoreBand => {
  if (score >= 7) return 'excellent';
  if (score >= 6) return 'good';
  if (score >= 5) return 'fair';
  return 'basic';
};

export interface ScoreCopy {
  badgeLabel: string;
  bands: Record<ScoreBand, string>;
  detailHeading: string;
  detailIntro: string;
  methodologyLink: string;
  /** Placeholders: {points}, {max} */
  pointsOf: string;
  componentLabels: Record<string, string>;
}

const SCORE_COPY: Record<Language, ScoreCopy> = {
  en: {
    badgeLabel: 'CreditMate Score',
    bands: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      basic: 'Basic',
    },
    detailHeading: 'CreditMate Score',
    detailIntro:
      'One score out of 10, computed only from this card’s published data — fees, APR, rewards, lounge access and how complete and verified the record is. It is not a credit score and says nothing about whether a bank will approve you.',
    methodologyLink: 'How the CreditMate Score works',
    pointsOf: '{points} of {max}',
    componentLabels: {
      annual_cost: 'Annual cost',
      interest: 'Interest (APR)',
      rewards: 'Rewards value',
      perks: 'Perks & lounge access',
      data_confidence: 'Data confidence',
    },
  },
  bn: {
    badgeLabel: 'CreditMate স্কোর',
    bands: {
      excellent: 'চমৎকার',
      good: 'ভালো',
      fair: 'মোটামুটি',
      basic: 'সাধারণ',
    },
    detailHeading: 'CreditMate স্কোর',
    detailIntro:
      '১০-এর মধ্যে একটি স্কোর, যা শুধু এই কার্ডের প্রকাশিত তথ্য থেকে হিসাব করা হয় — ফি, এপিআর, রিওয়ার্ড, লাউঞ্জ সুবিধা এবং তথ্য কতটা সম্পূর্ণ ও যাচাইকৃত। এটি কোনো ক্রেডিট স্কোর নয় এবং ব্যাংক আপনাকে অনুমোদন দেবে কি না তা বলে না।',
    methodologyLink: 'CreditMate স্কোর কীভাবে কাজ করে',
    pointsOf: '{max}-এর মধ্যে {points}',
    componentLabels: {
      annual_cost: 'বার্ষিক খরচ',
      interest: 'সুদ (এপিআর)',
      rewards: 'রিওয়ার্ড মূল্য',
      perks: 'সুবিধা ও লাউঞ্জ',
      data_confidence: 'তথ্যের নির্ভরযোগ্যতা',
    },
  },
};

export const getScoreCopy = (lang: Language): ScoreCopy => SCORE_COPY[lang];
