import React from 'react';

import { useThemeContext } from '../hooks/ThemeProvider';
import { useLanguage, getCommonCopy } from '../locales';

import './ThemeToggle.css';

export interface ThemeToggleProps {
  /** Custom aria-label for the toggle button (defaults to localized "Toggle dark mode") */
  ariaLabel?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ ariaLabel }) => {
  const { isDark, toggleTheme } = useThemeContext();
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={ariaLabel ?? common.themeToggleAriaLabel}
      aria-pressed={isDark}
      type="button"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span>{ariaLabel ?? common.themeDark}</span>
    </button>
  );
};

ThemeToggle.displayName = 'ThemeToggle';
