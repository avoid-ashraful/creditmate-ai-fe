/**
 * ResultCard primitive copy (redesign Phase 4 i18n sweep).
 *
 * The Phase 0 primitives shipped with hard-coded English strings; the
 * card's own chrome (disclosure, shortlist toggle, Islamic badge) now
 * comes from here like every other surface. Bengali strings are
 * drafted and need review by a native speaker.
 */

import type { Language } from './types';

export interface ResultCardCopy {
  details: string;
  islamic: string;
  addToShortlist: string;
  inShortlist: string;
}

const en: ResultCardCopy = {
  details: 'Details',
  islamic: 'Islamic',
  addToShortlist: 'Add to shortlist',
  inShortlist: 'In shortlist',
};

const bn: ResultCardCopy = {
  details: 'বিস্তারিত',
  islamic: 'ইসলামিক',
  addToShortlist: 'শর্টলিস্টে যোগ করুন',
  inShortlist: 'শর্টলিস্টে আছে',
};

export const getResultCardCopy = (lang: Language): ResultCardCopy => (lang === 'bn' ? bn : en);

/**
 * The §3.6 unknown-value vocabulary + TrustChip marker labels, shared by
 * the UnknownValue and TrustChip primitives (Phase 4 i18n sweep — these
 * were the primitives' last hard-coded English strings).
 */
export interface VocabularyCopy {
  notPublished: string;
  notApplicable: string;
  unavailable: string;
  derived: string;
  estimatedRange: string;
  changedMarker: string;
}

const vocabularyEn: VocabularyCopy = {
  notPublished: 'Not published',
  notApplicable: 'Not applicable',
  unavailable: 'Unavailable',
  derived: 'Derived',
  estimatedRange: 'Estimated range',
  changedMarker: 'Changed',
};

const vocabularyBn: VocabularyCopy = {
  notPublished: 'প্রকাশিত নয়',
  notApplicable: 'প্রযোজ্য নয়',
  unavailable: 'অনুপলব্ধ',
  derived: 'উদ্ভূত',
  estimatedRange: 'আনুমানিক পরিসর',
  changedMarker: 'বদলেছে',
};

export const getVocabularyCopy = (lang: Language): VocabularyCopy =>
  lang === 'bn' ? vocabularyBn : vocabularyEn;
