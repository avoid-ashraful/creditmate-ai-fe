import {
  MODE_DEFINITIONS,
  isMemorablePath,
  modeForPath,
  modeTarget,
  readModeMemory,
  writeModeMemory,
} from './modes';

describe('shell modes', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('maps routes to their mode', () => {
    expect(modeForPath('/cards')).toBe('cards');
    expect(modeForPath('/compare')).toBe('tools');
    expect(modeForPath('/deposits')).toBe('save');
    expect(modeForPath('/deposits/alpha-fdr')).toBe('save');
    expect(modeForPath('/accounts')).toBe('save');
    expect(modeForPath('/loans')).toBe('borrow');
    expect(modeForPath('/calculators')).toBe('tools');
    expect(modeForPath('/eligibility-checker')).toBe('tools');
    expect(modeForPath('/banks')).toBe('banks');
    expect(modeForPath('/guides')).toBe('learn');
    expect(modeForPath('/my/saved')).toBe('my');
    expect(modeForPath('/')).toBeNull();
    expect(modeForPath('/login')).toBeNull();
  });

  it('only treats discovery routes as memorable, never detail pages', () => {
    expect(isMemorablePath('/cards')).toBe(true);
    expect(isMemorablePath('/deposits')).toBe(true);
    expect(isMemorablePath('/loans')).toBe(true);
    expect(isMemorablePath('/accounts')).toBe(true);
    expect(isMemorablePath('/deposits/alpha-fdr')).toBe(false);
    expect(isMemorablePath('/banks/example-bank')).toBe(false);
  });

  it('returns each mode to its remembered discovery URL', () => {
    const cardsMode = MODE_DEFINITIONS.find(mode => mode.id === 'cards');
    if (!cardsMode) throw new Error('cards mode missing');
    expect(modeTarget(cardsMode, {})).toBe('/cards');
    expect(modeTarget(cardsMode, { cards: '/cards?categories=travel' })).toBe(
      '/cards?categories=travel'
    );
  });

  it('round-trips mode memory through localStorage', () => {
    writeModeMemory({ cards: '/cards?search=visa', save: '/deposits?kind=dps' });
    expect(readModeMemory()).toEqual({
      cards: '/cards?search=visa',
      save: '/deposits?kind=dps',
    });
  });
});
