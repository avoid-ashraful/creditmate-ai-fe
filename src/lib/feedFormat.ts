/**
 * Formatting for field-history change values (alerts feed, change cards).
 *
 * Extracted from AlertsPage in Phase 4 so the delta-poster ChangeCard
 * and the feed render stored values identically. Rules: a stored null
 * means the field was not published on that side of the change and is
 * labelled as such — never blanked or zero-filled; rate-band objects
 * keep both ends visible; values are rendered verbatim, never rounded
 * or recomputed.
 */

import type { BankFollowFeedEntry } from '../types/alerts';
import { cardPathFor } from '../utils/sitemap';

/** `annual_fee` -> `Annual fee` — labels only, values stay verbatim. */
export const humaniseField = (fieldName: string): string => {
  const spaced = fieldName.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/**
 * Display names for the history `source` values the feed can carry.
 * The stored value is a machine slug (e.g. the loans history records
 * `bangladesh_bank_chart`); users see the source's real name. Unknown
 * values fall back to the humanised slug, and values that are already
 * human-readable pass through unchanged — the name is never invented,
 * only formatted.
 */
const FEED_SOURCE_NAMES: Record<string, string> = {
  bangladesh_bank_chart: 'Bangladesh Bank chart',
  bangladesh_bank_lending_chart: 'Bangladesh Bank lending chart',
  bangladesh_bank: 'Bangladesh Bank',
  bb_chart: 'Bangladesh Bank chart',
  bank_website: 'Bank website',
  schedule_of_charges: 'Bank schedule of charges',
};

export const feedSourceName = (source: string): string =>
  FEED_SOURCE_NAMES[source] ?? humaniseField(source);

/** Render a stored history value (see the module note for the rules). */
export const formatFeedValue = (
  value: unknown,
  notPublished: string,
  lang: 'en' | 'bn'
): string => {
  if (value === null || value === undefined) return notPublished;
  if (typeof value === 'boolean')
    return value ? (lang === 'bn' ? 'হ্যাঁ' : 'Yes') : lang === 'bn' ? 'না' : 'No';
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (Array.isArray(value)) {
    return value.map(item => formatFeedValue(item, notPublished, lang)).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('rate_min' in record || 'rate_max' in record) {
      return `${record.rate_min ?? '…'}% – ${record.rate_max ?? '…'}%`;
    }
    return Object.entries(record)
      .map(([key, item]) => `${key}: ${formatFeedValue(item, notPublished, lang)}`)
      .join(', ');
  }
  return String(value);
};

/** Detail-page link for a feed entry, using the same key the row uses. */
export const feedEntryHref = (entry: BankFollowFeedEntry): string => {
  if (entry.vertical === 'cards') {
    return cardPathFor(entry.bank_name, entry.product_name) ?? '/cards';
  }
  const base =
    entry.vertical === 'deposits'
      ? '/deposits'
      : entry.vertical === 'loans'
      ? '/loans'
      : '/accounts';
  return `${base}/${entry.product_key}`;
};

/**
 * Direction of a change, only when both sides are plainly numeric.
 * Returns null for everything else — non-numeric changes are described
 * as "changed", never forced into an up/down story.
 */
export const changeDirection = (
  oldValue: unknown,
  newValue: unknown
): 'up' | 'down' | 'flat' | null => {
  const numeric = (value: unknown): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
    if (value && typeof value === 'object' && 'rate_max' in value) {
      return numeric((value as Record<string, unknown>).rate_max);
    }
    return null;
  };
  const before = numeric(oldValue);
  const after = numeric(newValue);
  if (before === null || after === null) return null;
  if (after > before) return 'up';
  if (after < before) return 'down';
  return 'flat';
};
