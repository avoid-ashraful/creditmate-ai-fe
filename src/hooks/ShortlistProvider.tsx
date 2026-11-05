/**
 * The persistent shortlist (plan Sections 2.1, 4.7, 5.3).
 *
 * One shortlist for the whole product, rendered by the shell tray and the
 * /compare workspace. Signed-out, it lives on this device. Signed-in, it
 * is server-backed and follows the account across devices (Phase 3, D4):
 *
 * - On sign-in, the device's guest-scope items are merged into the
 *   account (the server import de-duplicates, so this is safe to repeat)
 *   and the tray then mirrors the server list. The mirror is never
 *   imported back, so an item removed on another device is not
 *   resurrected here.
 * - Toggles while signed in update the tray immediately and persist to
 *   the server; a failed write reconciles from the server list.
 * - On sign-out, the tray returns to the guest-scope items from before
 *   sign-in — one user's account shortlist never leaks into the next
 *   person's guest session on a shared device.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { shortlistService, toShortlistItem } from '../services/shortlist';

import { AuthContext, type AuthContextValue } from './AuthProvider';

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
/** Guest-scope items: what a signed-out user shortlisted on this device. */
export const SHORTLIST_GUEST_KEY = 'creditmate.shortlist.guest.v1';

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

const VERTICALS: ShortlistVertical[] = ['cards', 'deposits', 'loans', 'accounts'];

const parseItems = (raw: string | null): ShortlistItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ShortlistItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      item =>
        item &&
        typeof item.key === 'string' &&
        typeof item.name === 'string' &&
        typeof item.detailHref === 'string' &&
        VERTICALS.includes(item.vertical)
    );
  } catch {
    return [];
  }
};

const readKey = (key: string): ShortlistItem[] => {
  try {
    return parseItems(window.localStorage.getItem(key));
  } catch {
    return [];
  }
};

const readItems = (): ShortlistItem[] => readKey(SHORTLIST_STORAGE_KEY);
const readGuestItems = (): ShortlistItem[] => readKey(SHORTLIST_GUEST_KEY);

const writeKey = (key: string, items: ShortlistItem[]): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Non-fatal: the shortlist simply won't survive a reload.
  }
};

const persist = (items: ShortlistItem[]): void => writeKey(SHORTLIST_STORAGE_KEY, items);

/**
 * Some page test suites mock the AuthProvider module with a factory that
 * only stubs `useAuth`; in that world `AuthContext` itself is undefined.
 * Subscribing through a fallback context keeps this provider usable
 * standalone (pure guest behaviour) instead of crashing those renders.
 */
const FallbackAuthContext = createContext<AuthContextValue | undefined>(undefined);

export const ShortlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext ?? FallbackAuthContext);
  const authStatus = auth?.status ?? 'anonymous';
  const userId = auth?.user?.id ?? null;
  const signedIn = authStatus === 'authenticated' && userId !== null;

  const [items, setItems] = useState<ShortlistItem[]>(() => readItems());
  const itemsRef = useRef(items);
  const signedInRef = useRef(false);
  signedInRef.current = signedIn;
  const syncedUserRef = useRef<number | null>(null);
  const prevSignedInRef = useRef(false);

  const update = useCallback((next: ShortlistItem[]) => {
    itemsRef.current = next;
    setItems(next);
    persist(next);
    if (!signedInRef.current) writeKey(SHORTLIST_GUEST_KEY, next);
  }, []);

  /** Reconcile the tray from the server list (the source of truth). */
  const reconcileFromServer = useCallback(async () => {
    try {
      const rows = await shortlistService.list();
      const serverItems = rows.map(toShortlistItem);
      itemsRef.current = serverItems;
      setItems(serverItems);
      persist(serverItems);
    } catch {
      // Keep the current tray; the next sign-in or toggle retries.
    }
  }, []);

  // Sign-in: merge the guest scope into the account, then mirror the
  // server list. Sign-out: restore the guest scope.
  useEffect(() => {
    if (signedIn && userId !== null && syncedUserRef.current !== userId) {
      syncedUserRef.current = userId;
      let cancelled = false;
      void (async () => {
        try {
          const guestItems = readGuestItems();
          const result = await shortlistService.importItems(
            guestItems.map(item => ({ vertical: item.vertical, key: item.key }))
          );
          if (cancelled) return;
          const serverItems = result.results.map(toShortlistItem);
          itemsRef.current = serverItems;
          setItems(serverItems);
          persist(serverItems);
        } catch {
          // Import failed (e.g. offline): keep the device items in the
          // tray and retry on the next sign-in.
          syncedUserRef.current = null;
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    if (!signedIn && prevSignedInRef.current && authStatus === 'anonymous') {
      syncedUserRef.current = null;
      const guestItems = readGuestItems();
      itemsRef.current = guestItems;
      setItems(guestItems);
      persist(guestItems);
    }
    prevSignedInRef.current = signedIn;
    return undefined;
  }, [signedIn, userId, authStatus]);

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
      const current = itemsRef.current;
      if (current.some(i => i.vertical === item.vertical && i.key === item.key)) {
        update(current.filter(i => !(i.vertical === item.vertical && i.key === item.key)));
        if (signedInRef.current) {
          void shortlistService.remove(item.vertical, item.key).catch(() => {
            void reconcileFromServer();
          });
        }
        return 'removed';
      }
      if (
        current.filter(i => i.vertical === item.vertical).length >= SHORTLIST_LIMIT_PER_VERTICAL
      ) {
        return 'full';
      }
      update([...current, item]);
      if (signedInRef.current) {
        void shortlistService.add(item.vertical, item.key).catch(() => {
          void reconcileFromServer();
        });
      }
      return 'added';
    },
    [update, reconcileFromServer]
  );

  const remove = useCallback(
    (vertical: ShortlistVertical, key: string) => {
      update(itemsRef.current.filter(i => !(i.vertical === vertical && i.key === key)));
      if (signedInRef.current) {
        void shortlistService.remove(vertical, key).catch(() => {
          void reconcileFromServer();
        });
      }
    },
    [update, reconcileFromServer]
  );

  const clear = useCallback(() => {
    const current = itemsRef.current;
    update([]);
    if (signedInRef.current) {
      void Promise.all(current.map(item => shortlistService.remove(item.vertical, item.key))).catch(
        () => {
          void reconcileFromServer();
        }
      );
    }
  }, [update, reconcileFromServer]);

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
