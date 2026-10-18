import React from 'react';
import styled from 'styled-components';

import { useThemeContext } from '../hooks/ThemeProvider';
import { useLanguage, getCommonCopy } from '../locales';

const ToggleButton = styled.button`
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--typography-font-size-sm);
  font-weight: var(--typography-font-weight-medium);
  color: var(--color-text-primary);
  transition: var(--transition-preset-colors), var(--transition-preset-shadow);

  &:hover {
    background: var(--color-state-hover-surface);
    border-color: var(--color-border-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  &:active {
    background: var(--color-state-selected-surface);
  }

  @media (max-width: 640px) {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--typography-font-size-xs);
  }
`;

const IconSpan = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 1.2em;
`;

export interface ThemeToggleProps {
  /** Custom aria-label for the toggle button (defaults to localized "Toggle dark mode") */
  ariaLabel?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ ariaLabel }) => {
  const { isDark, toggleTheme } = useThemeContext();
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  return (
    <ToggleButton
      onClick={toggleTheme}
      aria-label={ariaLabel ?? common.themeToggleAriaLabel}
      aria-pressed={isDark}
      type="button"
    >
      <IconSpan aria-hidden="true">{isDark ? '☀️' : '🌙'}</IconSpan>
      <span>{ariaLabel ?? common.themeDark}</span>
    </ToggleButton>
  );
};

ThemeToggle.displayName = 'ThemeToggle';
