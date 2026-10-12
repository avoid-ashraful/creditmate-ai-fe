import { slugify } from './slugify';

describe('slugify', () => {
  it('normalizes card and bank labels into stable route segments', () => {
    expect(slugify('Eastern Bank Limited')).toBe('eastern-bank-limited');
    expect(slugify('EBL Platinum Card')).toBe('ebl-platinum-card');
    expect(slugify('Café & Travel')).toBe('cafe-travel');
  });
});
