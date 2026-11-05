import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

import { expectNoAxeViolations } from './a11y/axe';
import { AppContent, PageViewTrackerWrapper } from './App';
import { AuthProvider } from './hooks/AuthProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import { ANALYTICS_EVENTS, analytics } from './lib/analytics';
import { LanguageProvider } from './locales';

jest.mock('./services/api');

/** Records the current location so redirect behaviour can be asserted. */
let lastLocation = '';
let lastFrom = '';
const LocationProbe: React.FC = () => {
  const location = useLocation();
  lastLocation = `${location.pathname}${location.search}`;
  lastFrom = (location.state as { from?: string } | null)?.from ?? '';
  return null;
};

/**
 * Renders the app shell with language support, theme support and an in-memory router.
 *
 * The routes exercised here (glossary, about) are static pages that do not
 * fetch from the API, so the suite stays deterministic without MSW.
 */
const renderApp = (entry = '/glossary', initialLang: 'en' | 'bn' = 'en') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ThemeProvider>
        <LanguageProvider initialLang={initialLang}>
          <AuthProvider>
            <LocationProbe />
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

const railNav = () => screen.getByRole('navigation', { name: 'Main navigation' });

describe('App routing', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('exposes the four modes plus Banks and Learn in the rail', () => {
    renderApp('/login');
    const nav = railNav();
    expect(within(nav).getByRole('link', { name: /Cards/ })).toHaveAttribute('href', '/cards');
    expect(within(nav).getByRole('link', { name: /Save/ })).toHaveAttribute('href', '/deposits');
    expect(within(nav).getByRole('link', { name: /Borrow/ })).toHaveAttribute('href', '/loans');
    // Tools mode lands on the Plan workspace (Phase 3); the calculators
    // live inside it and /calculators redirects there.
    expect(within(nav).getByRole('link', { name: /Tools/ })).toHaveAttribute('href', '/plan');
    expect(within(nav).getByRole('link', { name: /Banks/ })).toHaveAttribute('href', '/banks');
    expect(within(nav).getByRole('link', { name: /Learn/ })).toHaveAttribute('href', '/guides');
    expect(lastLocation).toBe('/login');
  });

  it('marks only the active sub-item with aria-current, never the mode link', () => {
    renderApp('/glossary');
    const nav = railNav();
    // /glossary belongs to Learn; its sub-navigation is expanded. The mode
    // link points at the remembered Learn URL, so it must not claim to be
    // the current page — the Glossary sub NavLink is the single source.
    expect(within(nav).getByRole('link', { name: /Learn/ })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Glossary' })).toHaveAttribute(
      'href',
      '/glossary'
    );
    expect(within(nav).getByRole('link', { name: 'Glossary' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(within(nav).getByRole('link', { name: /Cards/ })).not.toHaveAttribute('aria-current');
  });

  it('renders the glossary page at /glossary', () => {
    renderApp('/glossary');
    expect(screen.getByRole('heading', { name: 'Financial Terms Glossary' })).toBeInTheDocument();
  });

  it('renders the login page at /login', () => {
    renderApp('/login');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });

  it('sends anonymous visitors from /account to the login page', () => {
    renderApp('/account');
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your account' })).not.toBeInTheDocument();
  });

  it('redirects the retired personal paths under /my (guard then sends anonymous users to login)', () => {
    renderApp('/saved');
    // /saved -> /my/saved -> ProtectedRoute -> /login for anonymous visitors.
    expect(lastLocation).toBe('/login');
  });

  it('redirects /search to /cards preserving the query string', () => {
    renderApp('/search?categories=travel&page=2');
    expect(lastLocation).toBe('/cards?categories=travel&page=2');
  });

  it('redirects /category/:slug to /cards with the category filter applied', () => {
    renderApp('/category/travel');
    expect(lastLocation).toBe('/cards?categories=travel');
  });

  it('redirects /category/islamic to the Islamic filter, not categories=islamic', () => {
    renderApp('/category/islamic');
    // The backend canonical taxonomy has no `islamic` slug: categories=islamic
    // would return zero results. The local slug maps to is_islamic instead.
    expect(lastLocation).toBe('/cards?is_islamic=true');
  });

  it('preserves the query string on /category redirects, category taking precedence', () => {
    renderApp('/category/travel?utm_source=guide&page=2');
    expect(lastLocation).toBe('/cards?categories=travel&utm_source=guide&page=2');
  });

  it('preserves the query string on the retired personal-path redirects', () => {
    renderApp('/saved?tab=searches');
    // Anonymous visitors end at /login, but ProtectedRoute remembers the
    // intended destination — which must include the original query string.
    expect(lastLocation).toBe('/login');
    expect(lastFrom).toBe('/my/saved?tab=searches');
  });

  it('localizes the footer copyright line', () => {
    const { unmount } = renderApp('/about', 'en');
    expect(screen.getByText(/© \d{4} CreditMate AI\. All rights reserved\./)).toBeInTheDocument();
    unmount();
    renderApp('/about', 'bn');
    expect(screen.getByText(/© \d{4} CreditMate AI\. সর্বস্বত্ব সংরক্ষিত।/)).toBeInTheDocument();
  });

  it('offers Sign in and Register in the rail when signed out', () => {
    renderApp('/glossary');
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: 'Register' })[0]).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('renders the About page at /about', () => {
    renderApp('/about');
    expect(screen.getByRole('heading', { name: 'About CreditMate AI' })).toBeInTheDocument();
  });

  it('navigates between pages via the rail sub-navigation', async () => {
    const user = userEvent.setup();
    renderApp('/glossary');

    await user.click(within(railNav()).getByRole('link', { name: 'Methodology' }));
    expect(lastLocation).toBe('/methodology');

    await user.click(within(railNav()).getByRole('link', { name: 'Glossary' }));
    expect(screen.getByRole('heading', { name: 'Financial Terms Glossary' })).toBeInTheDocument();
  });

  it('opens the command palette with Ctrl+K and closes it with Escape', async () => {
    renderApp('/glossary');
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('dialog', { name: /Search/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('App language switcher', () => {
  it('renders English mode labels by default and Bengali after toggling', async () => {
    const user = userEvent.setup();
    renderApp('/about', 'en');

    const nav = railNav();
    expect(within(nav).getByRole('link', { name: /Cards/ })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Glossary' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Language/ })[0]);
    expect(within(nav).getByRole('link', { name: /কার্ড/ })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'শব্দকোষ' })).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /ভাষা/ })[0]);
    expect(within(nav).getByRole('link', { name: /Cards/ })).toBeInTheDocument();
  });
});

describe('App analytics', () => {
  const provider = jest.fn();

  beforeEach(() => {
    process.env.REACT_APP_ANALYTICS_KEY = 'test-key';
    provider.mockClear();
    analytics.setProvider(provider);
    analytics.optIn();
  });

  afterEach(() => {
    analytics.setProvider(null);
    analytics.optIn();
    process.env.REACT_APP_ANALYTICS_KEY = '';
  });

  it('tracks one page view for the current route', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Routes>
          <Route path="/about" element={<PageViewTrackerWrapper />} />
        </Routes>
      </MemoryRouter>
    );

    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.pageView,
      properties: {},
    });
  });
});

describe('App accessibility', () => {
  it('has a skip link that targets main content', () => {
    renderApp('/about');
    const skipLink = screen.getByRole('link', { name: 'Skip to content' });
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('has proper landmark structure', () => {
    renderApp('/about');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('has no accessibility violations on the app shell', async () => {
    const { container } = renderApp('/about');
    await expectNoAxeViolations(container);
  }, 15000);

  it('has no accessibility violations on the login page', async () => {
    const { container } = renderApp('/login');
    await expectNoAxeViolations(container);
  }, 15000);
});
