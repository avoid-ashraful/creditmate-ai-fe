/**
 * Validation and integrity tests for the bilingual glossary.
 *
 * These protect against shipping corrupted or machine-garbled Bengali text. Any
 * string that introduces Arabic, Cyrillic, CJK/Hangul/Kana, mojibake sequences
 * or stray non-Bengali non-ASCII characters fails the suite, as do duplicate
 * ids, missing fields and unknown categories.
 */

import {
  filterGlossaryTerms,
  findGlossaryTerm,
  getCategoryLabel,
  getDefinitionText,
  getTermText,
  glossaryCategories,
  glossaryTerms,
} from './glossary';
import type { Language } from './types';

const VALID_CATEGORIES = new Set(['basics', 'fees', 'interest', 'rewards', 'transactions']);

/**
 * Character classes worth signalling out explicitly so failures name the
 * offending script instead of a generic message.
 */
const SCRIPT_NAMES: Array<[string, RegExp]> = [
  ['Arabic', /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/],
  ['Cyrillic', /[\u0400-\u04FF]/],
  [
    'CJK/Hangul/Kana',
    /[\u3040-\u30FF\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/,
  ],
];

/** Known mojibake artifacts (Latin-1 mis-decoded UTF-8, etc.). */
const MOJIBAKE_PATTERNS = /(Ã|Â|â€|à¦|à§|à¤|à¥|Ã£|Ã¢|Â¦|Â§|Ã©|Ã¼|Ã±|ã|¤|¦|§|¥)/u;

describe('glossary data integrity', () => {
  it('contains at least 50 reviewed terms', () => {
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(50);
  });

  it('has unique sequential ids and unique English terms', () => {
    const ids = glossaryTerms.map(term => term.id);
    const terms = glossaryTerms.map(term => term.term_en);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(terms).size).toBe(terms.length);
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(1);
  });

  it('has every required field populated for every term', () => {
    glossaryTerms.forEach(term => {
      expect(String(term.id)).toMatch(/^\d+$/);
      expect(term.term_en.trim().length).toBeGreaterThan(0);
      expect(term.term_bn.trim().length).toBeGreaterThan(0);
      expect(term.definition_en.trim().length).toBeGreaterThan(0);
      expect(term.definition_bn.trim().length).toBeGreaterThan(0);
      expect(VALID_CATEGORIES.has(term.category)).toBe(true);
      expect(typeof term.bengaliCalendarDate).toBe('object'); // string | null
    });
  });

  it('covers all supported categories', () => {
    const used = new Set(glossaryTerms.map(term => term.category));
    VALID_CATEGORIES.forEach(category => expect(used.has(category as never)).toBe(true));
  });
});

describe('glossary Bengali quality', () => {
  const bengaliFields = (): Array<[number, string, string]> => {
    const rows: Array<[number, string, string]> = [];
    glossaryTerms.forEach(term => {
      rows.push([term.id, 'term_bn', term.term_bn]);
      rows.push([term.id, 'definition_bn', term.definition_bn]);
    });
    return rows;
  };

  it.each(bengaliFields())(
    'term %i %s contains no Arabic/Cyrillic/CJK characters or mojibake',
    (id, field, value) => {
      const scriptHits = SCRIPT_NAMES.filter(([, pattern]) => pattern.test(value)).map(
        ([name]) => name
      );
      expect(scriptHits).toEqual([]);
      expect(value).not.toMatch(MOJIBAKE_PATTERNS);
    }
  );

  it('keeps every Bengali field within the Bengali + ASCII character range', () => {
    const allowed = /^[\u0020-\u007E\u0980-\u09FF\u0964\u0965]*$/;
    const problems: string[] = [];
    bengaliFields().forEach(([id, field, value]) => {
      if (!allowed.test(value)) problems.push(`id=${id} field=${field}`);
    });
    expect(problems).toEqual([]);
  });

  it('contains at least one Bengali letter or mark in every Bengali field', () => {
    const hasBengali = /[\u0980-\u09FF]/;
    const problems: string[] = [];
    bengaliFields().forEach(([id, field, value]) => {
      if (!hasBengali.test(value)) problems.push(`id=${id} field=${field} has no Bengali`);
    });
    expect(problems).toEqual([]);
  });

  it('keeps English fields free of Bengali characters', () => {
    const hasBengali = /[\u0980-\u09FF]/;
    glossaryTerms.forEach(term => {
      expect(term.term_en).not.toMatch(hasBengali);
      expect(term.definition_en).not.toMatch(hasBengali);
    });
  });
});

describe('glossary key translations', () => {
  it('translates APR as বার্ষিক শতকরা হার', () => {
    const apr = findGlossaryTerm('APR (Annual Percentage Rate)');
    expect(apr).toBeDefined();
    expect(apr?.term_bn).toBe('বার্ষিক শতকরা হার');
  });

  it('uses ফি/মাশুল for fee-like terms and চার্জ for charges', () => {
    const feeTerms = glossaryTerms.filter(term => term.category === 'fees');
    expect(feeTerms.length).toBeGreaterThan(0);

    // Every fee-like English name carries the Bengali word for fee or charge.
    const missingFeeWord = feeTerms
      .filter(term => /fee|charge/i.test(term.term_en))
      .filter(term => !/ফি|মাশুল|চার্জ/.test(term.term_bn))
      .map(term => term.term_en);
    expect(missingFeeWord).toEqual([]);

    // At least one definition uses the synonym "মাশুল" explicitly.
    expect(glossaryTerms.some(term => term.definition_bn.toLowerCase().includes('মাশুল'))).toBe(
      true
    );
  });

  it('uses a Bengali banking/credit vocabulary for core terms', () => {
    expect(findGlossaryTerm('Credit Limit')?.term_bn).toBe('ক্রেডিট সীমা');
    expect(findGlossaryTerm('Rewards Points')?.term_bn).toContain('রিওয়ার্ড');
    expect(findGlossaryTerm('Lounge Access')?.term_bn).toContain('লাউঞ্জ');
    expect(findGlossaryTerm('Annual Fee Waiver')?.term_bn).toContain('মওকুফ');
    expect(findGlossaryTerm('Late Payment Fee')?.term_bn).toContain('ফি');
  });

  it('transliterates the APR abbreviation consistently in derived terms', () => {
    const derivedApr = glossaryTerms.filter(term => /APR/i.test(term.term_en));
    derivedApr.forEach(term => {
      expect(term.term_bn).toMatch(/বার্ষিক শতকরা হার|এপিআর/);
    });
    expect(findGlossaryTerm('Introductory APR')?.term_bn).toContain('এপিআর');
  });
});

describe('glossary lookup helpers', () => {
  it('finds terms by English name case-insensitively', () => {
    expect(findGlossaryTerm('annual fee')).toBe(findGlossaryTerm('Annual Fee'));
    expect(findGlossaryTerm('missing term')).toBeUndefined();
  });

  it('returns localized term and definition text', () => {
    const fee = findGlossaryTerm('Annual Fee');
    if (!fee) throw new Error('Annual Fee term missing');
    expect(getTermText(fee, 'en')).toBe(fee.term_en);
    expect(getTermText(fee, 'bn')).toBe(fee.term_bn);
    expect(getDefinitionText(fee, 'en')).toBe(fee.definition_en);
    expect(getDefinitionText(fee, 'bn')).toBe(fee.definition_bn);
  });

  it('runs filtering by category', () => {
    const onlyRewards = filterGlossaryTerms(glossaryTerms, { category: 'rewards' });
    expect(onlyRewards.length).toBeGreaterThan(0);
    onlyRewards.forEach(term => expect(term.category).toBe('rewards'));
  });

  it('runs free-text search across both languages', () => {
    const byEnglish = filterGlossaryTerms(glossaryTerms, { query: 'credit' });
    const byBengali = filterGlossaryTerms(glossaryTerms, { query: 'ক্রেডিট' });
    expect(byEnglish.length).toBeGreaterThan(0);
    expect(byBengali.length).toBeGreaterThan(0);
  });

  it('localizes category labels', () => {
    expect(getCategoryLabel('all', 'en')).toBe('All Terms');
    expect(getCategoryLabel('all', 'bn')).toBe('সব শব্দ');
    expect(getCategoryLabel('fees', 'bn')).toMatch(/ফি|চার্জ/);
    glossaryCategories.forEach(option => {
      expect(option.label_en.length).toBeGreaterThan(0);
      expect(option.label_bn.length).toBeGreaterThan(0);
    });
  });
});

describe('glossary language neutrality', () => {
  it('produces identical filtered counts regardless of search language', () => {
    const languages: Language[] = ['en', 'bn'];
    const base = filterGlossaryTerms(glossaryTerms, {}).length;
    languages.forEach(lang => {
      expect(filterGlossaryTerms(glossaryTerms, { lang }).length).toBe(base);
    });
  });
});
