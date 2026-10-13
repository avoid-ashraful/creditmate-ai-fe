/**
 * Shared localization types for CreditMate AI.
 */

/** Supported UI/content languages. */
export type Language = 'en' | 'bn';

/**
 * Glossary category identifiers. Kept in sync with
 * `src/locales/bn/glossary.json` entries.
 */
export type GlossaryCategory = 'basics' | 'fees' | 'interest' | 'rewards' | 'transactions';

/**
 * A single bilingual glossary entry. English is always present; Bengali is the
 * reviewed translation shown when the language is set to `'bn'`.
 */
export interface GlossaryTerm {
  id: number;
  term_en: string;
  term_bn: string;
  category: GlossaryCategory;
  definition_en: string;
  definition_bn: string;
  /**
   * Optional Gregorian ISO date (`YYYY-MM-DD`) used to demonstrate Bengali
   * calendar rendering. `null` when no date applies to the term.
   */
  bengaliCalendarDate: string | null;
}

/** Category metadata used to render localized filter buttons. */
export interface GlossaryCategoryOption {
  id: GlossaryCategory | 'all';
  label_en: string;
  label_bn: string;
}
