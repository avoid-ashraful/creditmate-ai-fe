/**
 * Public surface for localization utilities.
 *
 * Usage:
 *   import { useLanguage, formatBdtCurrency, glossaryTerms } from '../locales';
 */

export * from './types';
export * from './format';
export * from './glossary';
export * from './auth';
export * from './saved';
export * from './common';
export * from './alerts';
export * from './reviews';
export * from './cardDetail';
export * from './detail';
export * from './categories';
export * from './shell';
export * from './discovery';
export * from './home';
export * from './changes';
export * from './resultCard';
// Full legal text is imported from './legal' by the lazy pages only (keeps it out of main).
export * from './legalNav';
export {
  LanguageProvider,
  LanguageContext,
  useLanguage,
  detectInitialLanguage,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
} from './LanguageContext';
export type { LanguageContextValue, LanguageProviderProps } from './LanguageContext';
