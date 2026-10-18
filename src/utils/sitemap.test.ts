import {
  buildRobotsTxt,
  buildSitemapEntries,
  buildSitemapXml,
  cardEntriesFromPage,
  cardPathFor,
  fetchCardEntries,
  FetchLike,
  normalizeOrigin,
  STATIC_PATHS,
} from './sitemap';

const GOLD_CARD = 'Gold';

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('normalizeOrigin', () => {
  test('keeps only scheme, host and port', () => {
    expect(normalizeOrigin('https://creditmate.example/some/path/')).toBe(
      'https://creditmate.example'
    );
    expect(normalizeOrigin('http://localhost:3000')).toBe('http://localhost:3000');
  });

  test('rejects non-http schemes and malformed values', () => {
    expect(() => normalizeOrigin('ftp://example.com')).toThrow(/http or https/);
    expect(() => normalizeOrigin('creditmate.example')).toThrow();
  });
});

describe('cardPathFor', () => {
  test('matches the slugs used by the card detail route', () => {
    expect(cardPathFor('Eastern Bank Limited', 'EBL Platinum Card')).toBe(
      '/card/eastern-bank-limited/ebl-platinum-card'
    );
  });

  test('returns null when either slug is empty', () => {
    expect(cardPathFor('', GOLD_CARD)).toBeNull();
    expect(cardPathFor('City Bank', '!!!')).toBeNull();
  });
});

describe('cardEntriesFromPage', () => {
  test('uses nested bank name, falls back to bank_name, and skips inactive or incomplete cards', () => {
    const result = cardEntriesFromPage({
      results: [
        { name: GOLD_CARD, bank: { name: 'City Bank' }, is_active: true },
        { name: 'Silver', bank_name: 'BRAC Bank', modified: '2026-09-01T10:00:00Z' },
        { name: 'Retired', bank_name: 'BRAC Bank', is_active: false },
        { name: 'No bank', is_active: true },
        { bank_name: 'Nameless Bank', is_active: true },
      ],
    });

    expect(result.entries).toEqual([
      { path: '/card/city-bank/gold', lastmod: undefined },
      { path: '/card/brac-bank/silver', lastmod: '2026-09-01' },
    ]);
    expect(result.skippedCards).toBe(3);
  });

  test('treats a missing results array as an empty page', () => {
    expect(cardEntriesFromPage({})).toEqual({ entries: [], skippedCards: 0 });
  });
});

describe('fetchCardEntries', () => {
  test('skips card pages without an error when no URL is configured', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>();

    const result = await fetchCardEntries(undefined, fetchImpl);

    expect(result).toEqual({
      entries: [],
      skippedReason: 'SITEMAP_CARDS_API_URL is not set',
      skippedCards: 0,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('reports an unparseable URL instead of throwing', async () => {
    const result = await fetchCardEntries('not a url', jest.fn());

    expect(result.entries).toEqual([]);
    expect(result.skippedReason).toMatch(/Invalid card API URL/);
  });

  test('follows next links, requests a page size and collects every page', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async url => {
      if (url.includes('page=2')) {
        return jsonResponse({
          next: null,
          results: [{ name: GOLD_CARD, bank: { name: 'City Bank' }, is_active: true }],
        });
      }
      return jsonResponse({
        next: '/api/v1/credit-cards/?page=2',
        results: [{ name: 'Silver', bank_name: 'BRAC Bank', is_active: true }],
      });
    });

    const result = await fetchCardEntries(
      'https://api.example.com/api/v1/credit-cards/',
      fetchImpl
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'https://api.example.com/api/v1/credit-cards/?page_size=100'
    );
    expect(fetchImpl.mock.calls[1][0]).toBe('https://api.example.com/api/v1/credit-cards/?page=2');
    expect(result.entries.map(entry => entry.path)).toEqual([
      '/card/brac-bank/silver',
      '/card/city-bank/gold',
    ]);
    expect(result.skippedReason).toBeUndefined();
  });

  test('keeps an existing page_size parameter', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () =>
      jsonResponse({ next: null, results: [] })
    );

    await fetchCardEntries('https://api.example.com/cards/?page_size=25', fetchImpl);

    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.example.com/cards/?page_size=25');
  });

  test('returns no entries when the API responds with an error status', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () =>
      jsonResponse({}, 503)
    );

    const result = await fetchCardEntries('https://api.example.com/cards/', fetchImpl);

    expect(result).toEqual({
      entries: [],
      skippedReason: 'Card API responded with HTTP 503',
      skippedCards: 0,
    });
  });

  test('drops everything from a partial run when a later page fails', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async url =>
      url.includes('page=2')
        ? jsonResponse({}, 500)
        : jsonResponse({ next: 'https://api.example.com/cards/?page=2', results: [] })
    );

    const result = await fetchCardEntries('https://api.example.com/cards/', fetchImpl);

    expect(result.entries).toEqual([]);
    expect(result.skippedReason).toBe('Card API responded with HTTP 500');
  });

  test('reports a network failure as a skip reason', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () => {
      throw new Error('connect ECONNREFUSED');
    });

    const result = await fetchCardEntries('https://api.example.com/cards/', fetchImpl);

    expect(result.entries).toEqual([]);
    expect(result.skippedReason).toBe('Card API request failed: connect ECONNREFUSED');
  });

  test('rejects a body without a results array', async () => {
    const fetchImpl = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>(async () =>
      jsonResponse({ detail: 'Not found' })
    );

    const result = await fetchCardEntries('https://api.example.com/cards/', fetchImpl);

    expect(result.skippedReason).toBe('Card API response has no results array');
  });
});

describe('buildSitemapEntries', () => {
  test('lists static routes, categories, guides, then cards without duplicates', () => {
    const entries = buildSitemapEntries({
      categorySlugs: ['travel', 'cashback'],
      guides: [{ slug: 'first-card', updated: '2026-10-12' }],
      cards: [
        { path: '/card/city-bank/gold' },
        { path: '/card/city-bank/gold', lastmod: '2026-01-01' },
      ],
    });

    const paths = entries.map(entry => entry.path);
    expect(paths.slice(0, STATIC_PATHS.length)).toEqual([...STATIC_PATHS]);
    expect(paths.slice(STATIC_PATHS.length)).toEqual([
      '/category/travel',
      '/category/cashback',
      '/guides/first-card',
      '/card/city-bank/gold',
    ]);
    expect(entries.find(entry => entry.path === '/guides/first-card')).toEqual({
      path: '/guides/first-card',
      lastmod: '2026-10-12',
    });
  });

  test('does not duplicate a static path that a category also produces', () => {
    const entries = buildSitemapEntries({
      staticPaths: ['/category/travel'],
      categorySlugs: ['travel'],
      guides: [],
      cards: [],
    });

    expect(entries.filter(entry => entry.path === '/category/travel')).toHaveLength(1);
  });
});

describe('buildSitemapXml', () => {
  test('writes absolute URLs with lastmod and escapes XML characters', () => {
    const xml = buildSitemapXml('https://creditmate.example/', [
      { path: '/' },
      { path: '/card/a&b/gold', lastmod: '2026-10-12' },
    ]);

    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://creditmate.example/</loc>',
        '  </url>',
        '  <url>',
        '    <loc>https://creditmate.example/card/a&amp;b/gold</loc>',
        '    <lastmod>2026-10-12</lastmod>',
        '  </url>',
        '</urlset>',
        '',
      ].join('\n')
    );
  });
});

describe('buildRobotsTxt', () => {
  test('omits the Sitemap line when no origin is configured', () => {
    expect(buildRobotsTxt()).toBe('User-agent: *\nAllow: /\n');
  });

  test('allows crawling and points at the sitemap on the same origin', () => {
    expect(buildRobotsTxt('https://creditmate.example')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://creditmate.example/sitemap.xml\n'
    );
  });
});
