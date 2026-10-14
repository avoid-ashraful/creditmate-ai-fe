import type { Guide } from './guides';

/** A small, deterministic Flesch-Kincaid estimate for English guide copy. */
export function scoreEnglishGuide(guide: Guide): {
  grade: number;
  words: number;
  sentences: number;
  syllables: number;
} {
  const text = [
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
  const words: string[] = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  const sentences = text.match(/[.!?]+(?=\s|$)/g)?.length ?? 1;
  const syllables = words.reduce<number>((sum, word) => sum + syllableCount(word), 0);
  const grade = 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59;
  return { grade: Math.round(grade * 100) / 100, words: words.length, sentences, syllables };
}

function syllableCount(word: string): number {
  const normalized = word
    .toLowerCase()
    .replace(/(?:[^laeiouy]e|ed|es)$/i, '')
    .replace(/^y/, '');
  const groups = normalized.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 0);
}
