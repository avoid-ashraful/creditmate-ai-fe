/**
 * Turns a bank's free-form annual fee waiver policy into readable "Label: value" lines
 * so the card page never prints raw JSON.
 */

export interface FeeWaiverLabels {
  /** Known policy keys (e.g. conditions, spendThreshold, period) mapped to display labels. */
  keys: Record<string, string>;
  /** Known string values (e.g. yearly, monthly) mapped to display text. */
  values: Record<string, string>;
  yes: string;
  no: string;
  currency: string;
}

const humanize = (key: string): string => {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const isMoneyKey = (key: string): boolean => /threshold|spend|amount|fee/i.test(key);

const formatValue = (key: string, value: unknown, labels: FeeWaiverLabels): string | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? labels.yes : labels.no;
  if (typeof value === 'number') {
    const text = value.toLocaleString('en-US');
    return isMoneyKey(key) ? `${labels.currency} ${text}` : text;
  }
  if (typeof value === 'string') return labels.values[value.toLowerCase()] ?? value;
  if (Array.isArray(value)) {
    const parts = value
      .map(item => formatValue(key, item, labels))
      .filter((part): part is string => part !== null);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
};

/**
 * Returns one line per populated field. Nested objects are flattened as
 * "Parent - Child: value"; empty values are dropped.
 */
export const describeFeeWaiverPolicy = (
  policy: Record<string, unknown> | null | undefined,
  labels: FeeWaiverLabels,
  prefix = ''
): string[] => {
  if (!policy || typeof policy !== 'object') return [];
  const lines: string[] = [];
  Object.entries(policy).forEach(([key, value]) => {
    const label = `${prefix}${labels.keys[key] ?? humanize(key)}`;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      lines.push(
        ...describeFeeWaiverPolicy(value as Record<string, unknown>, labels, `${label} - `)
      );
      return;
    }
    const text = formatValue(key, value, labels);
    if (text !== null) lines.push(`${label}: ${text}`);
  });
  return lines;
};
