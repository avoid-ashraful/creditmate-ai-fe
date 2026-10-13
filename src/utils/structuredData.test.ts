import { SITE_NAME } from '../content/guides';

import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from './structuredData';

const ORIGIN = 'https://creditmate.example';

describe('organizationJsonLd', () => {
  test('describes the site operator with its home URL', () => {
    const data = organizationJsonLd(ORIGIN);

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${ORIGIN}/`,
    });
    expect(data.description).toEqual(expect.any(String));
  });
});

describe('websiteJsonLd', () => {
  test('declares a SearchAction that targets the ?search= query on the home page', () => {
    const data = websiteJsonLd(ORIGIN);

    expect(data).toMatchObject({
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${ORIGIN}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${ORIGIN}/?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    });
  });
});

describe('breadcrumbJsonLd', () => {
  test('numbers crumbs from 1 and makes every item an absolute URL', () => {
    const data = breadcrumbJsonLd(ORIGIN, [
      { name: 'Home', path: '/' },
      { name: 'Travel', path: '/category/travel' },
    ]);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Travel', item: `${ORIGIN}/category/travel` },
      ],
    });
  });
});

describe('faqPageJsonLd', () => {
  test('maps each question and answer to a Question with an Answer', () => {
    const data = faqPageJsonLd([
      { question: 'What is an annual fee?', answer: 'A yearly charge.' },
    ]);

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is an annual fee?',
          acceptedAnswer: { '@type': 'Answer', text: 'A yearly charge.' },
        },
      ],
    });
  });

  test('returns an empty mainEntity for a guide without questions', () => {
    expect(faqPageJsonLd([]).mainEntity).toEqual([]);
  });
});
