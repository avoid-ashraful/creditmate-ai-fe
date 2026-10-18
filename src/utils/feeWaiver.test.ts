import { describeFeeWaiverPolicy, FeeWaiverLabels } from './feeWaiver';

const labels: FeeWaiverLabels = {
  keys: { conditions: 'Conditions', spendThreshold: 'Spend threshold', period: 'Period' },
  values: { yearly: 'Yearly' },
  yes: 'Yes',
  no: 'No',
  currency: 'BDT',
};

describe('describeFeeWaiverPolicy', () => {
  it('renders known fields as labelled lines', () => {
    expect(
      describeFeeWaiverPolicy(
        { spendThreshold: 300000, period: 'yearly', conditions: 'Spend within the year' },
        labels
      )
    ).toEqual([
      'Spend threshold: BDT 300,000',
      'Period: Yearly',
      'Conditions: Spend within the year',
    ]);
  });

  it('humanizes unknown keys, flattens nested objects and drops empty values', () => {
    const lines = describeFeeWaiverPolicy(
      {
        minTransactions: 12,
        firstYear: { waived: true, note: '' },
        extra_info: null,
        tags: ['a', 'b'],
      },
      labels
    );
    expect(lines).toEqual(['Min transactions: 12', 'First year - Waived: Yes', 'Tags: a, b']);
    expect(lines.join(' ')).not.toMatch(/[{}"]/);
  });

  it('returns no lines for null or empty policies', () => {
    expect(describeFeeWaiverPolicy(null, labels)).toEqual([]);
    expect(describeFeeWaiverPolicy({}, labels)).toEqual([]);
  });
});
