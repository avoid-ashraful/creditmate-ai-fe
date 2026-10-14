import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  detectInitialLanguage,
  isLanguage,
  useLanguage,
} from './LanguageContext';

const STORAGE_KEY = LANGUAGE_STORAGE_KEY;

describe('detectInitialLanguage', () => {
  it('prefers a stored supported preference', () => {
    expect(detectInitialLanguage('bn', undefined)).toBe('bn');
    expect(detectInitialLanguage('en', 'bn-BD')).toBe('en');
  });

  it('detects Bengali browser locales', () => {
    expect(detectInitialLanguage(null, 'bn')).toBe('bn');
    expect(detectInitialLanguage(undefined, 'bn-BD')).toBe('bn');
  });

  it('defaults to English otherwise', () => {
    expect(detectInitialLanguage(null, undefined)).toBe('en');
    expect(detectInitialLanguage(null, 'en-US')).toBe('en');
    expect(detectInitialLanguage('fr', 'fr-FR')).toBe('en');
  });
});

describe('isLanguage', () => {
  it('accepts only the two supported languages', () => {
    expect(isLanguage('en')).toBe(true);
    expect(isLanguage('bn')).toBe(true);
    expect(isLanguage('fr')).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });
});

describe('LanguageProvider', () => {
  const Probe: React.FC = () => {
    const { lang, setLang, toggleLang } = useLanguage();
    return (
      <div>
        <span data-testid="lang">{lang}</span>
        <button type="button" onClick={() => setLang('bn')}>
          set bn
        </button>
        <button type="button" onClick={() => setLang('en')}>
          set en
        </button>
        <button type="button" onClick={toggleLang}>
          toggle
        </button>
      </div>
    );
  };

  const renderProbe = (initialLang?: 'en' | 'bn') => {
    localStorage.clear();
    return render(
      <LanguageProvider initialLang={initialLang}>
        <Probe />
      </LanguageProvider>
    );
  };

  it('defaults to English when nothing is stored', () => {
    renderProbe();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });

  it('honours an explicit initialLang', () => {
    renderProbe('bn');
    expect(screen.getByTestId('lang')).toHaveTextContent('bn');
  });

  it('restores a stored preference on mount', () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, 'bn');
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    expect(screen.getByTestId('lang')).toHaveTextContent('bn');
  });

  it('updates state and persists the choice when setLang is called', async () => {
    const user = userEvent.setup();
    renderProbe();
    expect(screen.getByTestId('lang')).toHaveTextContent('en');

    await user.click(screen.getByText('set bn'));
    expect(screen.getByTestId('lang')).toHaveTextContent('bn');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('bn');

    await user.click(screen.getByText('set en'));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('toggles between languages and persists', async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByText('toggle'));
    expect(screen.getByTestId('lang')).toHaveTextContent('bn');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('bn');

    await user.click(screen.getByText('toggle'));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});

describe('useLanguage outside a provider', () => {
  it('falls back to English default context', () => {
    const Broken: React.FC = () => {
      const { lang, setLang, toggleLang } = useLanguage();
      return (
        <div>
          <span data-testid="lang">{lang}</span>
          <button type="button" onClick={() => setLang('bn')}>
            set bn
          </button>
          <button type="button" onClick={toggleLang}>
            toggle
          </button>
        </div>
      );
    };
    render(<Broken />);
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    // setLang and toggleLang are no-ops when no provider is present
    fireEvent.click(screen.getByText('set bn'));
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
  });
});
