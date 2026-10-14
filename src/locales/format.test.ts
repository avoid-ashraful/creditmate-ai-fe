/**
 * Focused tests for BDT currency formatting and Gregorian/Bengali calendar
 * behaviour. Heavy lifting lives in `format.ts`; these tests pin down exact
 * output for core cases and the documented fallback semantics.
 */

import {
  BDT_SYMBOL,
  BENGALI_MONTHS,
  BENGALI_MONTHS_SHORT,
  formatBdtCurrency,
  formatBdtCurrencyIntl,
  formatBengaliDate,
  formatBengaliDateNumeric,
  formatBengaliMonth,
  formatBengaliMonthShort,
  formatGregorianDate,
  toBanglaNumerals,
} from './format';

describe('toBanglaNumerals', () => {
  it('maps ASCII digits to Bangla digits', () => {
    expect(toBanglaNumerals('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
    expect(toBanglaNumerals(2024)).toBe('২০২৪');
  });

  it('preserves separators and signs', () => {
    expect(toBanglaNumerals('1,500.25')).toBe('১,৫০০.২৫');
    expect(toBanglaNumerals('-42')).toBe('-৪২');
  });
});

describe('formatBdtCurrency', () => {
  it('formats integer amounts with thousands separators', () => {
    expect(formatBdtCurrency(1500)).toBe('১,৫০০.০০৳');
    expect(formatBdtCurrency(0)).toBe('০.০০৳');
    expect(formatBdtCurrency(100000)).toBe('১,০০,০০০.০০৳');
  });

  it('formats decimals with two fixed places', () => {
    expect(formatBdtCurrency(250.5)).toBe('২৫০.৫০৳');
    expect(formatBdtCurrency(1.05)).toBe('১.০৫৳');
  });

  it('handles negative amounts', () => {
    expect(formatBdtCurrency(-1500)).toBe('-১,৫০০.০০৳');
  });

  it('treats non-finite input as zero', () => {
    expect(formatBdtCurrency(Number.NaN)).toBe('০.০০৳');
    expect(formatBdtCurrency(Number.POSITIVE_INFINITY)).toBe('০.০০৳');
  });
});

describe('formatBdtCurrencyIntl', () => {
  it('returns a Taka-prefixed/suffixed string with Bangla digits when Intl supports bn-BD', () => {
    const output = formatBdtCurrencyIntl(1500);
    expect(output).toContain(BDT_SYMBOL);
    expect(output).toMatch(/১/);
  });

  it('never throws and falls back to the deterministic formatter', () => {
    expect(formatBdtCurrencyIntl(Number.NaN)).toBe('০.০০৳');
  });
});

describe('formatGregorianDate', () => {
  it('formats as DD/MM/YYYY using local date components', () => {
    expect(formatGregorianDate(new Date(2024, 0, 1))).toBe('01/01/2024');
    expect(formatGregorianDate(new Date(2024, 11, 31))).toBe('31/12/2024');
  });

  it('returns an empty string for null', () => {
    expect(formatGregorianDate(null)).toBe('');
  });
});

describe('Gregorian vs Bengali calendar behaviour', () => {
  it('formats the same instant with Bangla digits but keeps the Gregorian year', () => {
    const date = new Date(2024, 0, 1);
    expect(formatBengaliDateNumeric(date)).toBe('০১/০১/২০২৪');
    // The Bengali calendar (Bongabdo) uses a different year; we must not
    // silently claim Bongabdo year numbering.
    expect(formatBengaliDateNumeric(date)).not.toBe('০১/০১/১৪৩০');
  });

  it('renders a short Bengali month name with Bangla digits', () => {
    expect(formatBengaliDate(new Date(2024, 0, 1))).toBe('১ জানু ২০২৪');
    expect(formatBengaliDate(new Date(2024, 11, 31))).toBe('৩১ ডিসে ২০২৪');
  });

  it('exposes all twelve Bengali month names', () => {
    expect(BENGALI_MONTHS).toHaveLength(12);
    expect(BENGALI_MONTHS_SHORT).toHaveLength(12);
    expect(formatBengaliMonth(0)).toBe('জানুয়ারি');
    expect(formatBengaliMonth(5)).toBe('জুন');
    expect(formatBengaliMonthShort(11)).toBe('ডিসে');
  });

  it('returns empty text for invalid month indexes', () => {
    expect(formatBengaliMonth(12)).toBe('');
    expect(formatBengaliMonthShort(-1)).toBe('');
  });

  it('returns an empty string for null dates', () => {
    expect(formatBengaliDateNumeric(null)).toBe('');
    expect(formatBengaliDate(null)).toBe('');
  });
});
