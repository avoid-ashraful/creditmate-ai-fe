// Prevent Flash of Unstyled Content (FOUC): Initialize theme before app renders.
// This script must be in the <head> before stylesheets to avoid flashing the wrong theme.
// Uses the same logic as React hooks for consistency.
(function initializeTheme() {
  const THEME_STORAGE_KEY = 'creditmate-theme';
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const html = document.documentElement;

  if (storedTheme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
  } else if (storedTheme === 'light') {
    html.classList.add('light');
    html.classList.remove('dark');
  } else {
    // No manual override: apply system preference
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
        html.classList.remove('light');
      } else {
        html.classList.add('light');
        html.classList.remove('dark');
      }
    } catch {
      // If matchMedia is not available, default to light
      html.classList.add('light');
      html.classList.remove('dark');
    }
  }
})();
