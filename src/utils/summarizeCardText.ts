/** Short display copy only. Callers retain the original text for full terms. */
export const summarizeCardText = (text: string, lounge = false): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const shorten = (value: string): string =>
    value.length <= 80
      ? value
      : `${value
          .slice(0, 79)
          .replace(/\s+\S*$/, '')
          .trimEnd()}…`;

  if (lounge) {
    // Only read the opening allowance, never later guest counts or paid visits.
    const opening = normalized.slice(0, 200);
    const countPattern = new RegExp(
      '\\b(?:(max(?:imum)?|up to)\\s+)?(\\d+)\\s+(?:free|complimentary)\\s+' +
        '(?:(?:international|domestic|lounge)\\s+)*(?:visits?|accesses?)\\b',
      'i'
    );
    const count = countPattern.exec(opening);
    if (count) {
      const allowance = normalized.slice(count.index).split(/[;.!?]/)[0];
      const period = /\b(?:per year|a year|annually|annual)\b/i.test(allowance)
        ? '/year'
        : /\bper month\b/i.test(allowance)
        ? '/month'
        : '';
      const prefix = normalized.slice(0, count.index);
      const name = /(?:Complimentary\s+)?Priority Pass|[^;:]*\bLounge(?:\s*\([^)]*\))?/i.exec(
        prefix
      )?.[0];
      return shorten(
        `${name ? `${name.trim()}: ` : ''}${count[1] ? 'Up to ' : ''}${
          count[2]
        } free visits${period}`
      );
    }
  }

  if (normalized.length <= 80) return normalized;
  // A period before a lowercase word or an amount can be an abbreviation (No., TK.).
  const clause = normalized.split(/;\s*|\.\s+(?=[A-Z])|[!?।](?:\s+|$)|,\s+(?!\d)/)[0];
  return shorten(clause.length < normalized.length ? `${clause}…` : clause);
};
