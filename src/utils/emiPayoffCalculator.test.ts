import { calculateEmi, calculatePayoff, round2 } from './emiPayoffCalculator';

describe('round2', () => {
  it('rounds to 2 decimals', () => {
    expect(round2(11405.3044)).toBe(11405.3);
    expect(round2(8884.8789)).toBe(8884.88);
    expect(round2(0.005)).toBe(0.01);
    expect(round2(100)).toBe(100);
  });
});

describe('calculateEmi', () => {
  it('matches the hand-computed reference for BDT 120,000 at 25% APR over 12 months', () => {
    // r = 0.25/12; EMI = P·r·(1+r)^12 / ((1+r)^12 − 1) = 11,405.30 (textbook formula).
    const result = calculateEmi({ principal: 120000, aprPercent: 25, months: 12 });
    expect(result).not.toBeNull();
    expect(result?.monthlyEmi).toBe(11405.3);
    expect(result?.totalInterest).toBe(16863.65);
    expect(result?.totalPayable).toBe(136863.65);
  });

  it('matches the well-known BDT 100,000 at 12% APR over 12 months EMI of 8,884.88', () => {
    const result = calculateEmi({ principal: 100000, aprPercent: 12, months: 12 });
    expect(result?.monthlyEmi).toBe(8884.88);
    expect(result?.totalInterest).toBe(6618.55);
    expect(result?.totalPayable).toBe(106618.55);
  });

  it('handles 0% APR as principal divided by months, with zero interest', () => {
    const result = calculateEmi({ principal: 12000, aprPercent: 0, months: 12 });
    expect(result?.monthlyEmi).toBe(1000);
    expect(result?.totalInterest).toBe(0);
    expect(result?.totalPayable).toBe(12000);
    expect(result?.yearlyBreakdown).toHaveLength(1);
    expect(result?.yearlyBreakdown[0]).toEqual({
      year: 1,
      principalPaid: 12000,
      interestPaid: 0,
      closingBalance: 0,
    });
  });

  it('produces a per-year breakdown that sums back to the totals', () => {
    const result = calculateEmi({ principal: 200000, aprPercent: 24, months: 36 });
    expect(result?.monthlyEmi).toBe(7846.57);
    expect(result?.totalInterest).toBe(82476.54);
    expect(result?.yearlyBreakdown).toHaveLength(3);
    expect(result?.yearlyBreakdown[0]).toEqual({
      year: 1,
      principalPaid: 51590.55,
      interestPaid: 42568.3,
      closingBalance: 148409.45,
    });
    const principalSum = result?.yearlyBreakdown.reduce((sum, row) => sum + row.principalPaid, 0);
    const interestSum = result?.yearlyBreakdown.reduce((sum, row) => sum + row.interestPaid, 0);
    expect(principalSum).toBeCloseTo(200000, 1);
    expect(interestSum).toBeCloseTo(82476.54, 1);
    expect(result?.yearlyBreakdown[2].closingBalance).toBe(0);
  });

  it('rejects invalid input instead of returning nonsense', () => {
    expect(calculateEmi({ principal: 0, aprPercent: 25, months: 12 })).toBeNull();
    expect(calculateEmi({ principal: -5000, aprPercent: 25, months: 12 })).toBeNull();
    expect(calculateEmi({ principal: 5000, aprPercent: -1, months: 12 })).toBeNull();
    expect(calculateEmi({ principal: 5000, aprPercent: 25, months: 0 })).toBeNull();
    expect(calculateEmi({ principal: 5000, aprPercent: 25, months: 12.5 })).toBeNull();
    expect(calculateEmi({ principal: Number.NaN, aprPercent: 25, months: 12 })).toBeNull();
  });
});

describe('calculatePayoff', () => {
  it('matches the reference simulation for BDT 50,000 at 24% APR paying 5,000/month', () => {
    const result = calculatePayoff({ balance: 50000, aprPercent: 24, monthlyPayment: 5000 });
    expect(result).toEqual({
      clears: true,
      months: 12,
      totalInterest: 6351.64,
      totalPaid: 56351.64,
      finalPayment: 1351.64,
      yearlyBreakdown: [
        { year: 1, principalPaid: 50000, interestPaid: 6351.64, closingBalance: 0 },
      ],
    });
  });

  it('matches the reference for BDT 100,000 at 25% APR paying 10,000/month', () => {
    const result = calculatePayoff({ balance: 100000, aprPercent: 25, monthlyPayment: 10000 });
    expect(result).toEqual({
      clears: true,
      months: 12,
      totalInterest: 13322.01,
      totalPaid: 113322.01,
      finalPayment: 3322.01,
      yearlyBreakdown: [
        { year: 1, principalPaid: 100000, interestPaid: 13322.01, closingBalance: 0 },
      ],
    });
  });

  it('handles a 0% APR balance as balance divided by payment', () => {
    const result = calculatePayoff({ balance: 30000, aprPercent: 0, monthlyPayment: 3000 });
    expect(result).toEqual({
      clears: true,
      months: 10,
      totalInterest: 0,
      totalPaid: 30000,
      finalPayment: 3000,
      yearlyBreakdown: [{ year: 1, principalPaid: 30000, interestPaid: 0, closingBalance: 0 }],
    });
  });

  it('reports never-clears when the payment is below the first month’s interest', () => {
    // First month interest on 100,000 at 25% = 2,083.33; paying 2,000 never reduces the balance.
    const result = calculatePayoff({ balance: 100000, aprPercent: 25, monthlyPayment: 2000 });
    expect(result).toEqual({ clears: false, firstMonthInterest: 2083.33 });
  });

  it('reports never-clears when the payment exactly equals the first month’s interest', () => {
    const result = calculatePayoff({ balance: 100000, aprPercent: 25, monthlyPayment: 2083.33 });
    expect(result?.clears).toBe(false);
  });

  it('rejects invalid input', () => {
    expect(calculatePayoff({ balance: 0, aprPercent: 25, monthlyPayment: 1000 })).toBeNull();
    expect(calculatePayoff({ balance: 1000, aprPercent: 25, monthlyPayment: 0 })).toBeNull();
    expect(calculatePayoff({ balance: 1000, aprPercent: -5, monthlyPayment: 100 })).toBeNull();
    expect(
      calculatePayoff({ balance: 1000, aprPercent: 25, monthlyPayment: Number.NaN })
    ).toBeNull();
  });
});
