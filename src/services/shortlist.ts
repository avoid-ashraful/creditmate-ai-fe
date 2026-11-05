/**
 * Server-backed shortlist client (redesign Phase 3, Section 4.7).
 *
 * Mirrors the backend serializers in saved/serializers.py exactly. The
 * wire shape is the ShortlistProvider's own item shape plus the fields the
 * client needs to rebuild detail links: `card_id` for cards (compare
 * links) and `slug` for the other verticals (detail links). `bank_name`
 * is the display institution name (institution/lender display names for
 * deposits/loans, the bank's name for cards/accounts).
 *
 * Vocabulary note: the wire verticals are the backend's plural enum
 * values ('cards', 'deposits', 'loans', 'accounts') — the same strings
 * the provider speaks, pinned by services/shortlist.test.ts against the
 * real API contract. (An earlier singular mapping here silently broke
 * every add/import; the backend rejected 'card' as an unknown vertical.)
 */

import type { ShortlistItem, ShortlistVertical } from '../hooks/ShortlistProvider';
import { cardPathFor } from '../utils/sitemap';

import { authClient } from './auth';

export type ApiShortlistVertical = ShortlistVertical;

const TO_API: Record<ShortlistVertical, ApiShortlistVertical> = {
  cards: 'cards',
  deposits: 'deposits',
  loans: 'loans',
  accounts: 'accounts',
};

const FROM_API: Record<ApiShortlistVertical, ShortlistVertical> = {
  cards: 'cards',
  deposits: 'deposits',
  loans: 'loans',
  accounts: 'accounts',
};

export interface ServerShortlistItem {
  id: number;
  vertical: ApiShortlistVertical;
  key: string;
  name: string;
  bank_name: string;
  card_id: number | null;
  slug: string | null;
  /** Newest recorded field change for the product (Phase 4, D4), or null. */
  latest_change: { field_name: string; changed_at: string } | null;
  created: string;
}

export interface ShortlistImportResult {
  imported: number;
  skipped: number;
  results: ServerShortlistItem[];
}

const base = 'saved/shortlist/';

const request = <T>(path: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', body?: unknown) =>
  authClient.requestApi<T>(`${base}${path}`, { method, body, authenticated: true });

export const shortlistService = {
  async list(): Promise<ServerShortlistItem[]> {
    const data = await request<{ results: ServerShortlistItem[] }>('');
    return data.results;
  },

  add(vertical: ShortlistVertical, key: string): Promise<ServerShortlistItem> {
    return request<ServerShortlistItem>('', 'POST', { vertical: TO_API[vertical], key });
  },

  async remove(vertical: ShortlistVertical, key: string): Promise<void> {
    await request<void>(`${TO_API[vertical]}/${encodeURIComponent(key)}/`, 'DELETE');
  },

  importItems(
    items: Array<{ vertical: ShortlistVertical; key: string }>
  ): Promise<ShortlistImportResult> {
    return request<ShortlistImportResult>('import/', 'POST', {
      items: items.map(item => ({ vertical: TO_API[item.vertical], key: item.key })),
    });
  },
};

/** Detail link for a server shortlist row, matching the discovery pages'. */
export const detailHrefForServerItem = (item: ServerShortlistItem): string => {
  switch (item.vertical) {
    case 'deposits':
      return `/deposits/${item.slug ?? ''}`;
    case 'loans':
      return `/loans/${item.slug ?? ''}`;
    case 'accounts':
      return `/accounts/${item.slug ?? ''}`;
    default:
      return '/cards';
  }
};

/** Convert a server row into the provider's item shape. */
export const toShortlistItem = (row: ServerShortlistItem): ShortlistItem => ({
  vertical: FROM_API[row.vertical],
  key: row.key,
  name: row.name,
  bankName: row.bank_name,
  detailHref:
    row.vertical === 'cards'
      ? cardPathFor(row.bank_name, row.name) ?? '/cards'
      : detailHrefForServerItem(row),
  ...(row.card_id !== null ? { cardId: row.card_id } : {}),
  ...(row.latest_change
    ? {
        latestChange: {
          fieldName: row.latest_change.field_name,
          changedAt: row.latest_change.changed_at,
        },
      }
    : {}),
});
