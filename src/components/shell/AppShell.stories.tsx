import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../../hooks/AuthProvider';
import { ShortlistProvider } from '../../hooks/ShortlistProvider';
import { ThemeProvider } from '../../hooks/ThemeProvider';
import { LanguageProvider } from '../../locales';
import type { AuthClient } from '../../services/auth';

import AppShell from './AppShell';
import './Shell.css';

/**
 * The app shell as the Midnight Ledger spine (redesign plan V2, P1):
 * ink-navy rail / top bar / bottom bar in both themes, the gold
 * mate-point on the active mode and the gold shortlist count. Switch
 * the Storybook theme toolbar — the spine stays navy either way.
 */

/** Minimal anonymous auth client (same shape as AccountMenu stories). */
const anonymousClient = {
  hasSession: () => false,
  subscribe: (cb: (active: boolean) => void) => {
    cb(false);
    return () => {};
  },
  restoreSession: async () => null,
  login: async () => ({
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
    access: 'mock',
    refresh: 'mock',
  }),
  register: async () => ({
    user: { id: 1, email: 'test@example.com', name: 'Test User' },
    access: 'mock',
    refresh: 'mock',
  }),
  logout: async () => {},
};

const seedShortlist = (): void => {
  window.localStorage.setItem(
    'creditmate.shortlist.v1',
    JSON.stringify([
      {
        vertical: 'cards',
        key: '42',
        name: 'Example Card',
        bankName: 'Example Bank',
        detailHref: '/card/example-bank/example-card',
        cardId: 42,
      },
      {
        vertical: 'cards',
        key: '7',
        name: 'Second Card',
        bankName: 'Second Bank',
        detailHref: '/card/second-bank/second-card',
        cardId: 7,
      },
    ])
  );
};

const ShellAt: React.FC<{ route: string }> = ({ route }) => (
  <MemoryRouter initialEntries={[route]}>
    <ThemeProvider>
      <LanguageProvider initialLang="en">
        <AuthProvider client={anonymousClient as unknown as AuthClient}>
          <ShortlistProvider>
            <AppShell>
              <Routes>
                <Route
                  path="*"
                  element={
                    <div>
                      <h1>Compare credit cards</h1>
                      <p>Page body — the shell is the story here.</p>
                    </div>
                  }
                />
              </Routes>
            </AppShell>
          </ShortlistProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </MemoryRouter>
);

export default {
  title: 'Shell/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'desktop' },
    layout: 'fullscreen',
  },
};

/* Cards mode active on desktop: navy rail, gold mate-point, sub-nav. */
export const LedgerSpine = () => <ShellAt route="/cards" />;

/* Shortlist seeded: the rail count becomes the gold pill, and on
   mobile widths the tray bar appears above the navy bottom bar. */
export const WithShortlist = () => {
  seedShortlist();
  return <ShellAt route="/cards" />;
};

/* Mobile: navy top bar and bottom bar, mate-point on the active mode. */
export const MobileSpine = {
  render: () => <ShellAt route="/" />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
