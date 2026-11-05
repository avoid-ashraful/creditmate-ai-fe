/**
 * Saved searches with Phase 3 server backing.
 *
 * Signed-in users read and write the account's server rows, so searches
 * follow them across devices. On first load, whatever this device holds
 * in the account and guest local scopes is merged into the account (the
 * server de-duplicates on name+path+query; the merge is safe to repeat).
 * Signed-out users keep the Phase 1 on-device behaviour. If the server
 * cannot be reached, signed-in users fall back to the device list rather
 * than an empty hole — with `error` set so surfaces can say so.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  deleteSavedSearch,
  listSavedSearches,
  saveSearch,
  savedSearchesApi,
  serverSearchId,
  toSavedSearch,
  type SavedSearch,
} from '../services/savedSearches';

import { AUTH_STATUS, useAuth } from './AuthProvider';

export interface UseSavedSearches {
  searches: SavedSearch[];
  loading: boolean;
  /** True when the server could not be reached and device data is shown. */
  error: boolean;
  save: (input: { name: string; path: string; query: string }) => Promise<boolean>;
  remove: (entry: SavedSearch) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSavedSearches = (): UseSavedSearches => {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const signedIn = status === AUTH_STATUS.authenticated && userId !== null;
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const importedForRef = useRef<number | null>(null);

  const loadServer = useCallback(async () => {
    const rows = await savedSearchesApi.list();
    setSearches(rows.map(toSavedSearch));
    setError(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setSearches(listSavedSearches(null));
      return;
    }
    try {
      await loadServer();
    } catch {
      setError(true);
      setSearches(listSavedSearches(userId));
    }
  }, [signedIn, loadServer, userId]);

  useEffect(() => {
    if (status === AUTH_STATUS.loading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!signedIn) {
        setSearches(listSavedSearches(null));
        setLoading(false);
        return;
      }
      try {
        if (importedForRef.current !== userId) {
          importedForRef.current = userId;
          const local = [...listSavedSearches(userId), ...listSavedSearches(null)];
          if (local.length > 0) {
            await savedSearchesApi.importSearches(
              local.map(entry => ({ name: entry.name, path: entry.path, query: entry.query }))
            );
          }
        }
        const rows = await savedSearchesApi.list();
        if (!cancelled) {
          setSearches(rows.map(toSavedSearch));
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setSearches(listSavedSearches(userId));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, status, userId]);

  const save = useCallback(
    async (input: { name: string; path: string; query: string }): Promise<boolean> => {
      if (!signedIn) {
        const { persisted } = saveSearch(null, input);
        setSearches(listSavedSearches(null));
        return persisted;
      }
      try {
        await savedSearchesApi.create(input);
        await loadServer();
        return true;
      } catch {
        setError(true);
        return false;
      }
    },
    [signedIn, loadServer]
  );

  const remove = useCallback(
    async (entry: SavedSearch): Promise<void> => {
      const serverId = serverSearchId(entry);
      if (signedIn && serverId !== null) {
        try {
          await savedSearchesApi.remove(serverId);
          await loadServer();
          return;
        } catch {
          setError(true);
          return;
        }
      }
      deleteSavedSearch(signedIn ? userId : null, entry.id);
      setSearches(listSavedSearches(signedIn ? userId : null));
    },
    [signedIn, loadServer, userId]
  );

  return { searches, loading, error, save, remove, refresh };
};
