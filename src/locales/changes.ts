/**
 * What-changed copy (redesign Phase 4, D4 + recent.design addendum B1/B2).
 *
 * One vocabulary for change surfaces: the delta-poster change cards on
 * Home and in the alerts feed, the shortlist change badge, and rate
 * history sparklines. Deltas are described in neutral words — a rise is
 * never coloured or worded as good or bad; direction + date carry it.
 * Bengali strings are drafted and need review by a native speaker.
 */

import type { Language } from './types';

export interface ChangesCopy {
  newBadge: string;
  increased: string;
  decreased: string;
  changed: string;
  feeChanged: string;
  rateChanged: string;
  /** Template: {field} — for fields without a dedicated label. */
  fieldChanged: string;
  homeChangedHeading: string;
  homeChangedIntro: string;
  homeChangedViewAll: string;
  /** Template: {tenure} — e.g. "Rate history (6–12 months)". */
  historyBandLabel: string;
  /** Template: {min} {max}. */
  bandRange: string;
  /** Template: {min} — open-ended band. */
  bandOpen: string;
  /** Template: {count} — Learn card metric for the cards guide. */
  learnMetricCards: string;
  /** Template: {count} — Learn card metric for the deposits guide. */
  learnMetricDeposits: string;
  /** Templates: {count} loans from {lenders} lenders — loan guide metric. */
  learnMetricLoans: string;
  learnMetricSource: string;
}

const en: ChangesCopy = {
  newBadge: 'New',
  increased: 'increased',
  decreased: 'decreased',
  changed: 'changed',
  feeChanged: 'Fee changed',
  rateChanged: 'Rate changed',
  fieldChanged: '{field} changed',
  homeChangedHeading: 'What changed at your banks',
  homeChangedIntro: 'Recorded changes at the banks you follow, newest first.',
  homeChangedViewAll: 'See all changes',
  historyBandLabel: 'Rate history ({tenure})',
  bandRange: '{min}–{max} months',
  bandOpen: '{min}+ months',
  learnMetricCards: '{count} cards compared',
  learnMetricDeposits: '{count} deposit products tracked',
  learnMetricLoans: '{count} loans from {lenders} lenders',
  learnMetricSource: 'CreditMate catalogue',
};

const bn: ChangesCopy = {
  newBadge: 'নতুন',
  increased: 'বেড়েছে',
  decreased: 'কমেছে',
  changed: 'পরিবর্তিত হয়েছে',
  feeChanged: 'ফি বদলেছে',
  rateChanged: 'হার বদলেছে',
  fieldChanged: '{field} বদলেছে',
  homeChangedHeading: 'আপনার ব্যাংকগুলোতে যা বদলেছে',
  homeChangedIntro: 'আপনি ফলো করেন এমন ব্যাংকগুলোর রেকর্ড করা পরিবর্তন, নতুনগুলো আগে।',
  homeChangedViewAll: 'সব পরিবর্তন দেখুন',
  historyBandLabel: 'হারের ইতিহাস ({tenure})',
  bandRange: '{min}–{max} মাস',
  bandOpen: '{min}+ মাস',
  learnMetricCards: '{count}টি কার্ড তুলনা করা হয়েছে',
  learnMetricDeposits: '{count}টি আমানত পণ্য ট্র্যাক করা হয়েছে',
  learnMetricLoans: '{lenders} ঋণদাতার {count}টি ঋণ',
  learnMetricSource: 'CreditMate ক্যাটালগ',
};

export const getChangesCopy = (lang: Language): ChangesCopy => (lang === 'bn' ? bn : en);

/**
 * The short factual label for a shortlist change badge ("Fee changed",
 * "Rate changed", or the generic "Details changed"), chosen from the
 * recorded field name — the badge always pairs it with the change date.
 */
export const describeFieldChange = (fieldName: string, copy: ChangesCopy): string => {
  if (fieldName.includes('fee') || fieldName.includes('charge')) return copy.feeChanged;
  if (fieldName.includes('rate')) return copy.rateChanged;
  return copy.fieldChanged;
};
