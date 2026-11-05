import { act, render } from '@testing-library/react';
import React from 'react';

import { shortlistService, type ServerShortlistItem } from '../services/shortlist';

import { AUTH_STATUS, AuthContext, type AuthContextValue } from './AuthProvider';
import {
  SHORTLIST_GUEST_KEY,
  SHORTLIST_LIMIT_PER_VERTICAL,
  ShortlistItem,
  ShortlistProvider,
  useShortlist,
} from './ShortlistProvider';

jest.mock('../services/shortlist', () => {
  const actual = jest.requireActual('../services/shortlist');
  return {
    ...actual,
    shortlistService: {
      list: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      importItems: jest.fn(),
    },
  };
});

type Api = ReturnType<typeof useShortlist>;
let api: Api | null = null;

const Probe: React.FC = () => {
  api = useShortlist();
  return null;
};

const renderProvider = () =>
  render(
    <ShortlistProvider>
      <Probe />
    </ShortlistProvider>
  );

const card = (n: number): ShortlistItem => ({
  vertical: 'cards',
  key: `card-${n}`,
  name: `Card ${n}`,
  bankName: 'Example Bank',
  detailHref: `/cards/${n}`,
  cardId: n,
});

describe('ShortlistProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    api = null;
  });

  it('adds and removes items, reporting the outcome', () => {
    renderProvider();
    act(() => {
      expect(api?.toggle(card(1))).toBe('added');
    });
    expect(api?.isInShortlist('cards', 'card-1')).toBe(true);
    expect(api?.count).toBe(1);
    act(() => {
      expect(api?.toggle(card(1))).toBe('removed');
    });
    expect(api?.count).toBe(0);
  });

  it('caps each vertical at four and reports full', () => {
    renderProvider();
    // One act per toggle, mirroring separate user clicks (fresh state each time).
    for (let n = 1; n <= SHORTLIST_LIMIT_PER_VERTICAL; n += 1) {
      act(() => {
        api?.toggle(card(n));
      });
    }
    expect(api?.countFor('cards')).toBe(SHORTLIST_LIMIT_PER_VERTICAL);
    act(() => {
      expect(api?.toggle(card(99))).toBe('full');
    });
    expect(api?.countFor('cards')).toBe(SHORTLIST_LIMIT_PER_VERTICAL);
    // A different vertical still has room.
    act(() => {
      expect(
        api?.toggle({
          vertical: 'deposits',
          key: 'dep-1',
          name: 'Dep 1',
          bankName: 'Bank',
          detailHref: '/deposits/dep-1',
        })
      ).toBe('added');
    });
  });

  it('persists to localStorage and derives card ids for compare', () => {
    renderProvider();
    act(() => {
      api?.toggle(card(5));
    });
    act(() => {
      api?.toggle(card(9));
    });
    expect(api?.cardIds).toEqual([5, 9]);
    const stored = JSON.parse(window.localStorage.getItem('creditmate.shortlist.v1') ?? '[]');
    expect(stored).toHaveLength(2);
    expect(stored[0].name).toBe('Card 5');
  });

  it('rehydrates from localStorage on mount', () => {
    window.localStorage.setItem('creditmate.shortlist.v1', JSON.stringify([card(3)]));
    renderProvider();
    expect(api?.count).toBe(1);
    expect(api?.isInShortlist('cards', 'card-3')).toBe(true);
  });
});

/**
 * The Phase 3 D4 sync layer, against a stateful fake server: sign-in
 * import consumes the guest scope, the server is the only source of
 * truth while signed in, and removals — made here or on another
 * device — never resurrect across a sign-out/sign-in cycle.
 */
describe('ShortlistProvider server sync (Phase 3)', () => {
  const service = shortlistService as unknown as {
    list: jest.Mock;
    add: jest.Mock;
    remove: jest.Mock;
    importItems: jest.Mock;
  };

  let serverRows: ServerShortlistItem[];
  let importPayloads: Array<Array<{ vertical: string; key: string }>>;
  let nextId: number;

  const rowFor = (vertical: ShortlistItem['vertical'], key: string): ServerShortlistItem => ({
    id: (nextId += 1),
    vertical,
    key,
    name: `Product ${key}`,
    bank_name: 'Example Bank',
    card_id: vertical === 'cards' ? Number(key.replace('card-', '')) || null : null,
    slug: vertical === 'cards' ? null : key,
    latest_change: null,
    created: '2026-01-01T00:00:00Z',
  });

  const anonymousAuth: AuthContextValue = {
    status: AUTH_STATUS.anonymous,
    user: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  };
  const signedInAuth: AuthContextValue = {
    status: AUTH_STATUS.authenticated,
    user: { id: 7, email: 'owner@example.com' },
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  };

  const tree = (auth: AuthContextValue) => (
    <AuthContext.Provider value={auth}>
      <ShortlistProvider>
        <Probe />
      </ShortlistProvider>
    </AuthContext.Provider>
  );

  /** Let the sign-in import promise chain settle. */
  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
  };

  const guestScope = (): ShortlistItem[] =>
    JSON.parse(window.localStorage.getItem(SHORTLIST_GUEST_KEY) ?? '[]') as ShortlistItem[];

  beforeEach(() => {
    window.localStorage.clear();
    api = null;
    serverRows = [];
    importPayloads = [];
    nextId = 0;
    service.list.mockReset().mockImplementation(async () => [...serverRows]);
    service.add
      .mockReset()
      .mockImplementation(async (vertical: ShortlistItem['vertical'], key: string) => {
        const existing = serverRows.find(r => r.vertical === vertical && r.key === key);
        if (existing) return existing;
        const row = rowFor(vertical, key);
        serverRows.push(row);
        return row;
      });
    service.remove
      .mockReset()
      .mockImplementation(async (vertical: ShortlistItem['vertical'], key: string) => {
        serverRows = serverRows.filter(r => !(r.vertical === vertical && r.key === key));
      });
    service.importItems
      .mockReset()
      .mockImplementation(
        async (items: Array<{ vertical: ShortlistItem['vertical']; key: string }>) => {
          importPayloads.push(items.map(item => ({ ...item })));
          let imported = 0;
          for (const item of items) {
            if (!serverRows.some(r => r.vertical === item.vertical && r.key === item.key)) {
              serverRows.push(rowFor(item.vertical, item.key));
              imported += 1;
            }
          }
          return { imported, skipped: items.length - imported, results: [...serverRows] };
        }
      );
  });

  it('imports the guest scope on sign-in, consumes it, and mirrors the server', async () => {
    const view = render(tree(anonymousAuth));
    act(() => {
      api?.toggle(card(1));
    });
    act(() => {
      api?.toggle(card(2));
    });
    expect(guestScope()).toHaveLength(2);

    view.rerender(tree(signedInAuth));
    await flush();

    expect(importPayloads).toEqual([
      [
        { vertical: 'cards', key: 'card-1' },
        { vertical: 'cards', key: 'card-2' },
      ],
    ]);
    // Consumed: the guest scope holds only never-imported items now.
    expect(guestScope()).toEqual([]);
    expect(serverRows.map(r => r.key).sort()).toEqual(['card-1', 'card-2']);
    expect(api?.count).toBe(2);
    expect(api?.isInShortlist('cards', 'card-1')).toBe(true);
  });

  it('an item removed on another device stays removed across sign-out and sign-in', async () => {
    const view = render(tree(anonymousAuth));
    act(() => {
      api?.toggle(card(1));
    });
    view.rerender(tree(signedInAuth));
    await flush();
    expect(serverRows.map(r => r.key)).toEqual(['card-1']);

    // Removed on another device: the server loses the row behind this
    // device's back (this device's tray still shows its stale mirror).
    serverRows = [];

    view.rerender(tree(anonymousAuth));
    await flush();
    // Sign-out restores the guest scope — consumed on import, so the
    // removed item is not restored from stale pre-import state.
    expect(api?.count).toBe(0);

    view.rerender(tree(signedInAuth));
    await flush();
    // Nothing is re-imported, and the tray mirrors the (empty) server.
    expect(importPayloads[1]).toEqual([]);
    expect(serverRows).toEqual([]);
    expect(api?.count).toBe(0);
    expect(api?.isInShortlist('cards', 'card-1')).toBe(false);
  });

  it('an item removed on this device while signed in stays removed across sign-out and sign-in', async () => {
    const view = render(tree(anonymousAuth));
    act(() => {
      api?.toggle(card(1));
    });
    view.rerender(tree(signedInAuth));
    await flush();
    expect(api?.isInShortlist('cards', 'card-1')).toBe(true);

    act(() => {
      api?.toggle(card(1));
    });
    await flush();
    expect(serverRows).toEqual([]);

    view.rerender(tree(anonymousAuth));
    await flush();
    view.rerender(tree(signedInAuth));
    await flush();
    expect(importPayloads[1]).toEqual([]);
    expect(serverRows).toEqual([]);
    expect(api?.isInShortlist('cards', 'card-1')).toBe(false);
  });

  it('imports are idempotent across repeated sign-in cycles, and later guest additions still fold in', async () => {
    const view = render(tree(anonymousAuth));
    act(() => {
      api?.toggle(card(1));
    });
    view.rerender(tree(signedInAuth));
    await flush();
    view.rerender(tree(anonymousAuth));
    await flush();
    view.rerender(tree(signedInAuth));
    await flush();

    // The second sign-in had nothing left to import; the server row was
    // not duplicated.
    expect(importPayloads).toEqual([[{ vertical: 'cards', key: 'card-1' }], []]);
    expect(serverRows.map(r => r.key)).toEqual(['card-1']);
    expect(api?.count).toBe(1);

    // A guest addition made after sign-out is un-imported, so the next
    // sign-in folds it in alongside what the account already holds.
    view.rerender(tree(anonymousAuth));
    await flush();
    act(() => {
      api?.toggle(card(5));
    });
    expect(guestScope().map(item => item.key)).toEqual(['card-5']);
    view.rerender(tree(signedInAuth));
    await flush();
    expect(importPayloads[2]).toEqual([{ vertical: 'cards', key: 'card-5' }]);
    expect(serverRows.map(r => r.key).sort()).toEqual(['card-1', 'card-5']);
    expect(api?.count).toBe(2);
  });

  it('a signed-in removal prunes an un-imported guest leftover when an earlier import failed', async () => {
    // The guest shortlisted card-7, but the sign-in import failed
    // (offline), leaving the item un-imported in the guest scope.
    window.localStorage.setItem(SHORTLIST_GUEST_KEY, JSON.stringify([card(7)]));
    service.importItems.mockRejectedValueOnce(new Error('offline'));
    const view = render(tree(signedInAuth));
    await flush();
    expect(guestScope().map(item => item.key)).toEqual(['card-7']);

    act(() => {
      api?.remove('cards', 'card-7');
    });
    await flush();
    expect(service.remove).toHaveBeenCalledWith('cards', 'card-7');
    // Pruned: the next successful sign-in must not import it back.
    expect(guestScope()).toEqual([]);

    view.rerender(tree(anonymousAuth));
    await flush();
    view.rerender(tree(signedInAuth));
    await flush();
    expect(importPayloads).toEqual([[]]);
    expect(serverRows).toEqual([]);
    view.unmount();
  });
});
