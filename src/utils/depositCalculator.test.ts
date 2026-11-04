import {
  bankSourceTaxPercent,
  DepositRateLike,
  dpsInstalmentForTarget,
  dpsMaturity,
  fdrMaturity,
  netOfTax,
  pickDepositRate,
} from './depositCalculator';

/**
 * These expectations are the same hand-computed examples asserted against
 * the backend's deposits/maturity.py, so the two implementations cannot
 * drift apart silently.
 */
describe('fdrMaturity (mirrors backend)', () => {
  it('annual compounding: 500,000 at 8.25% for 12 months', () => {
    expect(fdrMaturity(500000, 8.25, 12, 'annual')).toBe(541250);
  });

  it('quarterly compounding: 100,000 at 8% for 12 months', () => {
    expect(fdrMaturity(100000, 8, 12, 'quarterly')).toBe(108243.22);
  });

  it('simple interest at maturity: 200,000 at 10% for 6 months', () => {
    expect(fdrMaturity(200000, 10, 6, 'at_maturity')).toBe(210000);
  });

  it('rejects invalid input', () => {
    expect(fdrMaturity(0, 8, 12, 'annual')).toBeNull();
    expect(fdrMaturity(1000, 8, 0, 'annual')).toBeNull();
    expect(fdrMaturity(1000, -1, 12, 'annual')).toBeNull();
  });
});

describe('dpsMaturity (mirrors backend)', () => {
  it('reproduces DBBL Deposit Plus published maturities at 9.50%', () => {
    // Published table for BDT 500/month: 20,897 / 38,514 / 72,054 / 100,328.
    expect(dpsMaturity(500, 9.5, 36)).toBeCloseTo(20897, -1);
    expect(dpsMaturity(500, 9.5, 60)).toBeCloseTo(38514, -1);
    expect(dpsMaturity(500, 9.5, 96)).toBeCloseTo(72054, -1);
    expect(dpsMaturity(500, 9.5, 120)).toBeCloseTo(100328, -1);
  });

  it('zero rate returns total contributions', () => {
    expect(dpsMaturity(1000, 0, 12)).toBe(12000);
  });
});

describe('dpsInstalmentForTarget', () => {
  it('round-trips the DBBL 10-year maturity', () => {
    const instalment = dpsInstalmentForTarget(100328, 9.5, 120);
    expect(instalment).not.toBeNull();
    expect(instalment as number).toBeCloseTo(500, 0);
  });
});

describe('pickDepositRate (mirrors backend covers / pick_rate_row)', () => {
  const row = (partial: Partial<DepositRateLike>): DepositRateLike => ({
    tenureMonthsMin: 12,
    tenureMonthsMax: 12,
    tenureIsOpenEnded: false,
    amountMin: 0,
    amountMax: null,
    rateMin: 8,
    rateMax: 8,
    ...partial,
  });

  it('treats an open-ended row as covering any horizon at or above its minimum', () => {
    const open = row({ tenureMonthsMin: 36, tenureMonthsMax: null, tenureIsOpenEnded: true });
    expect(pickDepositRate([open], 120, 1000)).toBe(open);
    expect(pickDepositRate([open], 36, 1000)).toBe(open);
    expect(pickDepositRate([open], 35, 1000)).toBeNull();
  });

  it('treats a null tenure maximum as open-ended even without the flag', () => {
    const open = row({ tenureMonthsMin: 36, tenureMonthsMax: null, tenureIsOpenEnded: false });
    expect(pickDepositRate([open], 600, 1000)).toBe(open);
  });

  it('does not cover beyond a bounded row maximum', () => {
    const bounded = row({});
    expect(pickDepositRate([bounded], 12, 1000)).toBe(bounded);
    expect(pickDepositRate([bounded], 13, 1000)).toBeNull();
  });

  it('prefers the narrower bounded band over an open-ended row when both cover', () => {
    const bounded = row({ tenureMonthsMin: 12, tenureMonthsMax: 24, rateMin: 8 });
    const open = row({
      tenureMonthsMin: 12,
      tenureMonthsMax: null,
      tenureIsOpenEnded: true,
      rateMin: 9,
    });
    expect(pickDepositRate([open, bounded], 18, 1000)).toBe(bounded);
    expect(pickDepositRate([open, bounded], 30, 1000)).toBe(open);
  });
});

describe('netOfTax', () => {
  it('taxes only the interest at 10% with TIN', () => {
    // 500,000 at 8.25% annual -> gross 541,250, interest 41,250, tax 4,125.
    expect(netOfTax(541250, 500000, bankSourceTaxPercent(true))).toEqual({
      grossMaturity: 541250,
      interestEarned: 41250,
      sourceTax: 4125,
      netMaturity: 537125,
    });
  });

  it('uses 15% without TIN', () => {
    expect(bankSourceTaxPercent(false)).toBe(15);
    expect(netOfTax(541250, 500000, 15).sourceTax).toBe(6187.5);
  });
});
