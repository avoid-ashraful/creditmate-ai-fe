/**
 * The persistent shortlist (plan Sections 2.1, 4.7, 5.3).
 *
 * One shortlist for the whole product, kept on this device in Phase 1 and
 * rendered by the shell tray. The full compare workspace — and the
 * server-backed cross-device shortlist — land in Phase 3; the item shape
 * here is already the workspace's shape so nothing is thrown away.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ShortlistVertical = 'cards' | 'deposits' | 'loans' | 'accounts';

export interface ShortlistItem {
  vertical: ShortlistVertical;
  /** Stable per-product key inside the vertical (card id, or product slug). */
  key: string;
  name: string;
  bankName: string;
  detailHref: string;
  /** Cards only: numeric id, used to build /compare?ids= links. */
  cardId?: number;
}

export type ToggleResult = 'added' | 'removed' | 'full';

/** Compare supports at most four products of one vertical (plan Section 4.7). */
export const SHORTLIST_LIMIT_PER_VERTICAL = 4;

export const SHORTLIST_STORAGE_KEY = 'creditmate.shortlist.v1';

interface ShortlistContextValue {
  items: ShortlistItem[];
  count: number;
  countFor: (vertical: ShortlistVertical) => number;
  isInShortlist: (vertical: ShortlistVertical, key: string) => boolean;
  toggle: (item: ShortlistItem) => ToggleResult;
  remove: (vertical: ShortlistVertical, key: string) => void;
  clear: () => void;
  /** Numeric ids of shortlisted cards, for /compare?ids= links. */
  cardIds: number[];
}

const ShortlistContext = createContext<ShortlistContextValue | null>(null);

const readItems = (): ShortlistItem[] => {
  try {
    const raw = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShortlistItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      item =>
        item &&
        typeof item.key === 'string' &&
        typeof item.name === 'string' &&
        typeof item.detailHref === 'string' &&
        ['cards', 'deposits', 'loans', 'accounts'].includes(item.vertical)
    );
  } catch {
    return [];
  }
};

const persist = (items: ShortlistItem[]): void => {
  try {
    window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Non-fatal: the shortlist simply won't survive a reload.
  }
};

export const ShortlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ShortlistItem[]>(() => readItems());

  const update = useCallback((next: ShortlistItem[]) => {
    setItems(next);
    persist(next);
  }, []);

  const isInShortlist = useCallback(
    (vertical: ShortlistVertical, key: string) =>
      items.some(item => item.vertical === vertical && item.key === key),
    [items]
  );

  const countFor = useCallback(
    (vertical: ShortlistVertical) => items.filter(item => item.vertical === vertical).length,
    [items]
  );

  const toggle = useCallback(
    (item: ShortlistItem): ToggleResult => {
      if (isInShortlist(item.vertical, item.key)) {
        update(items.filter(i => !(i.vertical === item.vertical && i.key === item.key)));
        return 'removed';
      }
      if (countFor(item.vertical) >= SHORTLIST_LIMIT_PER_VERTICAL) {
        return 'full';
      }
      update([...items, item]);
      return 'added';
    },
    [items, isInShortlist, countFor, update]
  );

  const remove = useCallback(
    (vertical: ShortlistVertical, key: string) => {
      update(items.filter(i => !(i.vertical === vertical && i.key === key)));
    },
    [items, update]
  );

  const clear = useCallback(() => update([]), [update]);

  const value = useMemo<ShortlistContextValue>(() => {
    const cardIds = items
      .filter(item => item.vertical === 'cards' && typeof item.cardId === 'number')
      .map(item => item.cardId as number);
    return {
      items,
      count: items.length,
      countFor,
      isInShortlist,
      toggle,
      remove,
      clear,
      cardIds,
    };
  }, [items, countFor, isInShortlist, toggle, remove, clear]);

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
};

export const useShortlist = (): ShortlistContextValue => {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error('useShortlist must be used inside ShortlistProvider');
  return ctx;
};
