import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Language } from './types';

/** localStorage key used to persist the user's language choice. */
export const LANGUAGE_STORAGE_KEY = 'user-lang';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'bn'];

/** Narrow an unknown value to a supported {@link Language}. */
export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'bn';
}

/**
 * Decide the initial language from a stored preference and the browser locale.
 * A stored, supported preference always wins; otherwise any `bn*` browser
 * locale selects Bengali; everything else defaults to English.
 */
export function detectInitialLanguage(
  stored: string | null | undefined,
  navigatorLanguage: string | null | undefined
): Language {
  if (isLanguage(stored)) return stored;
  if (navigatorLanguage && navigatorLanguage.toLowerCase().startsWith('bn')) return 'bn';
  return 'en';
}

export interface LanguageContextValue {
  lang: Language;
  /** Set the language explicitly and persist the choice. */
  setLang: (lang: Language) => void;
  /** Flip between English and Bengali. */
  toggleLang: () => void;
}

const DEFAULT_LANGUAGE_CONTEXT: LanguageContextValue = {
  lang: 'en',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLang: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleLang: () => {},
};

export const LanguageContext = createContext<LanguageContextValue>(DEFAULT_LANGUAGE_CONTEXT);

export interface LanguageProviderProps {
  children: React.ReactNode;
  /** Force an initial language (used by tests and server rendering). */
  initialLang?: Language;
}

/**
 * Provides the active language to the React tree and persists changes to
 * `localStorage`. This is intentionally minimal: it switches labels and content
 * that are genuinely translated, and does not imply that every page is
 * translated.
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLang }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (initialLang) return initialLang;
    if (typeof window === 'undefined') return 'en';
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    return detectInitialLanguage(
      stored,
      typeof navigator === 'undefined' ? null : navigator.language
    );
  });

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); language still updates in memory.
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState(previous => {
      const next: Language = previous === 'bn' ? 'en' : 'bn';
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang }),
    [lang, setLang, toggleLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

/** Access the active language. Falls back to English when no provider is present. */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  return context ?? DEFAULT_LANGUAGE_CONTEXT;
}

export { SUPPORTED_LANGUAGES };
