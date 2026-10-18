#!/usr/bin/env node
/**
 * Writes public/sitemap.xml and public/robots.txt (task 10.4).
 *
 * URLs come from the app's own sources: static routes, categories and guides.
 * Card pages are added only when SITEMAP_CARDS_API_URL points at the card list
 * endpoint. If it is unset or unreachable, the card URLs are skipped and the
 * build continues.
 *
 * Environment:
 *   SITE_URL (or REACT_APP_SITE_URL)  public origin, e.g. https://example.com.
 *                                     If neither is set the script warns, removes
 *                                     public/sitemap.xml and writes robots.txt
 *                                     without a Sitemap line (never localhost).
 *   SITEMAP_CARDS_API_URL             optional card list URL, e.g.
 *                                     https://api.example.com/api/v1/credit-cards/
 *
 * Runs automatically before `npm run build` (see the prebuild script).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadTsModule } from './lib/load-ts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const load = relativePath => loadTsModule(path.join(root, relativePath));

const sitemap = load('src/utils/sitemap.ts');
const { guides } = load('src/content/guides.ts');
const { CATEGORIES } = load('src/config/categories.ts');

const main = async () => {
  const rawOrigin = process.env.REACT_APP_SITE_URL || process.env.SITE_URL;
  if (!rawOrigin) {
    // A sitemap needs absolute URLs; do not invent one (and never ship localhost).
    console.warn(
      'WARNING: REACT_APP_SITE_URL / SITE_URL is not set. Skipping sitemap.xml and the ' +
        'robots.txt Sitemap line. Set it for production builds.'
    );
    fs.mkdirSync(publicDir, { recursive: true });
    fs.rmSync(path.join(publicDir, 'sitemap.xml'), { force: true });
    fs.writeFileSync(path.join(publicDir, 'robots.txt'), sitemap.buildRobotsTxt());
    return;
  }
  const origin = sitemap.normalizeOrigin(rawOrigin);

  const cardResult = await sitemap.fetchCardEntries(
    process.env.SITEMAP_CARDS_API_URL,
    (url, init) => fetch(url, init)
  );
  if (cardResult.skippedReason) {
    console.warn(`Card pages skipped: ${cardResult.skippedReason}`);
  }
  if (cardResult.skippedCards > 0) {
    console.warn(`Skipped ${cardResult.skippedCards} inactive or incomplete cards.`);
  }

  const entries = sitemap.buildSitemapEntries({
    categorySlugs: CATEGORIES.map(category => category.slug),
    guides,
    cards: cardResult.entries,
  });

  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap.buildSitemapXml(origin, entries));
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), sitemap.buildRobotsTxt(origin));

  const cardCount = entries.filter(entry => entry.path.startsWith('/card/')).length;
  console.log(
    `Wrote ${entries.length} URLs to public/sitemap.xml ` +
      `(static and category/guide pages: ${
        entries.length - cardCount
      }, card pages: ${cardCount}) ` +
      `for ${origin}`
  );
};

main().catch(error => {
  console.error('Sitemap generation failed:', error);
  process.exitCode = 1;
});
