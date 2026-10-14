import { SITE_NAME } from '../content/guides';

import {
  aggregateRatingJsonLd,
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

describe('aggregateRatingJsonLd', () => {
  test('returns AggregateRating with ratingValue, reviewCount, bestRating, worstRating', () => {
    const data = aggregateRatingJsonLd({ ratingValue: 4.2, reviewCount: 15 });

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'AggregateRating',
      ratingValue: 4.2,
      reviewCount: 15,
      bestRating: 5,
      worstRating: 1,
    });
  });

  test('rounds ratingValue to one decimal place', () => {
    const data = aggregateRatingJsonLd({ ratingValue: 4.25, reviewCount: 10 });
    expect(data?.ratingValue).toBe(4.3);
  });

  test('allows custom bestRating and worstRating', () => {
    const data = aggregateRatingJsonLd({
      ratingValue: 8,
      reviewCount: 5,
      bestRating: 10,
      worstRating: 1,
    });
    expect(data).toMatchObject({ bestRating: 10, worstRating: 1 });
  });

  test('returns null when count is 0', () => {
    expect(aggregateRatingJsonLd({ ratingValue: 4.5, reviewCount: 0 })).toBeNull();
  });

  test('returns null when ratingValue is null', () => {
    expect(
      aggregateRatingJsonLd({ ratingValue: null as unknown as number, reviewCount: 10 })
    ).toBeNull();
  });

  test('returns null when ratingValue is undefined', () => {
    expect(
      aggregateRatingJsonLd({ ratingValue: undefined as unknown as number, reviewCount: 10 })
    ).toBeNull();
  });

  test('returns null when data is null', () => {
    expect(aggregateRatingJsonLd(null)).toBeNull();
  });
});
