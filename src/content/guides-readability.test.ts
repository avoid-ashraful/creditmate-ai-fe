import { glossaryTerms } from '../locales/glossary';

import { guides } from './guides';
import { scoreEnglishGuide } from './readability';

describe('guide editorial quality', () => {
  test('every English guide is below an eighth-grade Flesch-Kincaid estimate', () => {
    const english = guides.filter(guide => (guide.language ?? 'en') === 'en');
    expect(english.length).toBeGreaterThan(0);
    const scores = english.map(guide => ({ slug: guide.slug, ...scoreEnglishGuide(guide) }));
    const failures = scores.filter(score => score.grade >= 8);
    expect(failures).toEqual([]);
  });

  test('required consumer guides exist in both languages and internal links resolve', () => {
    const required = [
      'choosing-your-first-credit-card',
      'understanding-annual-fee-waivers',
      'maximizing-lounge-access-benefits',
      'credit-card-vs-debit-card',
      'apr-interest-explained',
      'comparing-credit-cards',
    ];
    required.forEach(slug => {
      expect(guides.some(guide => guide.slug === slug && guide.language === 'en')).toBe(true);
      expect(guides.some(guide => guide.slug === `${slug}-bn` && guide.language === 'bn')).toBe(
        true
      );
    });
    const slugs = new Set(guides.map(guide => guide.slug));
    guides.forEach(guide => {
      const copy = [
        guide.description,
        ...guide.sections.flatMap(section => [
          ...section.paragraphs,
          ...(section.bullets ?? []),
          ...(section.steps ?? []),
        ]),
        ...guide.faqs.flatMap(faq => [faq.question, faq.answer]),
      ].join(' ');
      const links = Array.from(copy.matchAll(/\[[^\]]+\]\(([^)]+)\)/g), match => match[1]);
      links.forEach(link => expect(slugs.has(link)).toBe(true));
    });
  });

  test('Bengali guide copy uses reviewed glossary labels and contains no mixed scripts', () => {
    const bengali = guides.filter(guide => guide.language === 'bn');
    expect(bengali.length).toBeGreaterThan(0);
    bengali.forEach(guide => {
      const copy = [
        guide.title,
        guide.description,
        ...guide.sections.flatMap(section => [
          section.heading,
          ...section.paragraphs,
          ...(section.bullets ?? []),
          ...(section.steps ?? []),
        ]),
        ...guide.faqs.flatMap(faq => [faq.question, faq.answer]),
      ].join(' ');
      const sentences = copy
        .split(/[।!?]+/)
        .map(part => part.trim())
        .filter(Boolean);
      expect(sentences.every(sentence => sentence.split(/\s+/).length <= 40)).toBe(true);
      expect(copy).not.toMatch(/[\u0600-\u06FF\u0400-\u04FF\uFFFD]/u);
      const requiredLabels = guide.slug.includes('apr-interest')
        ? glossaryTerms.filter(term => term.term_en.startsWith('APR')).map(term => term.term_bn)
        : guide.slug.includes('annual-fee')
        ? glossaryTerms.filter(term => term.term_en === 'Annual Fee').map(term => term.term_bn)
        : [];
      requiredLabels.forEach(label => expect(copy).toContain(label));
    });
  });
});
