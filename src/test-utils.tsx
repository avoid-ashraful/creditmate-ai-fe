import { render, RenderOptions } from '@testing-library/react';
import React from 'react';

import { LanguageProvider } from './locales/LanguageContext';

/**
 * Custom render function that wraps the UI with LanguageProvider.
 * This ensures components using useLanguage() work correctly in tests.
 */
export const renderWithLanguage = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(<LanguageProvider initialLang="en">{ui}</LanguageProvider>, options);
};

export * from '@testing-library/react';
