import React, { useEffect } from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/hooks/ThemeProvider';
import { LanguageProvider } from '../src/locales';
import { MotionProvider } from '../src/animations/MotionProvider';

import '../src/styles/fonts.css';
import '../src/styles/index.css';
import '../src/styles/tokens.css';

/**
 * Drives the app's real theme mechanism from the Storybook theme toolbar.
 * Tokens switch on the `:root.dark` / `:root.light` classes in
 * src/styles/tokens.css — the same classes ThemeProvider applies in the app.
 * This wrapper is the decorator's outermost element, so on mount its effect
 * runs after ThemeProvider's own localStorage/system resolution and the
 * toolbar choice wins; on unmount it restores the classes that were there
 * before, so the app preview state does not leak between stories.
 */
const StorybookThemeSync: React.FC<{ theme: string; children: React.ReactNode }> = ({
  theme,
  children,
}) => {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const hadLight = root.classList.contains('light');
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme !== 'dark');
    return () => {
      root.classList.toggle('dark', hadDark);
      root.classList.toggle('light', hadLight);
    };
  }, [theme]);

  return <>{children}</>;
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      manualAddonSteps: false,
    },
    viewport: {
      viewports: {
        mobile1: { name: 'Mobile 375px', styles: { width: '375px', height: '667px' } },
        mobile2: { name: 'Mobile 414px', styles: { width: '414px', height: '896px' } },
        tablet: { name: 'Tablet 768px', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop 1200px', styles: { width: '1200px', height: '800px' } },
      },
      defaultViewport: 'tablet',
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'bn', title: 'বাংলা' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      const locale = context.globals.locale;

      return (
        <StorybookThemeSync theme={theme}>
          <ThemeProvider>
            <LanguageProvider initialLang={locale}>
              <MotionProvider>
                <div style={{ minHeight: '100vh' }}>
                  <Story />
                </div>
              </MotionProvider>
            </LanguageProvider>
          </ThemeProvider>
        </StorybookThemeSync>
      );
    },
  ],
};

export default preview;
