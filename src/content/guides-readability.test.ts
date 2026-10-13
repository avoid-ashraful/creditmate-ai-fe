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

  test('Bengali guide sentences stay concise and glossary terms use reviewed Bengali labels', () => {
    const bengali = guides.filter(guide => guide.language === 'bn');
    expect(bengali.length).toBeGreaterThan(0);
    bengali.forEach(guide => {
      const sentences = [
        ...guide.sections.flatMap(section => section.paragraphs),
        ...guide.faqs.map(faq => faq.answer),
      ].flatMap(text =>
        text
          .split(/[।!?]+/)
          .map(part => part.trim())
          .filter(Boolean)
      );
      expect(sentences.every(sentence => sentence.split(/\s+/).length <= 40)).toBe(true);
      // Reject misspelled or stale Bengali renderings of glossary labels.
      glossaryTerms.forEach(term => {
        const copy = guide.sections
          .flatMap(section => [
            ...section.paragraphs,
            ...(section.bullets ?? []),
            ...(section.steps ?? []),
          ])
          .join(' ');
        expect(copy).not.toMatch(
          new RegExp(
            term.term_bn
              .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
              .split('')
              .join('\\s*'),
            'u'
          )
        );
      });
    });
  });
});
