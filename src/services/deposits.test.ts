/**
 * Tests for the deposits API client: transforms, scenario payload,
 * benchmark separation (the response shape keeps benchmarks apart).
 *
 * Fixtures reproduce the backend serializers' actual output
 * (deposits/api/serializers.py on the backend): `bank` is the nested
 * BankSerializer object, decimals are strings, rate rows carry no
 * is_range / open-ended flags (a range is rate_min != rate_max, an
 * open-ended band is tenure_months_max: null), and scenario entries use
 * is_derived_rate / source_tax_pct / effective_yield_pct.
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { ENV } from '../config/env';

import { getDepositProduct, getDepositProducts, runDepositScenario } from './deposits';

const server = setupServer();
const BASE = ENV.API_BASE_URL.replace(/\/$/, '');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const bankApi = {
  id: 3,
  name: 'Alpha Bank',
  logo: null,
  website: 'https://alpha.example.com',
  is_active: true,
  credit_card_count: 4,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-06-01T00:00:00Z',
};

/** DepositProductListSerializer output for one FDR. */
const productApi = {
  id: 1,
  slug: 'alpha-bank-alpha-fdr',
  name: 'Alpha FDR',
  kind: 'fdr',
  bank: bankApi,
  institution_name: '',
  institution_display_name: 'Alpha Bank',
  institution_type: 'bank',
  rate_type: 'interest',
  is_islamic: false,
  is_generic: true,
  is_benchmark: false,
  payout_style: 'at_maturity',
  segment: 'general',
  min_amount: '10000.00',
  max_amount: null,
  min_instalment: null,
  max_instalment: null,
  instalment_step: null,
  tenures_months: [12, 36, 60],
  compounding: 'annual',
  rate_range: { min: '8.000', max: '9.500' },
  source_url: 'https://alpha.example.com/rates',
  source_kind: 'bb_chart',
  rate_effective_date: '2026-10-01',
  verified_at: '2026-11-04T00:00:00Z',
};

/** DepositProductSerializer output: the list fields plus rates and terms. */
const productDetailApi = {
  ...productApi,
  rates: [
    {
      id: 11,
      tenure_months_min: 12,
      tenure_months_max: 12,
      amount_min: '0.00',
      amount_max: null,
      rate_min: '8.000',
      rate_max: '8.000',
      is_derived: false,
      note: '',
    },
    {
      // BB-chart style band: "3 years and above", published as a range.
      id: 12,
      tenure_months_min: 36,
      tenure_months_max: null,
      amount_min: '0.00',
      amount_max: null,
      rate_min: '8.250',
      rate_max: '9.500',
      is_derived: false,
      note: '',
    },
    {
      id: 13,
      tenure_months_min: 60,
      tenure_months_max: 60,
      amount_min: '0.00',
      amount_max: null,
      rate_min: '9.000',
      rate_max: '9.000',
      is_derived: true,
      note: 'Derived from the published maturity table.',
    },
  ],
  premature_encashment_terms: 'No interest if encashed within 3 months.',
  premature_encashment_rules: [],
  loan_against_percent: '80.00',
  loan_spread_pp: '3.00',
  instalment_failure_penalty: '',
  insurance_bundled: false,
  insurance_note: '',
  eligibility_notes: '',
  investment_cap: '5000000.00',
  joint_cap: null,
  verification_status: 'verified',
};

/** One scenario entry: list-serializer product + evaluate_product() keys. */
const scenarioResultApi = {
  product: productApi,
  rate_min: '9.000',
  rate_max: '9.500',
  is_range: true,
  is_derived_rate: true,
  total_contributions: '500000.00',
  gross_maturity: '545000.00',
  interest_earned: '45000.00',
  source_tax: '4500.00',
  source_tax_pct: '10',
  net_maturity: '540500.00',
  net_maturity_at_max_rate: '565250.00',
  effective_yield_pct: 8.1,
};

describe('getDepositProducts', () => {
  it('transforms the nested bank object and decimal strings', async () => {
    server.use(
      rest.get(`${BASE}/deposit-products/`, (_req, res, ctx) =>
        res(
          ctx.json({
            count: 2,
            next: null,
            previous: null,
            results: [
              productApi,
              {
                ...productApi,
                id: 9,
                slug: 'sanchayapatra-5-year',
                name: '5-Year Bangladesh Sanchayapatra',
                bank: null,
                institution_name: 'National Savings Directorate',
                institution_display_name: 'National Savings Directorate (Sanchayapatra)',
                is_benchmark: true,
              },
            ],
          })
        )
      )
    );
    const response = await getDepositProducts({ kind: 'fdr' });
    expect(response.results[0].bank).toEqual({ id: 3, name: 'Alpha Bank' });
    expect(response.results[0].institutionDisplayName).toBe('Alpha Bank');
    expect(response.results[0].minAmount).toBe(10000);
    expect(response.results[0].isBenchmark).toBe(false);
    // Benchmarks / BB-chart-only rows have no catalogue bank.
    expect(response.results[1].bank).toBeNull();
    expect(response.results[1].isBenchmark).toBe(true);
  });
});

describe('getDepositProduct', () => {
  beforeEach(() => {
    server.use(
      rest.get(`${BASE}/deposit-products/:slug/`, (_req, res, ctx) =>
        res(ctx.json(productDetailApi))
      )
    );
  });

  it('keeps a point-rate row a point rate', async () => {
    const detail = await getDepositProduct('alpha-bank-alpha-fdr');
    const row = detail.rates[0];
    expect(row.tenureMonthsMax).toBe(12);
    expect(row.tenureIsOpenEnded).toBe(false);
    expect(row.isRange).toBe(false);
    expect(row.rateMin).toBe(8);
    expect(row.rateMax).toBe(8);
  });

  it('reads an open-ended range row from tenure_months_max: null and differing rate ends', async () => {
    const detail = await getDepositProduct('alpha-bank-alpha-fdr');
    const row = detail.rates[1];
    expect(row.tenureMonthsMin).toBe(36);
    // The top of the band must not collapse onto the minimum.
    expect(row.tenureMonthsMax).toBeNull();
    expect(row.tenureIsOpenEnded).toBe(true);
    // No is_range on the wire: differing ends make it a range.
    expect(row.isRange).toBe(true);
    expect(row.rateMin).toBe(8.25);
    expect(row.rateMax).toBe(9.5);
  });

  it('maps the detail-only fields the API actually emits', async () => {
    const detail = await getDepositProduct('alpha-bank-alpha-fdr');
    expect(detail.investmentCap).toBe(5000000);
    expect(detail.loanAgainstPercent).toBe(80);
    expect(detail.rates[2].isDerived).toBe(true);
    expect(detail).not.toHaveProperty('created');
    expect(detail).not.toHaveProperty('modified');
  });
});

describe('runDepositScenario', () => {
  it('posts the scenario and keeps benchmarks separate', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      rest.post(`${BASE}/deposit-products/scenario/`, async (req, res, ctx) => {
        postedBody = (await req.json()) as Record<string, unknown>;
        return res(
          ctx.json({
            kind: 'fdr',
            months: 12,
            amount: '500000.00',
            monthly_instalment: null,
            has_tin: true,
            count: 1,
            results: [scenarioResultApi],
            benchmarks: [
              {
                ...scenarioResultApi,
                is_derived_rate: false,
                product: {
                  ...productApi,
                  id: 9,
                  bank: null,
                  is_benchmark: true,
                  name: 'Benchmark',
                },
              },
            ],
            excluded_without_rate: 2,
            notes: ['Ranked by net maturity.'],
          })
        );
      })
    );
    const response = await runDepositScenario({ kind: 'fdr', amount: 500000, months: 12 });
    expect(postedBody).toMatchObject({ kind: 'fdr', amount: 500000, months: 12 });
    expect(response.results).toHaveLength(1);
    expect(response.results[0].netMaturity).toBe(540500);
    expect(response.benchmarks).toHaveLength(1);
    expect(response.benchmarks[0].product.isBenchmark).toBe(true);
    expect(response.excludedWithoutRate).toBe(2);
  });

  it('maps the evaluation keys the backend actually sends', async () => {
    server.use(
      rest.post(`${BASE}/deposit-products/scenario/`, (_req, res, ctx) =>
        res(
          ctx.json({
            results: [scenarioResultApi],
            benchmarks: [],
            excluded_without_rate: 0,
            notes: [],
          })
        )
      )
    );
    const response = await runDepositScenario({ kind: 'fdr', amount: 500000, months: 12 });
    const result = response.results[0];
    expect(result.isRange).toBe(true);
    expect(result.rateMin).toBe(9);
    expect(result.rateMax).toBe(9.5);
    // is_derived_rate drives the derived-rate badge.
    expect(result.rateIsDerived).toBe(true);
    // source_tax_pct / effective_yield_pct, not the guessed key names.
    expect(result.taxRatePercent).toBe(10);
    expect(result.effectiveYieldPercent).toBe(8.1);
    expect(result.netMaturityAtMaxRate).toBe(565250);
    expect(result.product.bank).toEqual({ id: 3, name: 'Alpha Bank' });
  });

  it('sends monthly_instalment for DPS scenarios', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      rest.post(`${BASE}/deposit-products/scenario/`, async (req, res, ctx) => {
        postedBody = (await req.json()) as Record<string, unknown>;
        return res(ctx.json({ results: [], benchmarks: [], excluded_without_rate: 0, notes: [] }));
      })
    );
    await runDepositScenario({ kind: 'dps', monthlyInstalment: 500, months: 36 });
    expect(postedBody).toMatchObject({ kind: 'dps', monthly_instalment: 500, months: 36 });
  });

  it('sends the bank filter as a bank id', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      rest.post(`${BASE}/deposit-products/scenario/`, async (req, res, ctx) => {
        postedBody = (await req.json()) as Record<string, unknown>;
        return res(ctx.json({ results: [], benchmarks: [], excluded_without_rate: 0, notes: [] }));
      })
    );
    await runDepositScenario({ kind: 'fdr', amount: 500000, months: 12, bank: 3 });
    expect(postedBody).toMatchObject({ bank: 3 });
  });
});
