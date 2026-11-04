import { resilientFetch } from './apiError';
import { fetchLoanProducts, runLoanScenario } from './loans';

jest.mock('./apiError', () => {
  const actual = jest.requireActual('./apiError');
  return { ...actual, resilientFetch: jest.fn() };
});
jest.mock('./auth', () => ({
  authClient: { hasSession: () => false, getAccessToken: async () => null },
}));

const mockFetch = resilientFetch as jest.Mock;

const okResponse = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);

const apiProduct = {
  id: 5,
  slug: 'brac-bank-personal-loan',
  name: 'BRAC Bank Personal Loan',
  bank: 12,
  bank_name: 'BRAC Bank',
  institution_name: '',
  lender_name: 'BRAC Bank',
  lender_type: 'bank',
  loan_type: 'personal',
  segment_tags: ['salaried'],
  purpose_tags: ['any_purpose'],
  is_islamic: false,
  shariah_mode: '',
  rate_label: 'interest',
  rate_min: null,
  rate_max: null,
  rate_type: 'base_plus_margin',
  rate_source: 'none',
  spread_over_deposit_rate: null,
  uses_simple_interest: false,
  effective_rate: { min: '9.72', max: '11.72', source: 'bb_chart', label: 'interest' },
  amount_min_bdt: '100000.00',
  amount_max_bdt: '4000000.00',
  tenure_min_months: 12,
  tenure_max_months: 60,
  ltv_percent: null,
  processing_fee_percent: '0.50',
  processing_fee_percent_max: null,
  processing_fee_cap_bdt: '15000.00',
  min_income_by_segment: {},
  income_metric: 'gross',
  source_url: 'https://www.bracbank.com/en/retail/loans/personal-loan',
  verified_at: '2026-11-04T00:00:00Z',
};

describe('fetchLoanProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps the paginated envelope and decimal strings to numbers', async () => {
    mockFetch.mockReturnValue(
      okResponse({ count: 1, next: null, previous: null, results: [apiProduct] })
    );
    const items = await fetchLoanProducts({ loanType: 'personal' });
    expect(items).toHaveLength(1);
    expect(items[0].effectiveRate).toEqual({
      min: 9.72,
      max: 11.72,
      source: 'bb_chart',
      label: 'interest',
    });
    expect(items[0].amountMaxBdt).toBe(4000000);
    const url = String(mockFetch.mock.calls[0][0]);
    expect(url).toContain('/loan-products/?');
    expect(url).toContain('loan_type=personal');
  });
});

describe('runLoanScenario', () => {
  beforeEach(() => jest.clearAllMocks());

  it('posts snake_case and maps band-end costs', async () => {
    mockFetch.mockReturnValue(
      okResponse({
        loan_type: 'personal',
        amount: '1000000',
        tenure_months: 60,
        monthly_income: '80000',
        results: [
          {
            product: apiProduct,
            eligible: true,
            flags: [],
            warnings: [],
            band: { min: '9.72', max: '11.72', source: 'bb_chart' },
            rate_label: 'interest',
            uses_simple_interest: false,
            processing_fee: '5000.00',
            processing_fee_incl_vat: '5750.00',
            supervision_charge: null,
            at_min_rate: {
              rate: '9.72',
              emi: '21109.54',
              total_interest: '266572.12',
              total_cost: '1272322.12',
            },
            at_max_rate: {
              rate: '11.72',
              emi: '22103.21',
              total_interest: '326192.80',
              total_cost: '1331942.80',
            },
            note: null,
          },
        ],
        notes: ['Estimates only.'],
      })
    );
    const response = await runLoanScenario({
      loanType: 'personal',
      amount: 1000000,
      tenureMonths: 60,
      monthlyIncome: 80000,
    });
    const body = JSON.parse(String(mockFetch.mock.calls[0][1].body));
    expect(body).toEqual({
      loan_type: 'personal',
      amount: 1000000,
      tenure_months: 60,
      islamic_only: false,
      monthly_income: 80000,
    });
    expect(response.results[0].atMinRate?.emi).toBeCloseTo(21109.54);
    expect(response.results[0].atMaxRate?.emi).toBeCloseTo(22103.21);
    expect(response.results[0].band?.source).toBe('bb_chart');
  });
});
