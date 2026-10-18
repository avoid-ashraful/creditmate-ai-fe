/**
 * Guards against garbled Bengali (stray Arabic, CJK, Devanagari, Malayalam, Thai ...).
 * Every source line that contains Bengali text may only use Bengali, Latin, digits and a
 * short list of punctuation/symbols.
 */

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(__dirname, '..');
const BENGALI = /[ঀ-৿]/;

const ALLOWED_EXTRA = new Set([
  0x0964, // । danda
  0x0965, // ॥ double danda
  0x200c, // ZWNJ
  0x200d, // ZWJ
  0x2013, // –
  0x2014, // —
  0x2026, // …
  0x2039, // ‹
  0x203a, // ›
  0x2190, // ←
  0x2192, // →
  0x03b1, // α
  0x26a0, // ⚠
  0xfe0f, // variation selector-16
  0x2705, // ✅
  0x23f3, // ⏳
  0x1f504, // 🔄
  0x1f4e4, // 📤
  0x1f440, // 👀
  0x1f517, // 🔗
  0x1f4be, // 💾
]);

const isAllowed = (codePoint: number): boolean =>
  (codePoint >= 0x09 && codePoint <= 0x7e) || // tab, newline, printable ASCII
  (codePoint >= 0x0980 && codePoint <= 0x09ff) || // Bengali block (includes ৳ U+09F3)
  ALLOWED_EXTRA.has(codePoint);

export const disallowedCharacters = (line: string): string[] =>
  Array.from(line).filter(ch => !isAllowed(ch.codePointAt(0) as number));

const sourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    const isSource = /\.(ts|tsx|json)$/.test(entry.name);
    const isTestOrStory = /\.(test|stories)\.[jt]sx?$/.test(entry.name);
    return isSource && !isTestOrStory ? [full] : [];
  });

describe('Bengali text character set', () => {
  it('detects characters from other scripts', () => {
    expect(disallowedCharacters('অ্যাক্সেস ৳ ১২৩ abc । ও')).toEqual([]);
    expect(disallowedCharacters('অ্যাক্সيس')).toEqual(['ي', 'س']);
    expect(disallowedCharacters('সীমা 長 শেষ')).toEqual(['長']);
    expect(disallowedCharacters('গഎ')).toEqual(['എ']);
    expect(disallowedCharacters('ক ร')).toEqual(['ร']);
    expect(disallowedCharacters('ক च')).toEqual(['च']);
  });

  it('keeps every Bengali source line free of foreign-script characters', () => {
    const problems: string[] = [];
    sourceFiles(SRC_DIR).forEach(file => {
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (!BENGALI.test(line)) return;
          const bad = disallowedCharacters(line);
          if (bad.length) {
            problems.push(`${path.relative(SRC_DIR, file)}:${index + 1} -> ${bad.join(' ')}`);
          }
        });
    });
    expect(problems).toEqual([]);
  });
});
