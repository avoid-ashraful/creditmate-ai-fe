import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AppContent } from './App';
import { CONTACT_EMAIL } from './config/site';
import { AuthProvider } from './hooks/AuthProvider';
import { ThemeProvider } from './hooks/ThemeProvider';
import { LanguageProvider, LEGAL_COPY, LEGAL_PAGE_PATHS, type LegalPageKey } from './locales';

jest.mock('./services/api');

const renderApp = (entry: string, initialLang: 'en' | 'bn' = 'en') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ThemeProvider>
        <LanguageProvider initialLang={initialLang}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

const KEYS = Object.keys(LEGAL_PAGE_PATHS) as LegalPageKey[];

describe('legal and trust pages', () => {
  it.each(KEYS)('renders %s in English with the draft banner', key => {
    renderApp(LEGAL_PAGE_PATHS[key]);
    expect(
      screen.getByRole('heading', { level: 1, name: LEGAL_COPY.en.pages[key].title })
    ).toBeInTheDocument();
    expect(screen.getByText('Draft — pending legal review')).toBeInTheDocument();
  });

  it.each(KEYS)('renders %s in Bengali with the draft banner', key => {
    renderApp(LEGAL_PAGE_PATHS[key], 'bn');
    expect(
      screen.getByRole('heading', { level: 1, name: LEGAL_COPY.bn.pages[key].title })
    ).toBeInTheDocument();
    expect(screen.getByText(LEGAL_COPY.bn.draftBanner)).toBeInTheDocument();
  });

  it('has real text for every page in both languages', () => {
    KEYS.forEach(key => {
      (['en', 'bn'] as const).forEach(lang => {
        const page = LEGAL_COPY[lang].pages[key];
        expect(page.sections.length).toBeGreaterThanOrEqual(2);
        page.sections.forEach(section => {
          expect(
            (section.paragraphs?.length ?? 0) + (section.bullets?.length ?? 0)
          ).toBeGreaterThan(0);
        });
      });
    });
  });

  it('privacy page covers data, consent, retention, rights and opt-in analytics', () => {
    renderApp('/privacy');
    [
      'What data we collect',
      'Consent',
      'Analytics',
      'How long we keep data',
      'Your rights',
    ].forEach(heading =>
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    );
    expect(
      screen.getByText(/Analytics is off\. No analytics events are sent unless you opt in/)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Personal Data Protection Ordinance 2025/).length).toBeGreaterThan(
      0
    );
  });

  it('contact page links the configured email address', () => {
    renderApp('/contact');
    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${CONTACT_EMAIL}`
    );
  });

  it('shows a helpful 404 page for unknown routes', () => {
    renderApp('/definitely-not-a-page');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('link', { name: 'Go to the home page' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(within(main).getByRole('link', { name: 'Search credit cards' })).toHaveAttribute(
      'href',
      '/search'
    );
  });

  it('links every trust page from the footer', () => {
    renderApp('/about');
    const legalNav = screen.getByRole('navigation', { name: 'Legal' });
    KEYS.forEach(key => {
      expect(
        within(legalNav).getByRole('link', { name: LEGAL_COPY.en.pages[key].title })
      ).toHaveAttribute('href', LEGAL_PAGE_PATHS[key]);
    });
  });
});
