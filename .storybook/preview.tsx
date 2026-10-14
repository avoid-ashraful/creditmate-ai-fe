import React from 'react';
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/hooks/ThemeProvider';
import { LanguageProvider } from '../src/locales';
import { MotionProvider } from '../src/animations/MotionProvider';

import '../src/styles/index.css';
import '../src/styles/tokens.css';

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
        <ThemeProvider>
          <LanguageProvider initialLang={locale}>
            <MotionProvider>
              <div data-theme={theme} style={{ minHeight: '100vh' }}>
                <Story />
              </div>
            </MotionProvider>
          </LanguageProvider>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
