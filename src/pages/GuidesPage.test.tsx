import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import App from '../App';
import { guides } from '../content/guides';
import { server } from '../mocks/jest.setup';

import GuidesPage from './GuidesPage';

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

const renderGuides = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidesPage />} />
      </Routes>
    </MemoryRouter>
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
  test('renders the four required guides', () => {
    renderGuides('/guides');

    expect(
      screen.getByRole('heading', { level: 1, name: /credit card guides and how-tos/i })
    ).toBeInTheDocument();

    const list = screen.getByRole('navigation', { name: /user guides/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(guides.length);

    guides.forEach(guide => {
      expect(within(list).getByRole('link', { name: guide.title })).toBeInTheDocument();
    });

    // The four titles required by task 9.1 acceptance criteria.
    expect(screen.getByRole('link', { name: 'How to choose your first credit card' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Understanding annual fee waivers' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Maximizing lounge access benefits' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Credit card vs debit card in Bangladesh' })
    ).toBeTruthy();
  });

  test('lists exactly the four acceptance-criteria slugs', () => {
    expect(guides.map(guide => guide.slug)).toEqual([
      'choosing-your-first-credit-card',
      'understanding-annual-fee-waivers',
      'maximizing-lounge-access-benefits',
      'credit-card-vs-debit-card',
    ]);
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
    // Two internal links per guide card (heading link + "Read guide" link).
    expect(hrefs.filter(href => href?.startsWith('/guides/'))).toHaveLength(guides.length * 2);
    hrefs.forEach(href => {
      expect(href).toMatch(/^\/$|^\/(about|compare|glossary)(\/|$)|^\/guides(\/|$)/);
    });
  });
});

describe('GuidesPage detail', () => {
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

    // ...but HomePage has no metadata of its own, so leaving the guide must
    // roll back everything the guides page wrote.
    fireEvent.click(screen.getAllByRole('link', { name: 'Home' })[0]);
    expect(
      await screen.findByRole('heading', { level: 1, name: /find your perfect credit card/i })
    ).toBeInTheDocument();
    // Let HomePage's mocked API fetch settle inside act.
    expect(await screen.findByText(/Test Credit Card/i)).toBeInTheDocument();

    expect(document.title).toBe('CreditMate AI');
    // Pre-existing tags are restored to their prior values.
    expect(readMeta('meta[name="description"]')).toBe('Home page description');
    expect(headQuery('link[rel="canonical"]')?.getAttribute('href')).toBe('http://localhost/');
    // Tags the guides page created are removed.
    expect(headQuery('script#guides-structured-data')).toBeNull();
    expect(headQuery('script#guides-breadcrumb-data')).toBeNull();
    expect(headQuery('meta[property="og:type"]')).toBeNull();
    expect(headQuery('meta[property="og:url"]')).toBeNull();
    expect(readMeta('meta[name="robots"]')).toBeNull();
    expect(readMeta('meta[name="twitter:card"]')).toBeNull();
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
