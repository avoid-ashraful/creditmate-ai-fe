/**
 * Bilingual glossary data and lookup helpers.
 *
 * The source of truth is `src/locales/bn/glossary.json`, which is validated by
 * `glossary.test.ts` to guarantee reviewed Bengali translations (no Arabic,
 * Cyrillic, CJK or mojibake characters) for every entry.
 */

import glossaryData from './bn/glossary.json';
import type { GlossaryCategory, GlossaryCategoryOption, GlossaryTerm, Language } from './types';

/** All reviewed glossary entries. */
export const glossaryTerms = glossaryData.glossary as GlossaryTerm[];

/** Category filter metadata, localized for both languages. */
export const glossaryCategories: GlossaryCategoryOption[] = [
  { id: 'all', label_en: 'All Terms', label_bn: 'সব শব্দ' },
  { id: 'basics', label_en: 'Credit Card Basics', label_bn: 'ক্রেডিট কার্ডের মূল বিষয়' },
  { id: 'fees', label_en: 'Fees & Charges', label_bn: 'ফি ও চার্জ' },
  { id: 'interest', label_en: 'Interest & APR', label_bn: 'সুদ ও এপিআর' },
  { id: 'rewards', label_en: 'Rewards & Benefits', label_bn: 'রিওয়ার্ড ও সুবিধা' },
  { id: 'transactions', label_en: 'Transactions', label_bn: 'লেনদেন' },
];

/** Localized label for a category id (falls back to the raw id). */
export function getCategoryLabel(categoryId: GlossaryCategory | 'all', lang: Language): string {
  const option = glossaryCategories.find(category => category.id === categoryId);
  if (!option) return categoryId;
  return lang === 'bn' ? option.label_bn : option.label_en;
}

/** The term name in the requested language. */
export function getTermText(term: GlossaryTerm, lang: Language): string {
  return lang === 'bn' ? term.term_bn : term.term_en;
}

/** The definition in the requested language. */
export function getDefinitionText(term: GlossaryTerm, lang: Language): string {
  return lang === 'bn' ? term.definition_bn : term.definition_en;
}

/** Find a term by its English name (case-insensitive). */
export function findGlossaryTerm(englishTerm: string): GlossaryTerm | undefined {
  const needle = englishTerm.trim().toLowerCase();
  return glossaryTerms.find(term => term.term_en.toLowerCase() === needle);
}

export interface GlossaryFilter {
  query?: string;
  category?: GlossaryCategory | 'all';
  lang?: Language;
}

/**
 * Filter glossary terms by free-text query and category. The query is matched
 * against both languages so users can search with either script.
 */
export function filterGlossaryTerms(
  terms: GlossaryTerm[],
  { query = '', category = 'all', lang = 'en' }: GlossaryFilter = {}
): GlossaryTerm[] {
  const needle = query.trim().toLowerCase();

  return terms.filter(term => {
    const matchesCategory = category === 'all' || term.category === category;
    if (!matchesCategory) return false;
    if (!needle) return true;

    const haystack = [
      term.term_en,
      term.definition_en,
      term.term_bn,
      term.definition_bn,
      getTermText(term, lang),
      getDefinitionText(term, lang),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
}
