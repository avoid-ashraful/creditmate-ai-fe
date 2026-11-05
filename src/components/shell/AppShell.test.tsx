import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '../../hooks/AuthProvider';
import { ShortlistProvider } from '../../hooks/ShortlistProvider';
import { ThemeProvider } from '../../hooks/ThemeProvider';
import { LanguageProvider } from '../../locales';

import AppShell from './AppShell';

const seedShortlist = () => {
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
    ])
  );
};

const renderShellAt = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ShortlistProvider>
              <AppShell>
                <Routes>
                  <Route path="*" element={<p>page body</p>} />
                </Routes>
              </AppShell>
            </ShortlistProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

/** The mobile standalone shortlist bar (plan Section 6). */
const trayBarButton = () => screen.queryByRole('button', { name: 'Shortlist · 1' });

describe('AppShell mobile shortlist tray bar (plan Section 6)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    seedShortlist();
  });

  it.each(['/', '/cards', '/deposits', '/loans', '/accounts'])(
    'shows on the discovery/listing route %s',
    route => {
      renderShellAt(route);
      expect(trayBarButton()).toBeInTheDocument();
    }
  );

  it.each([
    '/card/example-bank/example-card',
    '/deposits/alpha-fdr',
    '/loans/alpha-loan',
    '/accounts/alpha-savings',
    '/calculators',
    '/reward-calculator',
    '/compare',
    '/glossary',
  ])('is suppressed on detail/calculator/plan route %s', route => {
    renderShellAt(route);
    expect(trayBarButton()).not.toBeInTheDocument();
  });

  it('never shows with an empty shortlist', () => {
    window.localStorage.clear();
    renderShellAt('/cards');
    expect(trayBarButton()).not.toBeInTheDocument();
  });
});
