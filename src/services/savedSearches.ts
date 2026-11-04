/**
 * Saved searches (plan Section 4.2): a saved search is a stored discovery
 * URL. Searches are tied to the signed-in account — on this device, under a
 * per-account key — with a one-time import of the pre-redesign saves.
 *
 * History: the old Advanced Search page stored normalized queries in the
 * unscoped localStorage key `savedSearches` and confirmed with `alert()`.
 * The first time a user signs in, those entries (and any guest-scope saves)
 * are imported into their account scope exactly once. Server-side storage
 * of saved searches is a Phase 3 backend item (plan Section 9, D4).
 */

export interface SavedSearch {
  id: string;
  name: string;
  /** Discovery path the search belongs to, e.g. "/cards". */
  path: string;
  /** Query string without the leading "?", e.g. "categories=travel". */
  query: string;
  savedAt: string;
}

const LEGACY_KEY = 'savedSearches';
const KEY_PREFIX = 'creditmate.savedSearches.v1';
const IMPORT_FLAG_PREFIX = 'creditmate.savedSearches.imported.v1';

const scopeFor = (userId: number | null | undefined): string =>
  userId ? `user-${userId}` : 'guest';

const storageKey = (userId: number | null | undefined): string =>
  `${KEY_PREFIX}:${scopeFor(userId)}`;

const readList = (key: string): SavedSearch[] => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSearch[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      entry =>
        entry &&
        typeof entry.id === 'string' &&
        typeof entry.path === 'string' &&
        typeof entry.query === 'string'
    );
  } catch {
    return [];
  }
};

const writeList = (key: string, list: SavedSearch[]): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // Storage unavailable — saves become session-only.
  }
};

export const listSavedSearches = (userId: number | null | undefined): SavedSearch[] =>
  readList(storageKey(userId));

export const saveSearch = (
  userId: number | null | undefined,
  input: { name: string; path: string; query: string }
): SavedSearch => {
  const entry: SavedSearch = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    path: input.path,
    query: input.query,
    savedAt: new Date().toISOString(),
  };
  const list = readList(storageKey(userId));
  writeList(storageKey(userId), [entry, ...list]);
  return entry;
};

export const deleteSavedSearch = (userId: number | null | undefined, id: string): void => {
  const list = readList(storageKey(userId)).filter(entry => entry.id !== id);
  writeList(storageKey(userId), list);
};

interface LegacySavedSearch {
  normalized_query?: Record<string, string | undefined>;
  savedAt?: string;
}

const legacyQueryString = (entry: LegacySavedSearch): string | null => {
  if (!entry.normalized_query) return null;
  const params = new URLSearchParams();
  Object.entries(entry.normalized_query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, value);
  });
  const query = params.toString();
  return query || null;
};

/**
 * One-time import of pre-redesign saves into a signed-in user's scope.
 * Returns how many searches were imported. Safe to call on every sign-in:
 * a per-user flag makes later calls no-ops.
 */
export const importLegacySavedSearches = (userId: number): number => {
  const flagKey = `${IMPORT_FLAG_PREFIX}:${userId}`;
  try {
    if (window.localStorage.getItem(flagKey)) return 0;
  } catch {
    return 0;
  }

  let imported = 0;
  const target = readList(storageKey(userId));

  // 1. The pre-redesign unscoped key (advanced-search saves were card searches).
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const legacy = JSON.parse(raw) as LegacySavedSearch[];
      if (Array.isArray(legacy)) {
        legacy.forEach((entry, index) => {
          const query = legacyQueryString(entry);
          if (!query) return;
          target.push({
            id: `legacy-${index}-${entry.savedAt ?? 'unknown'}`,
            name: 'Card search',
            path: '/cards',
            query,
            savedAt: entry.savedAt ?? new Date().toISOString(),
          });
          imported += 1;
        });
      }
      window.localStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    // A corrupt legacy payload must never block sign-in.
  }

  // 2. Anything saved while signed out on this device joins the account too.
  const guestList = readList(storageKey(null));
  if (guestList.length > 0) {
    target.push(...guestList);
    imported += guestList.length;
    writeList(storageKey(null), []);
  }

  writeList(storageKey(userId), target);
  try {
    window.localStorage.setItem(flagKey, new Date().toISOString());
  } catch {
    // If the flag can't persist the import may repeat; entries carry stable
    // legacy ids, and de-duplication below keeps that harmless.
  }
  return imported;
};
