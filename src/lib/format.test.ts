import { formatTaka, formatTakaRange, groupLakhDigits } from './format';

describe('groupLakhDigits', () => {
  it('leaves short numbers ungrouped', () => {
    expect(groupLakhDigits('0')).toBe('0');
    expect(groupLakhDigits('999')).toBe('999');
  });

  it('groups the last three digits, then pairs', () => {
    expect(groupLakhDigits('1000')).toBe('1,000');
    expect(groupLakhDigits('100000')).toBe('1,00,000');
    expect(groupLakhDigits('12345678')).toBe('1,23,45,678');
  });
});

describe('formatTaka', () => {
  it('formats zero and small amounts', () => {
    expect(formatTaka(0)).toBe('৳0');
    expect(formatTaka(999)).toBe('৳999');
  });

  it('applies lakh grouping', () => {
    expect(formatTaka(1000)).toBe('৳1,000');
    expect(formatTaka(100000)).toBe('৳1,00,000');
    expect(formatTaka(500000)).toBe('৳5,00,000');
    expect(formatTaka(12345678)).toBe('৳1,23,45,678');
  });

  it('renders two decimals when asked', () => {
    expect(formatTaka(1234567.5, { decimals: 2 })).toBe('৳12,34,567.50');
    expect(formatTaka(100, { decimals: 2 })).toBe('৳100.00');
  });

  it('rounds to whole taka by default', () => {
    expect(formatTaka(1234.56)).toBe('৳1,235');
  });

  it('puts the minus sign before the symbol for negatives', () => {
    expect(formatTaka(-1200)).toBe('-৳1,200');
    expect(formatTaka(-500000, { decimals: 2 })).toBe('-৳5,00,000.00');
  });

  it('omits the symbol when withSymbol is false', () => {
    expect(formatTaka(500000, { withSymbol: false })).toBe('5,00,000');
    expect(formatTaka(-1200, { withSymbol: false })).toBe('-1,200');
  });
});

describe('formatTakaRange', () => {
  it('joins two amounts with an en dash', () => {
    expect(formatTakaRange(1000, 2500)).toBe('৳1,000 – ৳2,500');
  });

  it('passes options through to both ends', () => {
    expect(formatTakaRange(100000, 500000, { decimals: 2 })).toBe('৳1,00,000.00 – ৳5,00,000.00');
  });
});
