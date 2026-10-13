import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AppContent, NAV_ITEMS, PageViewTrackerWrapper } from './App';
import { ThemeProvider } from './hooks/ThemeProvider';
import { ANALYTICS_EVENTS, analytics } from './lib/analytics';
import { LanguageProvider } from './locales';

jest.mock('./services/api');

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
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

const headerNav = () => screen.getByRole('navigation', { name: 'Main navigation' });

describe('App routing', () => {
  it('exposes a nav entry and route for every primary page', () => {
    expect(NAV_ITEMS.length).toBeGreaterThanOrEqual(6);
    const hrefs = NAV_ITEMS.map(item => item.to);
    expect(hrefs).toContain('/glossary');
    expect(hrefs).toContain('/about');
    expect(hrefs).toContain('/compare');
    expect(hrefs).toContain('/reward-calculator');
  });

  it('renders the glossary page at /glossary', () => {
    renderApp('/glossary');
    expect(screen.getByRole('heading', { name: 'Financial Terms Glossary' })).toBeInTheDocument();
  });

  it('renders the About page at /about', () => {
    renderApp('/about');
    expect(screen.getByRole('heading', { name: 'About CreditMate AI' })).toBeInTheDocument();
  });

  it('navigates between pages via the header nav', async () => {
    const user = userEvent.setup();
    renderApp('/glossary');

    await user.click(within(headerNav()).getByRole('link', { name: 'About' }));
    expect(screen.getByRole('heading', { name: 'About CreditMate AI' })).toBeInTheDocument();

    await user.click(within(headerNav()).getByRole('link', { name: 'Glossary' }));
    expect(screen.getByRole('heading', { name: 'Financial Terms Glossary' })).toBeInTheDocument();
  });

  it('renders correct hrefs for the primary nav links', () => {
    renderApp('/glossary');
    const nav = headerNav();
    NAV_ITEMS.forEach(item => {
      expect(within(nav).getByRole('link', { name: item.en })).toHaveAttribute('href', item.to);
    });
  });
});

describe('App language switcher', () => {
  it('renders English nav labels by default and Bengali after toggling', async () => {
    const user = userEvent.setup();
    renderApp('/glossary', 'en');

    const nav = headerNav();
    expect(within(nav).getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Glossary' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch to Bengali' }));
    expect(within(nav).getByRole('link', { name: 'হোম' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'শব্দকোষ' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Glossary' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch to English' }));
    expect(within(nav).getByRole('link', { name: 'Glossary' })).toBeInTheDocument();
  });

  it('localizes the footer copyright line', async () => {
    const user = userEvent.setup();
    renderApp('/glossary', 'en');

    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch to Bengali' }));
    expect(screen.getByText(/সর্বস্বত্ব সংরক্ষিত/)).toBeInTheDocument();
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
