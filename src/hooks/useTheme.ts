import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'creditmate-theme';
const LIGHT_THEME = 'light';
const DARK_THEME = 'dark';

export type Theme = typeof LIGHT_THEME | typeof DARK_THEME;

interface UseThemeReturn {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return LIGHT_THEME;
  }
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    return mq.matches ? DARK_THEME : LIGHT_THEME;
  } catch {
    return LIGHT_THEME;
  }
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    // Prevent flash: check localStorage and prefers-color-scheme immediately
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    let resolvedTheme: Theme;

    if (storedTheme) {
      resolvedTheme = storedTheme;
    } else {
      resolvedTheme = getSystemTheme();
    }

    setThemeState(resolvedTheme);
    applyTheme(resolvedTheme);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (!storedTheme) {
          const newTheme = e.matches ? DARK_THEME : LIGHT_THEME;
          setThemeState(newTheme);
          applyTheme(newTheme);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // If matchMedia fails, just don't listen for system changes
      return undefined;
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    setTheme(newTheme);
  };

  return {
    theme: theme || LIGHT_THEME,
    isDark: theme === DARK_THEME,
    setTheme,
    toggleTheme,
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === DARK_THEME) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}
