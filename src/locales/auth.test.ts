import { AUTH_COPY, AuthCopy, getAuthCopy } from './auth';

const BENGALI_CHARS = /[ঀ-৿]/;
const ASCII_OR_BENGALI_LETTERS = /^[\u0980-\u09FF\u0964\u0965A-Za-z0-9\s.,:;'’?!()…&/-]+$/;

describe('auth copy', () => {
  const keys = Object.keys(AUTH_COPY.en) as Array<keyof AuthCopy>;

  it('has the same keys in English and Bengali', () => {
    expect(Object.keys(AUTH_COPY.bn).sort()).toEqual([...keys].sort());
  });

  it('has no empty strings in either language', () => {
    (['en', 'bn'] as const).forEach(lang => {
      keys.forEach(key => {
        expect(AUTH_COPY[lang][key].trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('keeps Bengali strings in the Bengali block, the danda and basic punctuation', () => {
    keys.forEach(key => {
      expect(AUTH_COPY.bn[key]).toMatch(ASCII_OR_BENGALI_LETTERS);
      expect(AUTH_COPY.bn[key]).toMatch(BENGALI_CHARS);
    });
  });

  it('keeps English strings free of Bengali characters', () => {
    keys.forEach(key => {
      expect(AUTH_COPY.en[key]).not.toMatch(BENGALI_CHARS);
    });
  });

  it('returns the copy for the requested language', () => {
    expect(getAuthCopy('bn')).toBe(AUTH_COPY.bn);
    expect(getAuthCopy('en')).toBe(AUTH_COPY.en);
  });
});
