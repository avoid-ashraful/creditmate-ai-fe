import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { expectNoAxeViolations } from '../a11y/axe';
import App from '../App';
import { getGuide, guides, guidesForLanguage } from '../content/guides';
import { LanguageProvider } from '../locales';
import { server } from '../mocks/jest.setup';

import GuidesPage from './GuidesPage';

// Mock experiments to always return control
jest.mock('../lib/experiments', () => ({
  getVariant: () => 'control',
  isTreatment: () => false,
  isResultsViewEnabled: () => false,
  EXPERIMENTS: {
    hero_cta_text: {
      key: 'hero_cta_text',
      name: 'Hero CTA Text',
      treatmentAllocation: 50,
      enabled: true,
      minSampleSize: 100,
      confidenceLevel: 0.95,
    },
    quiz_vs_browse_default: {
      key: 'quiz_vs_browse_default',
      name: 'Quiz vs Browse Default',
      treatmentAllocation: 50,
      enabled: true,
      minSampleSize: 100,
      confidenceLevel: 0.95,
    },
    card_layout: {
      key: 'card_layout',
      name: 'Card Layout',
      treatmentAllocation: 50,
      enabled: true,
      minSampleSize: 100,
      confidenceLevel: 0.95,
    },
  },
}));

/**
 * <head> metadata lives outside the rendered body, so Testing Library queries
 * cannot reach it. These two helpers are the only direct DOM access in this
 * file and they only read/inspect document.head.
 */
// eslint-disable-next-line testing-library/no-node-access
const headQuery = (selector: string): Element | null => document.querySelector(selector);

const readMeta = (selector: string): string | null =>
  headQuery(selector)?.getAttribute('content') ?? null;

const readJsonLd = (id: string): Record<string, unknown> | null => {
  const node = headQuery(`script#${id}`);
  if (!node || !node.textContent) {
    return null;
  }
  return JSON.parse(node.textContent) as Record<string, unknown>;
};

// eslint-disable-next-line testing-library/no-node-access
const headCount = (selector: string): number => document.head.querySelectorAll(selector).length;

const renderGuides = (path: string, lang: 'en' | 'bn' = 'en') =>
  render(
    <LanguageProvider initialLang={lang}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/:slug" element={<GuidesPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
  window.history.pushState({}, '', '/');
});

// The guide -> Home route regression mounts HomePage, which fetches through the
// mocked API exactly like HomePage.test.tsx does.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GuidesPage index', () => {
  test('renders every English guide including the four required ones', () => {
    renderGuides('/guides');

    expect(
      screen.getByRole('heading', { level: 1, name: /credit card guides and how-tos/i })
    ).toBeInTheDocument();

    const list = screen.getByRole('navigation', { name: /user guides/i });
    // The index lists only the guides written in the selected language (QA #14),
    // so with the default English UI the Bengali slugs are not shown.
    const englishGuides = guidesForLanguage('en');
    expect(englishGuides).toEqual(guides.filter(guide => (guide.language ?? 'en') === 'en'));
    expect(within(list).getAllByRole('listitem')).toHaveLength(englishGuides.length);

    englishGuides.forEach(guide => {
      expect(within(list).getByRole('link', { name: guide.title })).toBeInTheDocument();
    });
    guides
      .filter(guide => guide.language === 'bn')
      .forEach(guide => {
        expect(within(list).queryByRole('link', { name: guide.title })).not.toBeInTheDocument();
      });

    // The four titles required by task 9.1 acceptance criteria.
    expect(screen.getByRole('link', { name: 'How to choose your first credit card' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Understanding annual fee waivers' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Maximizing lounge access benefits' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Credit card vs debit card in Bangladesh' })
    ).toBeTruthy();
  });

  test('lists the four acceptance-criteria slugs among all guides', () => {
    const allSlugs = guides.map(guide => guide.slug);
    expect(allSlugs).toContain('choosing-your-first-credit-card');
    expect(allSlugs).toContain('understanding-annual-fee-waivers');
    expect(allSlugs).toContain('maximizing-lounge-access-benefits');
    expect(allSlugs).toContain('credit-card-vs-debit-card');
    // New guides added in task 9.1 follow-up (English + Bengali)
    expect(allSlugs).toContain('create-account-sign-in');
    expect(allSlugs).toContain('save-share-comparison');
    expect(allSlugs).toContain('organize-cards-collections');
    expect(allSlugs).toContain('email-alerts-card-changes');
    expect(allSlugs).toContain('write-read-community-reviews');
    expect(allSlugs).toContain('advanced-search-filters');
    expect(allSlugs).toContain('switch-dark-mode-language');
    expect(allSlugs).toContain('how-creditmate-handles-your-data');
    expect(allSlugs).toContain('create-account-sign-in-bn');
    expect(allSlugs).toContain('save-share-comparison-bn');
    expect(allSlugs).toContain('organize-cards-collections-bn');
    expect(allSlugs).toContain('email-alerts-card-changes-bn');
    expect(allSlugs).toContain('write-read-community-reviews-bn');
    expect(allSlugs).toContain('advanced-search-filters-bn');
    expect(allSlugs).toContain('switch-dark-mode-language-bn');
    expect(allSlugs).toContain('how-creditmate-handles-your-data-bn');
  });

  test('sets index metadata and JSON-LD', () => {
    renderGuides('/guides');

    expect(document.title).toBe('Credit card guides and how-tos | CreditMate AI');

    const description = readMeta('meta[name="description"]');
    expect(description).toBeTruthy();
    expect(description).toContain('credit card');

    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/guides'
    );
    expect(readMeta('meta[property="og:title"]')).toBe(document.title);
    expect(readMeta('meta[property="og:url"]')).toBe('http://localhost/guides');
    expect(readMeta('meta[property="og:site_name"]')).toBe('CreditMate AI');
    expect(readMeta('meta[name="twitter:card"]')).toBe('summary');
    expect(readMeta('meta[name="robots"]')).toBe('index,follow');

    const structuredData = readJsonLd('guides-structured-data');
    expect(structuredData).toBeTruthy();
    expect(structuredData?.['@type']).toBe('CollectionPage');
    expect(structuredData?.['@context']).toBe('https://schema.org');

    const crumbs = readJsonLd('guides-breadcrumb-data');
    expect(crumbs?.['@type']).toBe('BreadcrumbList');
  });

  test('only links to routes the app implements', () => {
    renderGuides('/guides');

    // The filter panel lives on the home page, so the call to action starts there.
    expect(screen.getByRole('link', { name: /browse cards on the home page/i })).toHaveAttribute(
      'href',
      '/'
    );

    const hrefs = screen.getAllByRole('link').map(link => link.getAttribute('href'));
    // `/compare` only renders cards already selected on `/`, so it is never linked
    // from a guide as a browse/filter screen.
    expect(hrefs.filter(href => href === '/compare')).toHaveLength(0);
    // Two internal links per listed guide card (heading link + "Read guide" link).
    expect(hrefs.filter(href => href?.startsWith('/guides/'))).toHaveLength(
      guidesForLanguage('en').length * 2
    );
    hrefs.forEach(href => {
      expect(href).toMatch(/^\/$|^\/(about|compare|glossary)(\/|$)|^\/guides(\/|$)/);
    });
  });
});

describe('GuidesPage detail', () => {
  test('renders editorial guide links as working in-app links', () => {
    renderGuides('/guides/comparing-credit-cards-bn', 'bn');

    expect(
      screen.getByRole('heading', { level: 1, name: 'ক্রেডিট কার্ড কীভাবে তুলনা করবেন' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'সুদ ও এপিআর' })).toHaveAttribute(
      'href',
      '/guides/apr-interest-explained-bn'
    );
  });

  test('navigates from the index into a guide', () => {
    renderGuides('/guides');

    fireEvent.click(screen.getByRole('link', { name: 'Understanding annual fee waivers' }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Understanding annual fee waivers' })
    ).toBeInTheDocument();
    expect(document.title).toBe('Understanding annual fee waivers | CreditMate AI');
  });

  test('renders sections, breadcrumb and the authoritative sources', () => {
    renderGuides('/guides/choosing-your-first-credit-card');

    expect(
      screen.getByRole('heading', { level: 2, name: 'Check if you can get one' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Know your rights' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Sources' })).toBeInTheDocument();

    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(breadcrumb).getByRole('link', { name: 'Guides' })).toHaveAttribute(
      'href',
      '/guides'
    );

    const externalLinks = screen
      .getAllByRole('link')
      .filter(link => (link.getAttribute('href') ?? '').startsWith('http'));

    expect(externalLinks.length).toBeGreaterThan(0);
    expect(externalLinks.map(link => link.getAttribute('href'))).toContain(
      'https://www.bb.org.bd/mediaroom/circulars/brpd/mar152026brpd-19e.pdf'
    );
    externalLinks.forEach(link => {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  test('keeps the material qualifications from the Bangladesh Bank guideline', () => {
    renderGuides('/guides/choosing-your-first-credit-card');

    // BRPD-1 Circular No. 09 s.16(c): the 7 working day deadline applies only
    // when no outstanding balance exists.
    expect(
      screen.getByText(/if you owe nothing, the bank must close it within seven working days/i)
    ).toBeInTheDocument();
    // s.16(b): only the principal (main) cardholder may request closure.
    expect(
      screen.getByText(/only the main cardholder can ask to close a card/i)
    ).toBeInTheDocument();
    // s.12(g): the bank is liable only after it is told the card is lost/stolen.
    expect(screen.getByText(/once the bank knows the card is lost or stolen/i)).toBeInTheDocument();
    // s.7(f): a cash advance *may* have no interest free period - never "day one".
    expect(screen.getByText(/a cash advance may not get that free period/i)).toBeInTheDocument();
  });

  test('describes the real app flow: filter on the home page, then compare', () => {
    renderGuides('/guides/understanding-annual-fee-waivers');

    expect(screen.getByText(/start on our home page/i)).toBeInTheDocument();
    expect(screen.getByText(/tick the box marked has fee waiver policy/i)).toBeInTheDocument();

    // /compare only renders cards already selected on /, so a guide must never
    // present it as a browse or filter screen.
    const hrefs = screen.getAllByRole('link').map(link => link.getAttribute('href'));
    expect(hrefs).not.toContain('/compare');
  });

  test('sets article metadata with the guide date', () => {
    renderGuides('/guides/maximizing-lounge-access-benefits');

    expect(document.title).toBe('Maximizing lounge access benefits | CreditMate AI');
    expect(readMeta('meta[name="description"]')).toBe(
      guides.find(guide => guide.slug === 'maximizing-lounge-access-benefits')?.description
    );
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/guides/maximizing-lounge-access-benefits'
    );
    expect(readMeta('meta[property="og:type"]')).toBe('article');
    expect(screen.getByText(/^Updated 12 Oct 2026$/)).toHaveAttribute('datetime', '2026-10-12');

    const structuredData = readJsonLd('guides-structured-data');
    expect(structuredData?.['@type']).toBe('Article');
    expect(structuredData?.dateModified).toBe('2026-10-12');
    expect(structuredData?.headline).toBe('Maximizing lounge access benefits');
  });

  test('renders the comparison table with the sourced interest cap', () => {
    renderGuides('/guides/credit-card-vs-debit-card');

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Debit card' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Credit card' })).toBeInTheDocument();
    // The cap comes from Bangladesh Bank BRPD-1 Circular No. 09 (15 March 2026).
    expect(within(table).getByText(/up to 25 percent on what you owe/i)).toBeInTheDocument();
  });

  test('shows each FAQ on the page and in matching FAQPage markup', () => {
    renderGuides('/guides/understanding-annual-fee-waivers');

    const guide = getGuide('understanding-annual-fee-waivers');
    expect(guide).toBeDefined();
    guide?.faqs.forEach(faq => {
      expect(screen.getByRole('heading', { level: 3, name: faq.question })).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    });

    const faqData = readJsonLd('guides-faq-data');
    expect(faqData?.['@type']).toBe('FAQPage');
    expect(faqData?.mainEntity).toEqual(
      guide?.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      }))
    );
  });

  test('links each guide to the categories it relates to', () => {
    renderGuides('/guides/maximizing-lounge-access-benefits');

    const categoryLink = screen.getByRole('link', { name: 'Travel' });
    expect(categoryLink).toHaveAttribute('href', '/category/travel');
  });

  test('shows a friendly not-found state for an unknown slug', () => {
    renderGuides('/guides/does-not-exist');

    expect(screen.getByRole('heading', { level: 1, name: /guide not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see all guides/i })).toHaveAttribute(
      'href',
      '/guides'
    );
    expect(document.title).toBe('Guide not found | CreditMate AI');
  });
});

describe('App route integration', () => {
  test('header and footer expose /guides and the route renders the guides page', () => {
    window.history.pushState({}, '', '/guides');
    render(<App />);

    const guidesLinks = screen.getAllByRole('link', { name: 'Guides' });
    expect(guidesLinks.length).toBeGreaterThanOrEqual(2);
    guidesLinks.forEach(link => expect(link).toHaveAttribute('href', '/guides'));

    expect(
      screen.getByRole('heading', { level: 1, name: /credit card guides and how-tos/i })
    ).toBeInTheDocument();
  });

  test('navigating from a guide back to Home clears the guide metadata and restores what was there', async () => {
    // Tags that already existed before the SPA routed into a guide.
    const priorDescription = document.createElement('meta');
    priorDescription.setAttribute('name', 'description');
    priorDescription.setAttribute('content', 'Home page description');
    document.head.appendChild(priorDescription);
    const priorCanonical = document.createElement('link');
    priorCanonical.setAttribute('rel', 'canonical');
    priorCanonical.setAttribute('href', 'http://localhost/');
    document.head.appendChild(priorCanonical);
    document.title = 'CreditMate AI';

    window.history.pushState({}, '', '/guides/maximizing-lounge-access-benefits');
    render(<App />);

    // The guide owns <head> while it is on screen...
    expect(document.title).toBe('Maximizing lounge access benefits | CreditMate AI');
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/guides/maximizing-lounge-access-benefits'
    );
    expect(readMeta('meta[property="og:type"]')).toBe('article');
    expect(readMeta('meta[name="description"]')).not.toBe('Home page description');
    expect(readJsonLd('guides-structured-data')?.['@type']).toBe('Article');

    // HomePage now writes its own metadata, so leaving the guide must remove
    // everything the guides page wrote and replace it with Home's values.
    fireEvent.click(screen.getAllByRole('link', { name: 'Home' })[0]);
    expect(
      await screen.findByRole('heading', { level: 1, name: /find your perfect credit card/i })
    ).toBeInTheDocument();
    // Let HomePage's mocked API fetch settle inside act.
    expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();

    expect(document.title).toBe('Compare credit cards in Bangladesh | CreditMate AI');
    expect(readMeta('meta[name="description"]')).toMatch(/^Compare credit cards in Bangladesh/);
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe('http://localhost/');
    // Tags the guides page created are removed.
    expect(headQuery('script#guides-structured-data')).toBeNull();
    expect(headQuery('script#guides-breadcrumb-data')).toBeNull();
    expect(headQuery('script#guides-faq-data')).toBeNull();
    expect(readMeta('meta[property="og:type"]')).toBe('website');
    expect(readMeta('meta[property="og:url"]')).toBe('http://localhost/');
    expect(readMeta('meta[name="robots"]')).toBeNull();
    // The JSON-LD now comes from HomePage, not from the guide.
    expect(headQuery('script[data-seo-json-ld]')?.textContent).toContain('"WebSite"');
  });
});

describe('Head metadata lifecycle', () => {
  test('index -> detail -> index restores each view metadata without duplicating or losing tags', () => {
    // A tag the guides page never writes must survive every transition.
    const viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    document.head.appendChild(viewport);

    renderGuides('/guides');
    const metaCount = headCount('meta');

    fireEvent.click(screen.getByRole('link', { name: 'Understanding annual fee waivers' }));

    expect(document.title).toBe('Understanding annual fee waivers | CreditMate AI');
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/guides/understanding-annual-fee-waivers'
    );
    expect(readMeta('meta[property="og:type"]')).toBe('article');
    expect(readJsonLd('guides-structured-data')?.['@type']).toBe('Article');
    // The transition rewrites in place instead of piling up duplicate tags.
    expect(headCount('meta')).toBe(metaCount);
    expect(headQuery('meta[name="viewport"]')).toBe(viewport);

    fireEvent.click(screen.getByRole('link', { name: 'All guides' }));

    expect(document.title).toBe('Credit card guides and how-tos | CreditMate AI');
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/guides'
    );
    expect(readJsonLd('guides-structured-data')?.['@type']).toBe('CollectionPage');
    expect(headCount('meta')).toBe(metaCount);
    expect(headQuery('meta[name="viewport"]')).toBe(viewport);
    expect(headCount('link[rel="canonical"]')).toBe(1);
  });

  test('unmounting a guide restores the prior head state and removes only the tags it created', () => {
    const priorDescription = document.createElement('meta');
    priorDescription.setAttribute('name', 'description');
    priorDescription.setAttribute('content', 'Pre-existing description');
    document.head.appendChild(priorDescription);
    document.title = 'Pre-existing title';

    const { unmount } = renderGuides('/guides/choosing-your-first-credit-card');

    expect(document.title).toBe('How to choose your first credit card | CreditMate AI');
    expect(readMeta('meta[name="description"]')).not.toBe('Pre-existing description');
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost/guides/choosing-your-first-credit-card'
    );

    unmount();

    expect(document.title).toBe('Pre-existing title');
    // The original node is restored, not replaced by a fresh one.
    expect(headQuery('meta[name="description"]')).toBe(priorDescription);
    expect(readMeta('meta[name="description"]')).toBe('Pre-existing description');
    // Every node the helper created is gone.
    expect(headQuery('link[rel="canonical"]')).toBeNull();
    expect(headQuery('meta[name="robots"]')).toBeNull();
    expect(headQuery('meta[property="og:type"]')).toBeNull();
    expect(headQuery('meta[property="og:url"]')).toBeNull();
    expect(headQuery('meta[name="twitter:card"]')).toBeNull();
    expect(headQuery('script#guides-structured-data')).toBeNull();
    expect(headQuery('script#guides-breadcrumb-data')).toBeNull();
  });
});

describe('Accessibility', () => {
  it('guides index has no accessibility violations', async () => {
    const { container } = renderGuides('/guides');
    await expectNoAxeViolations(container);
  }, 15000);

  it('guide detail has no accessibility violations', async () => {
    const { container } = renderGuides('/guides/choosing-your-first-credit-card');
    await expectNoAxeViolations(container);
  }, 15000);

  it('guide not found has no accessibility violations', async () => {
    const { container } = renderGuides('/guides/does-not-exist');
    await expectNoAxeViolations(container);
  }, 15000);
});

describe('GuidesPage language wiring (QA #14)', () => {
  const renderGuidesLang = (path: string, lang: 'en' | 'bn', initialLang = lang) =>
    render(
      <LanguageProvider initialLang={initialLang}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:slug" element={<GuidesPage />} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    );

  test('the Bengali index lists the Bengali guides, titles and reading times', () => {
    renderGuidesLang('/guides', 'bn');

    expect(
      screen.getByRole('heading', { level: 1, name: 'ক্রেডিট কার্ড গাইড ও হাউ-টু' })
    ).toBeInTheDocument();

    const list = screen.getByRole('navigation', { name: /user guides/i });
    const bengaliGuides = guidesForLanguage('bn');
    expect(within(list).getAllByRole('listitem')).toHaveLength(bengaliGuides.length);
    // Bengali titles, categories and Bengali reading times, no English list entries.
    within(list)
      .getAllByRole('link', { name: 'আপনার প্রথম ক্রেডিট কার্ড বেছে নিন' })
      .forEach(link => expect(link).toBeInTheDocument());
    expect(within(list).getAllByText(/পড়া/).length).toBe(bengaliGuides.length);
    expect(
      within(list).queryByRole('link', { name: /annual fee waivers/i })
    ).not.toBeInTheDocument();
    expect(within(list).queryByText(/min read/)).not.toBeInTheDocument();
  });

  test('opening an English slug in Bengali shows the paired Bengali guide', () => {
    renderGuidesLang('/guides/understanding-annual-fee-waivers', 'bn');

    expect(
      screen.getByRole('heading', { level: 1, name: 'বার্ষিক ফি মওকুফ বুঝুন' })
    ).toBeInTheDocument();
    // Category and reading time render in Bengali as well.
    expect(screen.getByText('শুরু করা')).toBeInTheDocument();
    expect(screen.getAllByText('৩ মিনিট পড়া').length).toBeGreaterThan(0);
  });

  test('opening a Bengali slug in English shows the paired English guide', () => {
    renderGuidesLang('/guides/save-share-comparison-bn', 'en');

    expect(
      screen.getByRole('heading', { level: 1, name: /Save and share a comparison/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });
});
