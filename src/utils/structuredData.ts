import { SITE_DESCRIPTION, SITE_NAME } from '../content/guides';

/**
 * JSON-LD builders shared by the pages (task 10.4). Each returns a plain object
 * that `setSeoMeta` serialises into an application/ld+json script.
 *
 * `origin` is passed in, not read from window, so the output can be unit tested.
 */

export interface BreadcrumbCrumb {
  name: string;
  /** Path relative to the origin, starting with "/". */
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

const CONTEXT = 'https://schema.org';

export const organizationJsonLd = (origin: string) => ({
  '@context': CONTEXT,
  '@type': 'Organization',
  name: SITE_NAME,
  url: `${origin}/`,
  description: SITE_DESCRIPTION,
});

/**
 * WebSite with a SearchAction. The home page reads `?search=` and prefills its
 * search box, so the template points at a page that really handles the query.
 */
export const websiteJsonLd = (origin: string) => ({
  '@context': CONTEXT,
  '@type': 'WebSite',
  name: SITE_NAME,
  url: `${origin}/`,
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${origin}/?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const breadcrumbJsonLd = (origin: string, crumbs: BreadcrumbCrumb[]) => ({
  '@context': CONTEXT,
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${origin}${crumb.path}`,
  })),
});

/**
 * FAQPage markup. Only use it for questions and answers that are also visible
 * on the page, as search engines require.
 */
export const faqPageJsonLd = (faqs: readonly FaqItem[]) => ({
  '@context': CONTEXT,
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});
