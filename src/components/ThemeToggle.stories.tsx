import React from 'react';

import { ThemeProvider } from '../hooks/ThemeProvider';

import { ThemeToggle } from './ThemeToggle';

export default {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  argTypes: {
    ariaLabel: { control: 'text', description: 'Accessible label for the toggle button' },
  },
  decorators: [
    (Story: React.FC) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

/* State: default light mode */
export const LightMode = () => <ThemeToggle />;

/* State: dark mode (simulated by toggling) */
export const DarkMode = () => {
  // This story shows the component in dark mode context
  return <ThemeToggle />;
};

/* State: with custom aria label */
export const CustomAriaLabel = () => (
  <ThemeToggle ariaLabel="Switch between light and dark theme" />
);

/* State: multiple toggles (should sync) */
export const MultipleToggles = () => (
  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    <ThemeToggle ariaLabel="First theme toggle" />
    <ThemeToggle ariaLabel="Second theme toggle" />
    <ThemeToggle ariaLabel="Third theme toggle" />
  </div>
);

/* State: in a toolbar context */
export const InToolbar = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      border: '1px solid var(--color-border-base)',
      borderRadius: 'var(--radius-md)',
    }}
  >
    <span style={{ fontWeight: 500 }}>Theme:</span>
    <ThemeToggle />
    <span
      style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}
    >
      Light/Dark
    </span>
  </div>
);
