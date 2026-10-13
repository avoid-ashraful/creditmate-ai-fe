import { slugify } from './slugify';

/**
 * Pure sitemap and robots helpers (task 10.4).
 *
 * `scripts/generate-sitemap.mjs` loads this module with a small TypeScript
 * loader and writes `public/sitemap.xml` and `public/robots.txt` at build time.
 * Keeping the logic here lets Jest cover it without running the script.
 */

export interface SitemapEntry {
  /** Path relative to the site origin, starting with "/". */
  path: string;
  /** Optional W3C date (YYYY-MM-DD) for the page's last modification. */
  lastmod?: string;
}

/** Shape of one credit card in the list API response. Only the fields used here. */
export interface CardListItem {
  name?: string;
  bank_name?: string;
  bank?: { name?: string } | null;
  is_active?: boolean;
  modified?: string;
}

export interface CardListResponse {
  results?: CardListItem[];
  next?: string | null;
}

export interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal }
) => Promise<FetchResponseLike>;

export interface CardEntriesResult {
  entries: SitemapEntry[];
  /** Set when card pages were skipped entirely; the sitemap is still written without them. */
  skippedReason?: string;
  /** Cards dropped because they were inactive or lacked a bank or card name. */
  skippedCards: number;
}

export const CARD_PAGE_SIZE = 100;
export const CARD_FETCH_TIMEOUT_MS = 10000;
export const MAX_CARD_PAGES = 50;

/** Routes that do not depend on data. Keep in step with the routes in src/App.tsx. */
export const STATIC_PATHS: readonly string[] = [
  '/',
  '/compare',
  '/perfect-card-finder',
  '/reward-calculator',
  '/guides',
  '/glossary',
  '/about',
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;

/**
 * Returns the origin only (scheme, host, port). Throws for anything that is not
 * an absolute http(s) URL, so a bad SITE_URL fails the build instead of
 * writing broken sitemap entries.
 */
export const normalizeOrigin = (origin: string): string => {
  const url = new URL(origin);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Site origin must use http or https: ${origin}`);
  }
  return url.origin;
};

export const cardPathFor = (bankName: string, cardName: string): string | null => {
  const bankSlug = slugify(bankName);
  const cardSlug = slugify(cardName);
  if (!bankSlug || !cardSlug) {
    return null;
  }
  return `/card/${bankSlug}/${cardSlug}`;
};

const toLastmod = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const match = DATE_PATTERN.exec(value);
  return match ? match[0] : undefined;
};

/**
 * Turns a list API page into sitemap entries. Inactive cards and cards without
 * a usable bank or card name are counted in `skippedCards` and left out.
 */
export const cardEntriesFromPage = (
  response: CardListResponse
): { entries: SitemapEntry[]; skippedCards: number } => {
  const entries: SitemapEntry[] = [];
  let skippedCards = 0;

  (response.results ?? []).forEach(card => {
    const bankName = card.bank?.name ?? card.bank_name ?? '';
    const path = card.name && card.is_active !== false ? cardPathFor(bankName, card.name) : null;
    if (!path) {
      skippedCards += 1;
      return;
    }
    entries.push({ path, lastmod: toLastmod(card.modified) });
  });

  return { entries, skippedCards };
};

/**
 * Fetches every card page from a list endpoint, following `next` links.
 *
 * Never throws. A missing URL, a network error, a non-OK status or a malformed
 * body returns no entries plus a `skippedReason`, so the build can still write
 * a sitemap with the static, category and guide URLs.
 */
export const fetchCardEntries = async (
  apiUrl: string | undefined,
  fetchImpl: FetchLike
): Promise<CardEntriesResult> => {
  if (!apiUrl) {
    return {
      entries: [],
      skippedReason: 'SITEMAP_CARDS_API_URL is not set',
      skippedCards: 0,
    };
  }

  let firstUrl: URL;
  try {
    firstUrl = new URL(apiUrl);
  } catch {
    return { entries: [], skippedReason: `Invalid card API URL: ${apiUrl}`, skippedCards: 0 };
  }
  if (!firstUrl.searchParams.has('page_size')) {
    firstUrl.searchParams.set('page_size', String(CARD_PAGE_SIZE));
  }

  const entries: SitemapEntry[] = [];
  let skippedCards = 0;
  let nextUrl: string | null = firstUrl.toString();
  let pages = 0;

  try {
    while (nextUrl && pages < MAX_CARD_PAGES) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CARD_FETCH_TIMEOUT_MS);
      let response: FetchResponseLike;
      try {
        response = await fetchImpl(nextUrl, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        return {
          entries: [],
          skippedReason: `Card API responded with HTTP ${response.status}`,
          skippedCards: 0,
        };
      }

      const body = (await response.json()) as CardListResponse;
      if (!body || !Array.isArray(body.results)) {
        return {
          entries: [],
          skippedReason: 'Card API response has no results array',
          skippedCards: 0,
        };
      }

      const page = cardEntriesFromPage(body);
      entries.push(...page.entries);
      skippedCards += page.skippedCards;
      pages += 1;
      nextUrl = body.next ? new URL(body.next, nextUrl).toString() : null;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { entries: [], skippedReason: `Card API request failed: ${message}`, skippedCards: 0 };
  }

  return { entries, skippedCards };
};

export interface SitemapSources {
  staticPaths?: readonly string[];
  categorySlugs: readonly string[];
  guides: readonly { slug: string; updated?: string }[];
  cards: readonly SitemapEntry[];
}

/**
 * Builds the ordered, de-duplicated URL list: static routes, categories,
 * guides, then cards. The first occurrence of a path wins.
 */
export const buildSitemapEntries = ({
  staticPaths = STATIC_PATHS,
  categorySlugs,
  guides,
  cards,
}: SitemapSources): SitemapEntry[] => {
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];
  const add = (entry: SitemapEntry) => {
    if (seen.has(entry.path)) return;
    seen.add(entry.path);
    entries.push(entry);
  };

  staticPaths.forEach(path => add({ path }));
  categorySlugs.forEach(slug => add({ path: `/category/${slug}` }));
  add({ path: '/guides' });
  guides.forEach(guide =>
    add({ path: `/guides/${guide.slug}`, lastmod: toLastmod(guide.updated) })
  );
  cards.forEach(add);

  return entries;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const buildSitemapXml = (origin: string, entries: readonly SitemapEntry[]): string => {
  const siteOrigin = normalizeOrigin(origin);
  const urls = entries.map(entry => {
    const loc = escapeXml(`${siteOrigin}${entry.path}`);
    const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
    return `  <url>\n    <loc>${loc}</loc>${lastmod}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
};

export const buildRobotsTxt = (origin: string): string =>
  ['User-agent: *', 'Allow: /', '', `Sitemap: ${normalizeOrigin(origin)}/sitemap.xml`, ''].join(
    '\n'
  );
