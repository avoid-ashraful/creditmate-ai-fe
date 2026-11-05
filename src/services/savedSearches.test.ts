import {
  deleteSavedSearch,
  importLegacySavedSearches,
  listSavedSearches,
  saveSearch,
} from './savedSearches';

describe('savedSearches service', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('scopes saves per account and keeps guests separate', () => {
    saveSearch(null, { name: 'Guest hunt', path: '/cards', query: 'search=visa' });
    saveSearch(7, { name: 'Mine', path: '/cards', query: 'categories=travel' });

    expect(listSavedSearches(null).map(s => s.name)).toEqual(['Guest hunt']);
    expect(listSavedSearches(7).map(s => s.name)).toEqual(['Mine']);
    expect(listSavedSearches(8)).toEqual([]);
  });

  it('deletes by id within the same scope only', () => {
    const { entry: saved } = saveSearch(7, { name: 'Mine', path: '/cards', query: 'a=1' });
    deleteSavedSearch(null, saved.id);
    expect(listSavedSearches(7)).toHaveLength(1);
    deleteSavedSearch(7, saved.id);
    expect(listSavedSearches(7)).toHaveLength(0);
  });

  it('reports persistence honestly when storage rejects the write', () => {
    const ok = saveSearch(7, { name: 'Mine', path: '/cards', query: 'a=1' });
    expect(ok.persisted).toBe(true);

    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    try {
      const failed = saveSearch(7, { name: 'Lost', path: '/cards', query: 'b=2' });
      expect(failed.persisted).toBe(false);
    } finally {
      setItem.mockRestore();
    }
    // The failed save never landed in the stored list.
    expect(listSavedSearches(7).map(s => s.name)).toEqual(['Mine']);
  });

  it('imports the legacy unscoped saves once, as /cards searches', () => {
    window.localStorage.setItem(
      'savedSearches',
      JSON.stringify([
        {
          normalized_query: { search: 'platinum', categories: 'travel' },
          savedAt: '2026-09-01T00:00:00.000Z',
        },
        { normalized_query: {}, savedAt: '2026-09-02T00:00:00.000Z' },
      ])
    );
    const imported = importLegacySavedSearches(7);
    expect(imported).toBe(1);
    const list = listSavedSearches(7);
    expect(list).toHaveLength(1);
    expect(list[0].path).toBe('/cards');
    expect(list[0].query).toContain('search=platinum');
    expect(list[0].query).toContain('categories=travel');
    // Legacy key consumed; a second import is a no-op.
    expect(window.localStorage.getItem('savedSearches')).toBeNull();
    expect(importLegacySavedSearches(7)).toBe(0);
    expect(listSavedSearches(7)).toHaveLength(1);
  });

  it('folds guest saves into the account on import and clears the guest list', () => {
    saveSearch(null, { name: 'Guest hunt', path: '/deposits', query: 'kind=dps' });
    const imported = importLegacySavedSearches(9);
    expect(imported).toBe(1);
    expect(listSavedSearches(9).map(s => s.name)).toEqual(['Guest hunt']);
    expect(listSavedSearches(null)).toEqual([]);
  });

  it('folds in guest saves made after the first sign-in, without duplicating', () => {
    // First sign-in: the one-time legacy import runs (nothing to import).
    expect(importLegacySavedSearches(9)).toBe(0);
    // Signed out again, the user saves as a guest…
    const { entry: guestSave } = saveSearch(null, {
      name: 'Later guest hunt',
      path: '/cards',
      query: 'search=visa',
    });
    // …and the next sign-in still folds it into the account.
    expect(importLegacySavedSearches(9)).toBe(1);
    expect(listSavedSearches(9).map(s => s.name)).toEqual(['Later guest hunt']);
    expect(listSavedSearches(null)).toEqual([]);
    // A repeat sign-in imports nothing and duplicates nothing.
    expect(importLegacySavedSearches(9)).toBe(0);
    expect(listSavedSearches(9)).toHaveLength(1);
    // Even if the same guest entry reappears (its clear-write failed on a
    // previous run), de-duplication by id keeps the account list clean.
    window.localStorage.setItem('creditmate.savedSearches.v1:guest', JSON.stringify([guestSave]));
    expect(importLegacySavedSearches(9)).toBe(0);
    expect(listSavedSearches(9)).toHaveLength(1);
  });

  it('survives a corrupt legacy payload without throwing', () => {
    window.localStorage.setItem('savedSearches', '{not json');
    expect(() => importLegacySavedSearches(3)).not.toThrow();
    expect(listSavedSearches(3)).toEqual([]);
  });
});
