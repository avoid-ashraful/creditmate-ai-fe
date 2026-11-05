/**
 * Saved searches (plan Section 4.2): a saved search is a stored discovery
 * URL. Searches are tied to the signed-in account — on this device, under a
 * per-account key — with a one-time import of the pre-redesign saves.
 *
 * History: the old Advanced Search page stored normalized queries in the
 * unscoped localStorage key `savedSearches` and confirmed with `alert()`.
 * The first time a user signs in, those legacy entries are imported into
 * their account scope exactly once (per-user flag). Guest-scope saves are
 * different: they fold into the account on EVERY sign-in where any exist,
 * so searches saved as a guest after an earlier sign-in are not stranded.
 * The fold-in de-duplicates by entry id, so a repeated run is harmless.
 * Server-side storage of saved searches is a Phase 3 backend item
 * (plan Section 9, D4).
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

/** A saved search as the Phase 3 server stores it (saved/serializers.py). */
export interface ServerSavedSearch {
  id: number;
  name: string;
  path: string;
  query: string;
  created: string;
  modified: string;
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

/** Returns whether the write actually landed in storage. */
const writeList = (key: string, list: SavedSearch[]): boolean => {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    // Storage unavailable — saves become session-only, and callers must
    // not claim the search was saved.
    return false;
  }
};

export const listSavedSearches = (userId: number | null | undefined): SavedSearch[] =>
  readList(storageKey(userId));

export interface SaveSearchResult {
  entry: SavedSearch;
  /** False when storage rejected the write — the save did not persist. */
  persisted: boolean;
}

export const saveSearch = (
  userId: number | null | undefined,
  input: { name: string; path: string; query: string }
): SaveSearchResult => {
  const entry: SavedSearch = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    path: input.path,
    query: input.query,
    savedAt: new Date().toISOString(),
  };
  const list = readList(storageKey(userId));
  const persisted = writeList(storageKey(userId), [entry, ...list]);
  return { entry, persisted };
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
 * Imports saved searches into a signed-in user's scope. Returns how many
 * searches were imported. Safe to call on every sign-in:
 *
 * - The pre-redesign unscoped (legacy) key imports exactly once, gated by
 *   a per-user flag.
 * - Guest-scope saves fold in whenever any exist — including saves made
 *   after an earlier sign-in — and the guest list is then cleared.
 *
 * Both paths de-duplicate by entry id against what the account already
 * holds, so a run whose flag/clear writes failed part-way cannot create
 * duplicates when it repeats.
 */
export const importLegacySavedSearches = (userId: number): number => {
  const flagKey = `${IMPORT_FLAG_PREFIX}:${userId}`;
  let legacyDone = false;
  try {
    legacyDone = Boolean(window.localStorage.getItem(flagKey));
  } catch {
    // Storage unreadable: nothing can persist, so there is nothing to do.
    return 0;
  }

  let imported = 0;
  const target = readList(storageKey(userId));
  const seen = new Set(target.map(entry => entry.id));
  const pushUnique = (entry: SavedSearch): void => {
    if (seen.has(entry.id)) return;
    seen.add(entry.id);
    target.push(entry);
    imported += 1;
  };

  // 1. The pre-redesign unscoped key (advanced-search saves were card
  // searches) — one-time only, behind the per-user flag.
  if (!legacyDone) {
    try {
      const raw = window.localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const legacy = JSON.parse(raw) as LegacySavedSearch[];
        if (Array.isArray(legacy)) {
          legacy.forEach((entry, index) => {
            const query = legacyQueryString(entry);
            if (!query) return;
            pushUnique({
              id: `legacy-${index}-${entry.savedAt ?? 'unknown'}`,
              name: 'Card search',
              path: '/cards',
              query,
              savedAt: entry.savedAt ?? new Date().toISOString(),
            });
          });
        }
        window.localStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      // A corrupt legacy payload must never block sign-in.
    }
    try {
      window.localStorage.setItem(flagKey, new Date().toISOString());
    } catch {
      // If the flag can't persist the legacy import may repeat; the
      // entries carry stable legacy ids and pushUnique de-duplicates by
      // id, so a repeat stays harmless.
    }
  }

  // 2. Anything saved while signed out on this device joins the account
  // too — on every sign-in, not just the first.
  const guestList = readList(storageKey(null));
  if (guestList.length > 0) {
    guestList.forEach(pushUnique);
    writeList(storageKey(null), []);
  }

  writeList(storageKey(userId), target);
  return imported;
};

// ---------------------------------------------------------------------------
// Server-side saved searches (Phase 3): for signed-in users the account's
// server rows are the source of truth and follow the user across devices.
// The local functions above remain the guest path and the import source.
// ---------------------------------------------------------------------------

import { authClient } from './auth';

const searchesBase = 'saved/searches/';

interface Paged<T> {
  results: T[];
  next: string | null;
}

const fetchAllPages = async <T>(path: string): Promise<T[]> => {
  const rows: T[] = [];
  let nextPath: string | null = path;
  while (nextPath) {
    const page: Paged<T> = await authClient.requestApi<Paged<T>>(nextPath, {
      authenticated: true,
    });
    rows.push(...page.results);
    if (page.next) {
      const url = new URL(page.next);
      nextPath = `${path}${url.search}`;
    } else {
      nextPath = null;
    }
  }
  return rows;
};

export const savedSearchesApi = {
  /** All of the signed-in user's saved searches (every page). */
  list(): Promise<ServerSavedSearch[]> {
    return fetchAllPages<ServerSavedSearch>(searchesBase);
  },

  create(input: { name: string; path: string; query: string }): Promise<ServerSavedSearch> {
    return authClient.requestApi<ServerSavedSearch>(searchesBase, {
      method: 'POST',
      body: input,
      authenticated: true,
    });
  },

  async remove(id: number): Promise<void> {
    await authClient.requestApi<void>(`${searchesBase}${id}/`, {
      method: 'DELETE',
      authenticated: true,
    });
  },

  /**
   * Merge on-device searches into the account. The server de-duplicates on
   * (name, path, query), so calling this on every sign-in is harmless.
   */
  importSearches(
    entries: Array<{ name: string; path: string; query: string }>
  ): Promise<{ imported: number; skipped: number; results: ServerSavedSearch[] }> {
    return authClient.requestApi(`${searchesBase}import/`, {
      method: 'POST',
      body: { searches: entries },
      authenticated: true,
    });
  },
};

/** Convert a server row into the local SavedSearch shape for shared UI. */
export const toSavedSearch = (row: ServerSavedSearch): SavedSearch => ({
  id: `server-${row.id}`,
  name: row.name,
  path: row.path,
  query: row.query,
  savedAt: row.created,
});

/** The numeric server id behind a converted row's local id, if any. */
export const serverSearchId = (entry: SavedSearch): number | null => {
  const match = /^server-(\d+)$/.exec(entry.id);
  return match ? Number(match[1]) : null;
};
