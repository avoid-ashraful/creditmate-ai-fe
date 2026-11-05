/**
 * Canonical discovery URL for a local category slug (redesign Phase 1).
 *
 * Most local category slugs are also backend canonical categories and map
 * to the `categories` filter. `islamic` is the exception: it exists only in
 * the frontend's local taxonomy (src/config/categories.ts) as a filter
 * bundle over `isIslamic`, and the backend canonical taxonomy has no such
 * slug — `/cards?categories=islamic` returns zero results (DB path) or is
 * silently ignored (Elasticsearch path). It therefore maps to the
 * discovery Islamic filter parameter (`is_islamic`, the UI-state param of
 * services/advancedSearch) instead.
 */
export const categoryDiscoveryPath = (slug: string): string =>
  slug === 'islamic' ? '/cards?is_islamic=true' : `/cards?categories=${encodeURIComponent(slug)}`;
