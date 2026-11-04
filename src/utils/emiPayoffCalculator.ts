/**
 * Pure EMI and balance-payoff calculations (Feature 6).
 *
 * Both tools use the APR the user picked — either a real card's published
 * `interestRateApr` or a custom rate they typed. Nothing here invents a rate:
 * cards that publish no APR (e.g. Islamic cards, whose cost follows the
 * bank's profit-rate terms) are handled by the page, which asks for a custom
 * rate instead of ever treating a missing APR as 0%.
 *
 * Money is returned rounded to 2 decimals (BDT paisa). Internally the
 * amortisation runs at full precision so the rounded headline numbers are
 * the standard textbook values (e.g. BDT 100,000 at 12% APR for 12 months
 * gives the well-known EMI of BDT 8,884.88).
 */

/** Round to 2 decimals, BDT style. */
export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export interface EmiInput {
  /** Purchase amount in BDT (> 0). */
  principal: number;
  /** Annual percentage rate, e.g. 25 means 25% (> = 0). */
  aprPercent: number;
  /** Tenure in months (integer > 0). */
  months: number;
}

/** One calendar-year slice of an amortisation schedule. */
export interface YearSummary {
  year: number;
  principalPaid: number;
  interestPaid: number;
  /** Balance left at the end of that year. */
  closingBalance: number;
}

export interface EmiResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  /** Per-year principal/interest split (one row per year of the tenure). */
  yearlyBreakdown: YearSummary[];
}

/**
 * Standard amortising EMI: with monthly rate r = APR/100/12,
 *   EMI = P · r · (1+r)^n / ((1+r)^n − 1),  and P/n when r = 0.
 *
 * The totals come from simulating that EMI month by month (the final month
 * pays only the remaining balance + interest, so totals are exact rather
 * than EMI × n approximations). Returns null for invalid input.
 */
export const calculateEmi = (input: EmiInput): EmiResult | null => {
  const { principal, aprPercent, months } = input;
  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(aprPercent) || aprPercent < 0) return null;
  if (!Number.isInteger(months) || months <= 0) return null;

  const monthlyRate = aprPercent / 100 / 12;
  const monthlyEmi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  let totalInterest = 0;
  const yearlyBreakdown: YearSummary[] = [];
  for (let month = 1; month <= months; month += 1) {
    const interest = balance * monthlyRate;
    const isFinalMonth = month === months;
    const principalPaid = isFinalMonth ? balance : monthlyEmi - interest;
    balance = isFinalMonth ? 0 : balance - principalPaid;
    totalInterest += interest;

    const yearIndex = Math.floor((month - 1) / 12);
    if (!yearlyBreakdown[yearIndex]) {
      yearlyBreakdown[yearIndex] = {
        year: yearIndex + 1,
        principalPaid: 0,
        interestPaid: 0,
        closingBalance: 0,
      };
    }
    yearlyBreakdown[yearIndex].principalPaid += principalPaid;
    yearlyBreakdown[yearIndex].interestPaid += interest;
    yearlyBreakdown[yearIndex].closingBalance = Math.max(balance, 0);
  }

  return {
    monthlyEmi: round2(monthlyEmi),
    totalInterest: round2(totalInterest),
    totalPayable: round2(principal + totalInterest),
    yearlyBreakdown: yearlyBreakdown.map(row => ({
      year: row.year,
      principalPaid: round2(row.principalPaid),
      interestPaid: round2(row.interestPaid),
      closingBalance: round2(row.closingBalance),
    })),
  };
};

export interface PayoffInput {
  /** Current outstanding balance in BDT (> 0). */
  balance: number;
  /** Annual percentage rate, e.g. 25 means 25% (>= 0). */
  aprPercent: number;
  /** Fixed monthly payment in BDT (> 0). */
  monthlyPayment: number;
}

export type PayoffResult =
  | {
      clears: true;
      /** Months until the balance reaches zero. */
      months: number;
      totalInterest: number;
      totalPaid: number;
      /** The last month's payment (usually smaller than the monthly payment). */
      finalPayment: number;
      yearlyBreakdown: YearSummary[];
    }
  | {
      clears: false;
      /** Interest charged in the first month — the payment never beats this. */
      firstMonthInterest: number;
    };

/** Safety bound so a pathological input can never loop forever (100 years). */
const MAX_PAYOFF_MONTHS = 1200;

/**
 * Simulate paying a fixed monthly payment against a balance at APR.
 *
 * Honest edge case: if the payment is <= the first month's interest, the
 * balance never falls, so the result is `clears: false` with the first
 * month's interest for the warning — never an infinite loop or a fake
 * month count. Returns null for invalid input.
 */
export const calculatePayoff = (input: PayoffInput): PayoffResult | null => {
  const { balance, aprPercent, monthlyPayment } = input;
  if (!Number.isFinite(balance) || balance <= 0) return null;
  if (!Number.isFinite(aprPercent) || aprPercent < 0) return null;
  if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) return null;

  const monthlyRate = aprPercent / 100 / 12;
  const firstMonthInterest = balance * monthlyRate;
  if (monthlyRate > 0 && monthlyPayment <= firstMonthInterest) {
    return { clears: false, firstMonthInterest: round2(firstMonthInterest) };
  }

  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  let finalPayment = monthlyPayment;
  const yearlyBreakdown: YearSummary[] = [];
  while (remaining > 0 && months < MAX_PAYOFF_MONTHS) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    let principalPaid: number;
    if (monthlyPayment - interest >= remaining) {
      principalPaid = remaining;
      finalPayment = remaining + interest;
      remaining = 0;
    } else {
      principalPaid = monthlyPayment - interest;
      remaining -= principalPaid;
    }
    months += 1;

    const yearIndex = Math.floor((months - 1) / 12);
    if (!yearlyBreakdown[yearIndex]) {
      yearlyBreakdown[yearIndex] = {
        year: yearIndex + 1,
        principalPaid: 0,
        interestPaid: 0,
        closingBalance: 0,
      };
    }
    yearlyBreakdown[yearIndex].principalPaid += principalPaid;
    yearlyBreakdown[yearIndex].interestPaid += interest;
    yearlyBreakdown[yearIndex].closingBalance = Math.max(remaining, 0);
  }

  if (remaining > 0) {
    // Payment beats the interest but by so little that clearing would take
    // over a century — report it with the never-clears shape rather than a
    // meaningless month count.
    return { clears: false, firstMonthInterest: round2(firstMonthInterest) };
  }

  return {
    clears: true,
    months,
    totalInterest: round2(totalInterest),
    totalPaid: round2(balance + totalInterest),
    finalPayment: round2(finalPayment),
    yearlyBreakdown: yearlyBreakdown.map(row => ({
      year: row.year,
      principalPaid: round2(row.principalPaid),
      interestPaid: round2(row.interestPaid),
      closingBalance: round2(row.closingBalance),
    })),
  };
};

/** Common EMI tenures offered in Bangladesh, for quick-pick buttons. */
export const COMMON_EMI_TENURES: number[] = [3, 6, 12, 18, 24, 36];
