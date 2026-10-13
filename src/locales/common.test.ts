/**
 * Validation and integrity tests for the common bilingual copy.
 */

import { COMMON_COPY, CommonCopy, getCommonCopy } from './common';

const BENGALI_CHARS = /[ঀ-৿]/;

describe('common copy', () => {
  const keys = Object.keys(COMMON_COPY.en) as Array<keyof CommonCopy>;

  it('has the same keys in English and Bengali', () => {
    expect(Object.keys(COMMON_COPY.bn).sort()).toEqual([...keys].sort());
  });

  it('has no empty strings in either language (except allowed)', () => {
    const allowedEmpty = new Set([
      'categoryBadge',
      'comparisonSummaryCount',
      'guidesArticleEyebrow',
      'guidesArticleMetaReadingTime',
      'quizResultScore',
      'quizErrorDetail',
    ]);
    (['en', 'bn'] as const).forEach(lang => {
      const langStringKeys = keys.filter(key => typeof COMMON_COPY[lang][key] === 'string');
      const keysToCheck = langStringKeys.filter(key => !allowedEmpty.has(key));
      keysToCheck.forEach(key => {
        const value = COMMON_COPY[lang][key] as string;
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('keeps Bengali strings in the Bengali block, the danda and basic punctuation', () => {
    const allowedCodes = new Set([
      // Bengali range
      ...Array.from({ length: 0x09ff - 0x0980 + 1 }, (_, i) => 0x0980 + i),
      // Danda
      0x0964,
      0x0965,
      // ZWNJ, ZWJ
      0x200c,
      0x200d,
      // ASCII letters, digits
      ...Array.from({ length: 26 }, (_, i) => 0x0041 + i), // A-Z
      ...Array.from({ length: 26 }, (_, i) => 0x0061 + i), // a-z
      ...Array.from({ length: 10 }, (_, i) => 0x0030 + i), // 0-9
      // Space
      0x0020,
      // Punctuation
      0x002e,
      0x002c,
      0x003a,
      0x003b, // . , : ;
      0x0025, // %
      0x0027,
      0x2019, // ' '
      0x003f,
      0x0021, // ? !
      0x0028,
      0x0029, // ( )
      0x003d, // =
      0x2026, // …
      0x2013, // – (en-dash)
      0x0026, // &
      0x002d,
      0x002f, // - /
      0x0022,
      0x0027, // " '
      0x2190, // ←
      0x2192, // →
      0x03b1, // α (Greek alpha)
      0x005f, // _
      0x26a0, // ⚠ (warning sign)
      0xfe0f, // ️ (variation selector-16)
      0x2705, // ✅ (white heavy check mark)
      0x23f3, // ⏳ (hourglass)
      0x2714, // ✔ (check mark)
      0x2716, // ✖ (cross mark)
      0x1f504, // 🔄 (counter-clockwise arrows)
      0x2713, // ✓ (check mark)
      0x2717, // ✗ (ballot X)
      0x007b,
      0x007d, // { }
      0x002b, // +
      0x0023, // #
      0x1f4e4, // 📤 (outbox tray)
      0x1f440, // 👀 (eyes)
      0x0040, // @
    ]);

    const bnStringKeys = keys.filter(key => typeof COMMON_COPY.bn[key] === 'string');
    bnStringKeys.forEach(key => {
      const value = COMMON_COPY.bn[key] as string;
      const disallowed = [...value].filter(ch => !allowedCodes.has(ch.codePointAt(0)));
      expect(disallowed.length).toBe(0);
    });
  });

  it('keeps English strings free of Bengali characters (except currency symbol)', () => {
    const enStringKeys = keys.filter(key => typeof COMMON_COPY.en[key] === 'string');
    enStringKeys.forEach(key => {
      const value = COMMON_COPY.en[key] as string;
      const withoutCurrency = value.replace(/৳/g, '');
      expect(withoutCurrency).not.toMatch(BENGALI_CHARS);
    });
  });

  it('returns the copy for the requested language', () => {
    expect(getCommonCopy('bn')).toBe(COMMON_COPY.bn);
    expect(getCommonCopy('en')).toBe(COMMON_COPY.en);
  });

  it('contains no Arabic/Cyrillic/CJK characters in Bengali strings', () => {
    const SCRIPT_NAMES: Array<[string, RegExp]> = [
      ['Arabic', /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/],
      ['Cyrillic', /[\u0400-\u04FF]/],
      [
        'CJK/Hangul/Kana',
        /[\u3040-\u30FF\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/,
      ],
    ];

    const MOJIBAKE_PATTERNS = /(Ã|Â|â€|à¦|à§|à¤|à¥|Ã£|Ã¢|Â¦|Â§|Ã©|Ã¼|Ã±|ã|¤|¦|§|¥)/u;

    const bnStringKeys = keys.filter(key => typeof COMMON_COPY.bn[key] === 'string');
    bnStringKeys.forEach(key => {
      const value = COMMON_COPY.bn[key] as string;
      const scriptHits = SCRIPT_NAMES.filter(([, pattern]) => pattern.test(value)).map(
        ([name]) => name
      );
      expect(scriptHits).toEqual([]);
      expect(value).not.toMatch(MOJIBAKE_PATTERNS);
    });
  });

  it('contains at least one Bengali letter or mark in most Bengali fields', () => {
    const hasBengali = /[\u0980-\u09FF]/;
    const allowedNoBengali = new Set([
      'themeLight',
      'themeDark',
      'skeletonLoading',
      'loading',
      'error',
      'unknown',
      'experimentCardSampleMet',
      'experimentCardSampleNotMet',
      'experimentCardStatusHarm',
      'experimentCardStatusSignificant',
      'experimentCardStatusRunning',
      'experimentCardStatusCollecting',
      'experimentCardHarmWarning',
      'experimentCardConfigYes',
      'experimentCardConfigNo',
      'comparisonShareSuccess',
      'comparisonShareError',
      'quizShareButton',
      'quizSeeAllButton',
      'quizRetakeButton',
      'quizShareSuccess',
      'quizShareError',
      'quizResultRank',
      'calcExportCompare',
      'contactEmailValue',
      'glossarySearchAriaLabel',
      'categoryBadge',
      'comparisonSummaryCount',
      'guidesArticleEyebrow',
      'guidesArticleMetaReadingTime',
      'quizResultScore',
      'quizErrorDetail',
    ]);
    const bnStringKeys = keys.filter(key => typeof COMMON_COPY.bn[key] === 'string');
    const keysNeedingBengali = bnStringKeys.filter(key => !allowedNoBengali.has(key));
    keysNeedingBengali.forEach(key => {
      const value = COMMON_COPY.bn[key] as string;
      expect(value).toMatch(hasBengali);
    });
  });
});
