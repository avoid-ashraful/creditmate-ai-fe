/**
 * Lightweight document head management for SEO (react-helmet not installed).
 *
 * `setSeoMeta` writes title, description, canonical, Open Graph, Twitter and
 * optional JSON-LD. `resetSeoMeta` restores whatever was there before, so the
 * page that sets metadata can unmount without leaving stale tags behind.
 */

import { SITE_NAME } from '../content/guides';

export interface SeoMetaOptions {
  title: string;
  description: string;
  /** Path such as "/category/travel". Also sets og:url and the canonical link. */
  canonicalPath?: string;
  /** Open Graph type. Defaults to "website". */
  ogType?: 'website' | 'article';
  /** One or more JSON-LD objects, written as a single application/ld+json script. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

interface ManagedMetaTag {
  tag: HTMLMetaElement;
  previousContent: string | null;
  created: boolean;
}

let createdMetaTags: ManagedMetaTag[] = [];
let previousTitle: string | null = null;
let managedCanonical: HTMLLinkElement | null = null;
let previousCanonicalHref: string | null = null;
let createdCanonical = false;
let managedJsonLd: HTMLScriptElement | null = null;
const JSON_LD_ATTRIBUTE = 'data-seo-json-ld';

const findMetaTag = (attribute: 'name' | 'property', key: string) =>
  document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

const setMetaTag = (attribute: 'name' | 'property', key: string, content: string): void => {
  const currentTag = findMetaTag(attribute, key);
  const managedTag = createdMetaTags.find(managed => managed.tag === currentTag);

  if (managedTag) {
    managedTag.tag.setAttribute('content', content);
    return;
  }

  let tag = currentTag;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
    createdMetaTags.push({ tag, previousContent: null, created: true });
  } else {
    createdMetaTags.push({ tag, previousContent: tag.getAttribute('content'), created: false });
  }

  tag.setAttribute('content', content);
};

const toAbsoluteUrl = (path: string): string => `${window.location.origin}${path}`;

const setCanonicalLink = (href: string): void => {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
    managedCanonical = link;
    previousCanonicalHref = null;
    createdCanonical = true;
  } else if (!managedCanonical) {
    managedCanonical = link;
    previousCanonicalHref = link.getAttribute('href');
    createdCanonical = false;
  }
  link.setAttribute('href', href);
};

const setJsonLd = (data: SeoMetaOptions['jsonLd']): void => {
  managedJsonLd?.remove();
  managedJsonLd = null;
  if (!data) return;

  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute(JSON_LD_ATTRIBUTE, '');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
  managedJsonLd = script;
};

export const setSeoMeta = (options: SeoMetaOptions): void => {
  if (previousTitle === null) {
    previousTitle = document.title;
  }
  document.title = options.title;

  setMetaTag('name', 'description', options.description);
  setMetaTag('property', 'og:title', options.title);
  setMetaTag('property', 'og:description', options.description);
  setMetaTag('property', 'og:type', options.ogType ?? 'website');
  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('name', 'twitter:card', 'summary');
  setMetaTag('name', 'twitter:title', options.title);
  setMetaTag('name', 'twitter:description', options.description);

  if (options.canonicalPath) {
    const url = toAbsoluteUrl(options.canonicalPath);
    setMetaTag('property', 'og:url', url);
    setCanonicalLink(url);
  }

  setJsonLd(options.jsonLd);
};

export const resetSeoMeta = (): void => {
  if (previousTitle !== null) {
    document.title = previousTitle;
  }

  createdMetaTags.forEach(({ tag, previousContent, created }) => {
    if (created) {
      tag.parentNode?.removeChild(tag);
      return;
    }
    if (previousContent === null) {
      tag.removeAttribute('content');
    } else {
      tag.setAttribute('content', previousContent);
    }
  });
  createdMetaTags = [];

  if (managedCanonical) {
    if (createdCanonical) {
      managedCanonical.parentNode?.removeChild(managedCanonical);
    } else if (previousCanonicalHref === null) {
      managedCanonical.removeAttribute('href');
    } else {
      managedCanonical.setAttribute('href', previousCanonicalHref);
    }
    managedCanonical = null;
  }

  previousCanonicalHref = null;
  createdCanonical = false;

  managedJsonLd?.remove();
  managedJsonLd = null;

  previousTitle = null;
};
