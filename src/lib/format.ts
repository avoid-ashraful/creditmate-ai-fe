/**
 * Money formatting for Bangladeshi taka.
 *
 * Digit grouping follows the lakh/crore convention used in Bangladesh and
 * India: the last three digits form the first group and every group to its
 * left has two digits (500000 -> "5,00,000"). The grouping is implemented
 * manually instead of relying on Intl.NumberFormat('en-IN') so the output is
 * identical in every browser, Node version and test environment.
 */

export interface FormatTakaOptions {
  /** Decimal places to render. Defaults to 0. */
  decimals?: 0 | 2;
  /** Prefix the ৳ symbol. Defaults to true. */
  withSymbol?: boolean;
}

/** Group an integer digit string using lakh grouping: "12345678" -> "1,23,45,678". */
export function groupLakhDigits(intPart: string): string {
  if (intPart.length <= 3) {
    return intPart;
  }
  const lastThree = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  const groups: string[] = [];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) {
    groups.unshift(rest);
  }
  return [...groups, lastThree].join(',');
}

/**
 * Format a taka amount: formatTaka(500000) -> "৳5,00,000".
 * Negative amounts put the minus sign before the symbol: "-৳1,200".
 */
export function formatTaka(value: number, options: FormatTakaOptions = {}): string {
  const { decimals = 0, withSymbol = true } = options;
  const sign = value < 0 ? '-' : '';
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const grouped = groupLakhDigits(intPart);
  const number = decimals > 0 && fracPart ? `${grouped}.${fracPart}` : grouped;
  return `${sign}${withSymbol ? '৳' : ''}${number}`;
}

/** Format an estimated range: formatTakaRange(1000, 2500) -> "৳1,000 – ৳2,500". */
export function formatTakaRange(min: number, max: number, options: FormatTakaOptions = {}): string {
  return `${formatTaka(min, options)} \u2013 ${formatTaka(max, options)}`;
}

export default formatTaka;
