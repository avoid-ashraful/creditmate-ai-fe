/**
 * Mode model for the Phase 1 shell (plan Section 2.1).
 *
 * Navigation is organised by the user's job: four modes (Cards, Save,
 * Borrow, Tools) plus Banks, Learn and My CreditMate. Each mode remembers
 * the last discovery/tool route visited inside it, so switching away and
 * back returns to the same filters and scenario — the URL carries the
 * state, the memory only remembers which URL.
 */

export type ModeId = 'cards' | 'save' | 'borrow' | 'tools' | 'banks' | 'learn' | 'my';

export interface ModeSubItem {
  to: string;
  labelKey: string;
}

export interface ModeDefinition {
  id: ModeId;
  /** Route used when the mode has no remembered route yet. */
  landing: string;
  /** Sub-destinations shown under the mode while it is active. */
  subs: Array<{ to: string; label: string }>;
  /** Path prefixes that belong to this mode. */
  prefixes: string[];
  /**
   * Routes worth remembering as the mode's return target. Detail pages are
   * deliberately excluded — returning to a mode should land on discovery,
   * not on a stale product page.
   */
  memorable: string[];
}

export const MODE_DEFINITIONS: ModeDefinition[] = [
  {
    id: 'cards',
    landing: '/cards',
    subs: [{ to: '/cards', label: 'subCardsDiscover' }],
    prefixes: ['/cards', '/card/', '/search', '/category/'],
    memorable: ['/cards'],
  },
  {
    id: 'save',
    landing: '/deposits',
    subs: [
      { to: '/deposits', label: 'subDeposits' },
      { to: '/accounts', label: 'subAccounts' },
    ],
    prefixes: ['/deposits', '/accounts'],
    memorable: ['/deposits', '/accounts'],
  },
  {
    id: 'borrow',
    landing: '/loans',
    subs: [{ to: '/loans', label: 'subLoans' }],
    prefixes: ['/loans'],
    memorable: ['/loans'],
  },
  {
    id: 'tools',
    landing: '/calculators',
    subs: [
      { to: '/calculators', label: 'subCalculators' },
      { to: '/reward-calculator', label: 'subRewardCalculator' },
      { to: '/compare', label: 'subCompare' },
      { to: '/eligibility-checker', label: 'subEligibility' },
      { to: '/perfect-card-finder', label: 'subQuiz' },
    ],
    prefixes: [
      '/calculators',
      '/reward-calculator',
      '/compare',
      '/eligibility-checker',
      '/perfect-card-finder',
      '/plan',
    ],
    memorable: [
      '/calculators',
      '/reward-calculator',
      '/compare',
      '/eligibility-checker',
      '/perfect-card-finder',
    ],
  },
  {
    id: 'banks',
    landing: '/banks',
    subs: [{ to: '/banks', label: 'navBanks' }],
    prefixes: ['/banks', '/bank/'],
    memorable: ['/banks'],
  },
  {
    id: 'learn',
    landing: '/guides',
    subs: [
      { to: '/guides', label: 'subGuides' },
      { to: '/methodology', label: 'subMethodology' },
      { to: '/glossary', label: 'subGlossary' },
    ],
    prefixes: ['/guides', '/glossary', '/methodology', '/about'],
    memorable: ['/guides', '/glossary', '/methodology'],
  },
  {
    id: 'my',
    landing: '/my',
    subs: [
      { to: '/my', label: 'subMyHome' },
      { to: '/my/saved', label: 'subMySaved' },
      { to: '/my/alerts', label: 'subMyAlerts' },
      { to: '/my/profile', label: 'subMyProfile' },
    ],
    prefixes: ['/my'],
    memorable: ['/my', '/my/saved', '/my/alerts', '/my/profile'],
  },
];

const prefixMatches = (pathname: string, prefix: string): boolean =>
  pathname === prefix ||
  pathname.startsWith(`${prefix}/`) ||
  (prefix.endsWith('/') && pathname.startsWith(prefix));

export const modeForPath = (pathname: string): ModeId | null => {
  for (const mode of MODE_DEFINITIONS) {
    if (mode.prefixes.some(prefix => prefixMatches(pathname, prefix))) return mode.id;
  }
  return null;
};

export const isMemorablePath = (pathname: string): boolean =>
  MODE_DEFINITIONS.some(mode => mode.memorable.includes(pathname));

export const MODE_MEMORY_KEY = 'creditmate.modeMemory.v1';

export type ModeMemory = Partial<Record<ModeId, string>>;

export const readModeMemory = (): ModeMemory => {
  try {
    const raw = window.localStorage.getItem(MODE_MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ModeMemory;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

export const writeModeMemory = (memory: ModeMemory): void => {
  try {
    window.localStorage.setItem(MODE_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Non-fatal.
  }
};

/** The route a mode's rail/bottom-bar button should navigate to. */
export const modeTarget = (mode: ModeDefinition, memory: ModeMemory): string =>
  memory[mode.id] ?? mode.landing;
