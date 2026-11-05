/**
 * Saved-search sync lifecycle (Phase 3 review fix): the sign-in import
 * consumes both local scopes, and deleting a server search removes its
 * local twins — so a deleted search stays deleted across sign-out,
 * reload and re-login instead of being re-imported back into existence.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import {
  listSavedSearches,
  saveSearch,
  savedSearchesApi,
  type ServerSavedSearch,
} from '../services/savedSearches';

import { AUTH_STATUS, AuthContext, type AuthContextValue } from './AuthProvider';
import { useSavedSearches } from './useSavedSearches';

jest.mock('../services/savedSearches', () => {
  const actual = jest.requireActual('../services/savedSearches');
  return {
    ...actual,
    savedSearchesApi: {
      list: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
      importSearches: jest.fn(),
    },
  };
});

const api = savedSearchesApi as unknown as {
  list: jest.Mock;
  create: jest.Mock;
  remove: jest.Mock;
  importSearches: jest.Mock;
};

const USER_ID = 7;

const signedInAuth: AuthContextValue = {
  status: AUTH_STATUS.authenticated,
  user: { id: USER_ID, email: 'owner@example.com' },
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={signedInAuth}>{children}</AuthContext.Provider>
);

describe('useSavedSearches server sync lifecycle', () => {
  let serverRows: ServerSavedSearch[];
  let importPayloads: Array<Array<{ name: string; path: string; query: string }>>;
  let nextId: number;

  beforeEach(() => {
    window.localStorage.clear();
    serverRows = [];
    importPayloads = [];
    nextId = 0;
    api.list.mockReset().mockImplementation(async () => [...serverRows]);
    api.create
      .mockReset()
      .mockImplementation(
        async (input: {
          name: string;
          path: string;
          query: string;
        }): Promise<ServerSavedSearch> => {
          const row: ServerSavedSearch = {
            id: (nextId += 1),
            ...input,
            created: '2026-01-01T00:00:00Z',
            modified: '2026-01-01T00:00:00Z',
          };
          serverRows.push(row);
          return row;
        }
      );
    api.remove.mockReset().mockImplementation(async (id: number) => {
      serverRows = serverRows.filter(row => row.id !== id);
    });
    api.importSearches
      .mockReset()
      .mockImplementation(async (entries: Array<{ name: string; path: string; query: string }>) => {
        importPayloads.push(entries.map(entry => ({ ...entry })));
        let imported = 0;
        for (const entry of entries) {
          const dupe = serverRows.some(
            row => row.name === entry.name && row.path === entry.path && row.query === entry.query
          );
          if (!dupe) {
            serverRows.push({
              id: (nextId += 1),
              ...entry,
              created: '2026-01-01T00:00:00Z',
              modified: '2026-01-01T00:00:00Z',
            });
            imported += 1;
          }
        }
        return { imported, skipped: entries.length - imported, results: [...serverRows] };
      });
  });

  it('imports the account and guest scopes on sign-in and consumes both', async () => {
    saveSearch(null, { name: 'Guest one', path: '/cards', query: 'a=1' });
    saveSearch(USER_ID, { name: 'Mine', path: '/loans', query: 'b=2' });

    const { result } = renderHook(() => useSavedSearches(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.searches.map(s => s.name).sort()).toEqual(['Guest one', 'Mine']);
    expect(importPayloads).toHaveLength(1);
    expect(importPayloads[0]).toHaveLength(2);
    // Consumed: neither local scope retains an importable copy.
    expect(listSavedSearches(null)).toEqual([]);
    expect(listSavedSearches(USER_ID)).toEqual([]);
    expect(serverRows).toHaveLength(2);
  });

  it('a deleted server search stays deleted on the next sign-in session', async () => {
    saveSearch(null, { name: 'Doomed', path: '/cards', query: 'categories=travel' });

    const { result: firstResult, unmount: unmountFirst } = renderHook(() => useSavedSearches(), {
      wrapper,
    });
    await waitFor(() => expect(firstResult.current.loading).toBe(false));
    const entry = firstResult.current.searches.find(s => s.name === 'Doomed');
    expect(entry).toBeDefined();

    await act(async () => {
      await firstResult.current.remove(entry as NonNullable<typeof entry>);
    });
    expect(serverRows).toEqual([]);
    expect(firstResult.current.searches).toEqual([]);
    unmountFirst();

    // A fresh hook instance (page reload / new sign-in session): the
    // import runs again, but the consumed scopes give it nothing, so
    // the deleted search is not resurrected.
    const { result: secondResult, unmount: unmountSecond } = renderHook(() => useSavedSearches(), {
      wrapper,
    });
    await waitFor(() => expect(secondResult.current.loading).toBe(false));
    expect(secondResult.current.searches).toEqual([]);
    expect(serverRows).toEqual([]);
    expect(api.importSearches).toHaveBeenCalledTimes(1);
    unmountSecond();
  });

  it('deleting a server search removes a local twin planted in the guest scope', async () => {
    saveSearch(null, { name: 'Twin', path: '/deposits', query: 'months=12' });

    const { result, unmount } = renderHook(() => useSavedSearches(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const entry = result.current.searches.find(s => s.name === 'Twin');
    expect(entry).toBeDefined();

    // A stale on-device copy of the same search (re)appears in the
    // guest scope after the import consumed the original.
    saveSearch(null, { name: 'Twin', path: '/deposits', query: 'months=12' });
    expect(listSavedSearches(null)).toHaveLength(1);

    await act(async () => {
      await result.current.remove(entry as NonNullable<typeof entry>);
    });
    // The twin went with the server row — nothing remains to re-import.
    expect(listSavedSearches(null)).toEqual([]);
    expect(serverRows).toEqual([]);
    unmount();

    const { result: secondResult, unmount: unmountSecond } = renderHook(() => useSavedSearches(), {
      wrapper,
    });
    await waitFor(() => expect(secondResult.current.loading).toBe(false));
    expect(secondResult.current.searches).toEqual([]);
    expect(serverRows).toEqual([]);
    unmountSecond();
  });
});
