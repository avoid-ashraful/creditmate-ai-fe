/**
 * Pure formatting helpers for Bangladeshi (bn-BD) localization.
 *
 * These helpers are deliberately dependency-free and deterministic so they can
 * run in any JavaScript runtime, whether or not the runtime ships the full
 * `Intl` locale data for Bengali. `Intl` is used when available, but the manual
 * fallbacks keep output byte-for-byte stable across environments.
 */

import type { Language } from './types';

/** Bangla digits indexed by their ASCII counterpart. */
export const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

/** Official currency symbol for the Bangladeshi Taka. */
export const BDT_SYMBOL = '৳';

/** Full Bengali month names, January (index 0) through December (index 11). */
export const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
] as const;

/** Short Bengali month names, aligned with {@link BENGALI_MONTHS}. */
export const BENGALI_MONTHS_SHORT = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্ট',
  'অক্টো',
  'নভে',
  'ডিসে',
] as const;

/**
 * Convert every ASCII digit in a value to its Bangla digit.
 *
 * All other characters (grouping commas, decimal points, signs) are preserved
 * so this can be layered over an already formatted number.
 */
export function toBanglaNumerals(value: number | string): string {
  return String(value).replace(/[0-9]/g, digit => BANGLA_DIGITS[Number(digit)]);
}

/**
 * Group digits using the Indian numbering system used in Bangladesh, e.g.
 * `1234567` -> `12,34,567` and `100000` -> `1,00,000`. This mirrors what
 * `Intl.NumberFormat('bn-BD')` produces.
 */
function groupIndianDigits(integerDigits: string): string {
  if (integerDigits.length <= 3) return integerDigits;
  const lastThree = integerDigits.slice(-3);
  const parts: string[] = [];
  let rest = integerDigits.slice(0, -3);
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return `${parts.join(',')},${lastThree}`;
}

/**
 * Format an amount as Bangladeshi Taka using Bangla digits, e.g.
 * `1500` -> `১,৫০০.০০৳`.
 *
 * Non-finite input is treated as `0`. Negative amounts keep a leading `-`.
 */
export function formatBdtCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const sign = safe < 0 ? '-' : '';
  const [integerPart, decimalPart] = Math.abs(safe).toFixed(2).split('.');
  const numeric = `${sign}${groupIndianDigits(integerPart)}.${decimalPart}`;
  return `${toBanglaNumerals(numeric)}${BDT_SYMBOL}`;
}

/**
 * BDT currency formatting delegated to the runtime's `Intl.NumberFormat`.
 *
 * Throws/falls back to {@link formatBdtCurrency} when `bn-BD` currency data is
 * unavailable, so callers always get a usable string.
 */
export function formatBdtCurrencyIntl(amount: number): string {
  if (!Number.isFinite(amount)) return formatBdtCurrency(amount);
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
      const formatted = new Intl.NumberFormat('bn-BD', {
        style: 'currency',
        currency: 'BDT',
      }).format(amount);
      // Some minimal ICU builds silently fall back to a non-Bengali symbol or
      // emit `NaN৳`; only trust the result when it resembles a real amount.
      if (formatted.includes(BDT_SYMBOL) && !formatted.includes('NaN')) return formatted;
    }
  } catch {
    // fall through to the deterministic fallback
  }
  return formatBdtCurrency(amount);
}

/**
 * Format a date as an unambiguous Gregorian `DD/MM/YYYY` string using local
 * date components (no timezone shifting).
 */
export function formatGregorianDate(date: Date | null): string {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Format a date with Bangla digits in the same `DD/MM/YYYY` order, e.g.
 * `০১/০১/২০২৪`. Note this keeps the Gregorian calendar; the Bengali
 * (Bongabdo) calendar uses a different year numbering and is not applied here.
 */
export function formatBengaliDateNumeric(date: Date | null): string {
  if (!date) return '';
  return toBanglaNumerals(formatGregorianDate(date));
}

/** Full Bengali month name for a zero-based month index (`0` = January). */
export function formatBengaliMonth(monthIndex: number): string {
  return BENGALI_MONTHS[monthIndex] ?? '';
}

/** Short Bengali month name for a zero-based month index (`0` = January). */
export function formatBengaliMonthShort(monthIndex: number): string {
  return BENGALI_MONTHS_SHORT[monthIndex] ?? '';
}

/**
 * Format a date with a short Bengali month name and Bangla digits, e.g.
 * `1 জানু 2024` -> `১ জানু ২০২৪`.
 */
export function formatBengaliDate(date: Date | null): string {
  if (!date) return '';
  const day = toBanglaNumerals(date.getDate());
  const month = formatBengaliMonthShort(date.getMonth());
  const year = toBanglaNumerals(date.getFullYear());
  return `${day} ${month} ${year}`;
}

/** Resolve a UI string for the active language, defaulting to English. */
export function pickLang(lang: Language, english: string, bengali: string): string {
  return lang === 'bn' ? bengali : english;
}
