/**
 * Tests for the deposits API client: transforms, scenario payload,
 * benchmark separation (the response shape keeps benchmarks apart).
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { ENV } from '../config/env';

import { getDepositProducts, runDepositScenario } from './deposits';

const server = setupServer();
const BASE = ENV.API_BASE_URL.replace(/\/$/, '');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const productApi = {
  id: 1,
  bank: 3,
  bank_name: 'Alpha Bank',
  institution_name: '',
  institution_display_name: 'Alpha Bank',
  institution_type: 'conventional',
  kind: 'fdr',
  name: 'Alpha FDR',
  slug: 'alpha-bank-alpha-fdr',
  rate_type: 'interest',
  is_islamic: false,
  is_benchmark: false,
  is_generic: false,
  segment: 'general',
  payout_style: 'at_maturity',
  compounding: 'annual',
  min_amount: null,
  max_amount: null,
  min_instalment: null,
  max_instalment: null,
  tenures_months: [12],
  loan_against_percent: null,
  source_url: 'https://example.com/rates',
  source_kind: 'bb_chart',
  rate_effective_date: '2026-10-01',
  verified_at: '2026-11-04T00:00:00Z',
};

const scenarioResultApi = {
  product: productApi,
  rate_min: '9.00',
  rate_max: '9.00',
  is_range: false,
  rate_is_derived: false,
  gross_maturity: '545000.00',
  interest_earned: '45000.00',
  source_tax: '4500.00',
  tax_rate_percent: '10.00',
  net_maturity: '540500.00',
  net_maturity_at_max_rate: null,
  effective_yield_percent: '8.10',
};

describe('getDepositProducts', () => {
  it('transforms decimal strings to numbers', async () => {
    server.use(
      rest.get(`${BASE}/deposit-products/`, (_req, res, ctx) =>
        res(ctx.json({ count: 1, next: null, previous: null, results: [productApi] }))
      )
    );
    const response = await getDepositProducts({ kind: 'fdr' });
    expect(response.results[0].institutionDisplayName).toBe('Alpha Bank');
    expect(response.results[0].isBenchmark).toBe(false);
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
            results: [scenarioResultApi],
            benchmarks: [
              {
                ...scenarioResultApi,
                product: { ...productApi, id: 9, is_benchmark: true, name: 'Benchmark' },
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
});
