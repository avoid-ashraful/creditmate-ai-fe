/**
 * Pure FD (fixed deposit) and DPS maturity calculations.
 *
 * These mirror the backend's `deposits/maturity.py` exactly — same
 * formulas, same conventions — so a number computed here matches the
 * scenario endpoint's ranking figure for the same inputs:
 *
 * - FDR: interest compounds per the product's terms (monthly / quarterly /
 *   annual); where a bank publishes no compounding, annual compounding is
 *   used and the UI says so. `at_maturity` products pay simple interest.
 * - DPS: instalments are paid at the start of each month and compound
 *   monthly (annuity-due). This convention reproduces DBBL's published
 *   Deposit Plus maturity table to the taka at its 9.50% scheme rate.
 * - Source tax is applied to the interest only, at the dated rate the
 *   caller passes in (10% with TIN / 15% without for bank deposits;
 *   Sanchayapatra follows its own rule — the deposits page gets those
 *   numbers from the backend scenario endpoint).
 */

import { round2 } from './emiPayoffCalculator';

export type DepositCompounding = 'monthly' | 'quarterly' | 'annual' | 'at_maturity';

const PERIODS_PER_YEAR: Record<Exclude<DepositCompounding, 'at_maturity'>, number> = {
  monthly: 12,
  quarterly: 4,
  annual: 1,
};

/** Gross maturity of a lump-sum fixed deposit. Null for invalid input. */
export const fdrMaturity = (
  amount: number,
  ratePercent: number,
  months: number,
  compounding: DepositCompounding
): number | null => {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(ratePercent) || ratePercent < 0) return null;
  if (!Number.isInteger(months) || months <= 0) return null;
  const rate = ratePercent / 100;
  if (compounding === 'at_maturity') {
    return round2(amount * (1 + (rate * months) / 12));
  }
  const periods = PERIODS_PER_YEAR[compounding];
  return round2(amount * Math.pow(1 + rate / periods, (periods * months) / 12));
};

/**
 * Gross maturity of a monthly DPS (annuity-due, monthly compounding):
 * each instalment is paid at the start of the month. Null for invalid input.
 */
export const dpsMaturity = (
  monthlyInstalment: number,
  ratePercent: number,
  months: number
): number | null => {
  if (!Number.isFinite(monthlyInstalment) || monthlyInstalment <= 0) return null;
  if (!Number.isFinite(ratePercent) || ratePercent < 0) return null;
  if (!Number.isInteger(months) || months <= 0) return null;
  const monthlyRate = ratePercent / 100 / 12;
  if (monthlyRate === 0) return round2(monthlyInstalment * months);
  const factor = Math.pow(1 + monthlyRate, months);
  return round2(monthlyInstalment * ((factor - 1) / monthlyRate) * (1 + monthlyRate));
};

/**
 * Goal-seek: the monthly instalment needed to reach a target maturity
 * (the inverse of dpsMaturity). Null for invalid input.
 */
export const dpsInstalmentForTarget = (
  target: number,
  ratePercent: number,
  months: number
): number | null => {
  if (!Number.isFinite(target) || target <= 0) return null;
  if (!Number.isFinite(ratePercent) || ratePercent < 0) return null;
  if (!Number.isInteger(months) || months <= 0) return null;
  const monthlyRate = ratePercent / 100 / 12;
  if (monthlyRate === 0) return round2(target / months);
  const factor = Math.pow(1 + monthlyRate, months);
  return round2(target / (((factor - 1) / monthlyRate) * (1 + monthlyRate)));
};

export interface NetMaturity {
  grossMaturity: number;
  interestEarned: number;
  sourceTax: number;
  netMaturity: number;
}

/** Apply source tax on the interest portion of a gross maturity value. */
export const netOfTax = (
  grossMaturity: number,
  totalContributed: number,
  taxRatePercent: number
): NetMaturity => {
  const interestEarned = round2(grossMaturity - totalContributed);
  const sourceTax = round2(Math.max(interestEarned, 0) * (taxRatePercent / 100));
  return {
    grossMaturity: round2(grossMaturity),
    interestEarned,
    sourceTax,
    netMaturity: round2(grossMaturity - sourceTax),
  };
};

/** Standard bank-deposit source tax on interest: 10% with TIN, 15% without. */
export const bankSourceTaxPercent = (hasTin: boolean): number => (hasTin ? 10 : 15);

/** Minimal rate-row shape needed for picking (mirrors services' DepositRate). */
export interface DepositRateLike {
  tenureMonthsMin: number;
  tenureMonthsMax: number;
  tenureIsOpenEnded: boolean;
  amountMin: number;
  amountMax: number | null;
  rateMin: number;
  rateMax: number;
}

/**
 * The published rate row covering a tenure/amount — mirrors the backend's
 * pick_rate_row: among covering rows, the narrowest tenure span wins,
 * then the narrowest amount span. Returns null when nothing covers it
 * (the UI then asks for a custom rate instead of inventing one).
 */
export const pickDepositRate = (
  rates: DepositRateLike[],
  months: number,
  amount: number
): DepositRateLike | null => {
  const covering = rates.filter(rate => {
    const tenureOk = rate.tenureIsOpenEnded
      ? months >= rate.tenureMonthsMin
      : months >= rate.tenureMonthsMin && months <= rate.tenureMonthsMax;
    const amountOk =
      amount >= rate.amountMin && (rate.amountMax === null || amount <= rate.amountMax);
    return tenureOk && amountOk;
  });
  if (covering.length === 0) return null;
  const tenureSpan = (rate: DepositRateLike): number =>
    rate.tenureIsOpenEnded ? Number.MAX_SAFE_INTEGER : rate.tenureMonthsMax - rate.tenureMonthsMin;
  const amountSpan = (rate: DepositRateLike): number =>
    rate.amountMax === null ? Number.MAX_SAFE_INTEGER : rate.amountMax - rate.amountMin;
  return [...covering].sort(
    (a, b) => tenureSpan(a) - tenureSpan(b) || amountSpan(a) - amountSpan(b)
  )[0];
};
