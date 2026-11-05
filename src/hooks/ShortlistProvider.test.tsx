import { act, render } from '@testing-library/react';
import React from 'react';

import {
  SHORTLIST_LIMIT_PER_VERTICAL,
  ShortlistItem,
  ShortlistProvider,
  useShortlist,
} from './ShortlistProvider';

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
