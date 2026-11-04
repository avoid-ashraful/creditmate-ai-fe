/**
 * Tests for the bank-accounts API client: transforms, scenario payload,
 * and the null-fee discipline (an unpublished fee stays null, never 0).
 *
 * Fixtures reproduce the backend serializers' actual output
 * (bank_accounts/api/serializers.py): `bank` is the nested
 * BankSerializer object, `variant_of` is {slug, name} or null, decimals
 * are strings, rate_slabs / maintenance_fee_slabs are raw JSON lists
 * with string values, and scenario entries spread the backend's
 * evaluate_product() keys next to the list-serializer product.
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { ENV } from '../config/env';

import { getAccountProduct, getAccountProducts, runAccountScenario } from './bankAccounts';

const server = setupServer();
const BASE = ENV.API_BASE_URL.replace(/\/$/, '');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const bankApi = {
  id: 14,
  name: 'City Bank PLC',
  logo: null,
  website: 'https://www.citybankplc.com',
  is_active: true,
  credit_card_count: 12,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-06-01T00:00:00Z',
};

const bbMaint = [
  { balance_min: '0', balance_max: '10000', fee: '0' },
  { balance_min: '10001', balance_max: '25000', fee: '100' },
  { balance_min: '25001', balance_max: '200000', fee: '200' },
  { balance_min: '200001', balance_max: '1000000', fee: '250' },
  { balance_min: '1000001', balance_max: null, fee: '300' },
];

/** AccountProductListSerializer output: City General Savings shape. */
const productApi = {
  id: 101,
  slug: 'city-bank-plc-general-savings-account',
  name: 'General Savings Account',
  account_type: 'savings',
  bank: bankApi,
  variant_of: null,
  variants_count: 1,
  segment: 'general',
  is_islamic: false,
  contract_type: 'interest',
  rate_type: 'interest',
  rate_slabs: [
    { balance_min: '0', balance_max: '100000', rate: '0' },
    { balance_min: '100000', balance_max: null, rate: '0.25' },
  ],
  interest_basis: 'unknown',
  interest_payout_frequency: 'unknown',
  min_balance_to_earn: null,
  maintenance_fee_slabs: bbMaint,
  debit_card_fee_annual: '600.00',
  debit_card_waiver_text: '',
  debit_card_waiver_min_balance: null,
  sms_fee_annual: '300.00',
  online_banking_fee_annual: '0.00',
  cheque_per_leaf: '20.00',
  cheque_first_book_free: false,
  closure_fee: '200.00',
  fee_data_complete: true,
  fees_include_vat: false,
  source_soc_url: 'https://www.citybankplc.com/upload/Retail-SOC-14-October-2025.pdf',
  source_rate_url: 'https://www.citybankplc.com/gsi/conventional-banking-products',
  soc_effective_date: '2025-10-14',
  rate_effective_date: '2026-11-01',
  verified_at: '2026-11-04T12:00:00Z',
};

/** AccountProductSerializer output: list fields plus detail-only fields. */
const productDetailApi = {
  ...productApi,
  variants: [
    {
      slug: 'city-bank-plc-city-alo-general-savings-account',
      name: 'City Alo General Savings Account',
      segment: 'women',
    },
  ],
  rate_conditions_text: 'Pays no interest below Tk 1 lakh average balance.',
  withdrawal_limit_for_interest: null,
  maintenance_waiver_text: '',
  debit_card_first_year_fee: null,
  debit_card_replacement_fee: null,
  statement_duplicate_fee: '100.00',
  balance_confirmation_extra_fee: '100.00',
  min_balance_required: null,
  opening_deposit: null,
  cheque_book_available: true,
  debit_card_included: true,
  dormancy_terms: '',
  eligibility_notes: '',
  source_kind: 'bank_soc',
  last_verified_at: '2026-11-04T12:00:00Z',
  verification_status: 'verified',
};

/** One scenario entry: list product + evaluate_product() keys at BDT 50,000. */
const scenarioResultApi = {
  product: productApi,
  balance: '50000.00',
  rate: '0',
  rate_max: null,
  is_range: false,
  interest_basis: 'unknown',
  basis_note: 'Interest basis not published by the bank.',
  interest_blocked_by_min_balance: false,
  interest_earned: '0.00',
  interest_earned_at_max_rate: null,
  maintenance_fee_annual: '400.00',
  debit_card_fee_annual: '600.00',
  sms_fee_annual: '300.00',
  online_banking_fee_annual: '0.00',
  total_fees: '1300.00',
  fees_complete: true,
  waivers_applied: [],
  net_annual_value: '-1300.00',
  net_annual_value_at_max_rate: null,
};

describe('getAccountProducts', () => {
  it('transforms the nested bank, decimal strings and slab JSON', async () => {
    server.use(
      rest.get(`${BASE}/account-products/`, (_req, res, ctx) =>
        res(ctx.json({ count: 1, next: null, previous: null, results: [productApi] }))
      )
    );
    const response = await getAccountProducts({ accountType: 'savings' });
    const product = response.results[0];
    expect(product.bank).toEqual({ id: 14, name: 'City Bank PLC' });
    expect(product.debitCardFeeAnnual).toBe(600);
    expect(product.chequePerLeaf).toBe(20);
    expect(product.rateSlabs).toHaveLength(2);
    // The open-ended top slab stays open-ended; it must not collapse.
    expect(product.rateSlabs[1].balanceMax).toBeNull();
    expect(product.rateSlabs[0].rate).toBe(0);
    expect(product.maintenanceFeeSlabs).toHaveLength(5);
    expect(product.maintenanceFeeSlabs?.[2]).toEqual({
      balanceMin: 25001,
      balanceMax: 200000,
      fee: 200,
    });
    expect(product.feeDataComplete).toBe(true);
  });

  it('keeps unpublished fees and maintenance slabs null, never zero', async () => {
    server.use(
      rest.get(`${BASE}/account-products/`, (_req, res, ctx) =>
        res(
          ctx.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                ...productApi,
                id: 102,
                slug: 'eastern-bank-plc-ebl-classic-savings-account',
                debit_card_fee_annual: null,
                maintenance_fee_slabs: null,
                fee_data_complete: false,
              },
            ],
          })
        )
      )
    );
    const response = await getAccountProducts();
    const product = response.results[0];
    expect(product.debitCardFeeAnnual).toBeNull();
    expect(product.maintenanceFeeSlabs).toBeNull();
    expect(product.feeDataComplete).toBe(false);
  });

  it('reads a published rate range (rate_max) as a range', async () => {
    server.use(
      rest.get(`${BASE}/account-products/`, (_req, res, ctx) =>
        res(
          ctx.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                ...productApi,
                id: 103,
                rate_type: 'expected_profit',
                rate_slabs: [
                  { balance_min: '0', balance_max: null, rate: '2.50', rate_max: '3.85' },
                ],
              },
            ],
          })
        )
      )
    );
    const response = await getAccountProducts();
    const slab = response.results[0].rateSlabs[0];
    expect(slab.rate).toBe(2.5);
    expect(slab.rateMax).toBe(3.85);
    expect(slab.isRange).toBe(true);
  });

  it('treats an explicit null rate_max as no range, never as 0', async () => {
    server.use(
      rest.get(`${BASE}/account-products/`, (_req, res, ctx) =>
        res(
          ctx.json({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                ...productApi,
                id: 104,
                rate_slabs: [{ balance_min: '0', balance_max: null, rate: '2.50', rate_max: null }],
              },
            ],
          })
        )
      )
    );
    const response = await getAccountProducts();
    const slab = response.results[0].rateSlabs[0];
    expect(slab.rate).toBe(2.5);
    expect(slab.rateMax).toBeNull();
    expect(slab.isRange).toBe(false);
  });
});

describe('getAccountProduct', () => {
  it('maps the detail-only fields the API actually emits', async () => {
    server.use(
      rest.get(`${BASE}/account-products/:slug/`, (_req, res, ctx) =>
        res(ctx.json(productDetailApi))
      )
    );
    const detail = await getAccountProduct('city-bank-plc-general-savings-account');
    expect(detail.variants).toHaveLength(1);
    expect(detail.variants[0].segment).toBe('women');
    expect(detail.statementDuplicateFee).toBe(100);
    expect(detail.rateConditionsText).toContain('no interest below');
    expect(detail.sourceKind).toBe('bank_soc');
    expect(detail.verificationStatus).toBe('verified');
    expect(detail).not.toHaveProperty('created');
  });
});

describe('runAccountScenario', () => {
  it('posts the balance and maps the breakdown keys the backend sends', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      rest.post(`${BASE}/account-products/scenario/`, async (req, res, ctx) => {
        postedBody = (await req.json()) as Record<string, unknown>;
        return res(
          ctx.json({
            average_balance: '50000.00',
            account_type: 'savings',
            count: 1,
            excluded_without_rate: 21,
            results: [scenarioResultApi],
            segment_excluded: [],
            unranked_without_fees: [],
            notes: ['Ranked by net annual value.'],
          })
        );
      })
    );
    const response = await runAccountScenario({ averageBalance: 50000 });
    expect(postedBody).toMatchObject({
      average_balance: 50000,
      account_type: 'savings',
      islamic_only: false,
    });
    const row = response.results[0];
    // Hand-computed City case: 0% slab -> interest 0; fees 400+600+300+0.
    expect(row.interestEarned).toBe(0);
    expect(row.maintenanceFeeAnnual).toBe(400);
    expect(row.totalFees).toBe(1300);
    expect(row.netAnnualValue).toBe(-1300);
    expect(row.feesComplete).toBe(true);
    expect(response.excludedWithoutRate).toBe(21);
  });

  it('keeps salary rows in segment_excluded and fee-less rows unranked', async () => {
    server.use(
      rest.post(`${BASE}/account-products/scenario/`, (_req, res, ctx) =>
        res(
          ctx.json({
            average_balance: '50000.00',
            account_type: 'savings',
            count: 0,
            excluded_without_rate: 0,
            results: [],
            segment_excluded: [
              { ...scenarioResultApi, product: { ...productApi, id: 201, segment: 'salary' } },
            ],
            unranked_without_fees: [
              {
                ...scenarioResultApi,
                product: { ...productApi, id: 202, fee_data_complete: false },
                maintenance_fee_annual: null,
                debit_card_fee_annual: null,
                sms_fee_annual: null,
                online_banking_fee_annual: null,
                total_fees: null,
                fees_complete: false,
                net_annual_value: null,
              },
            ],
            notes: [],
          })
        )
      )
    );
    const response = await runAccountScenario({ averageBalance: 50000 });
    expect(response.results).toHaveLength(0);
    expect(response.segmentExcluded).toHaveLength(1);
    expect(response.segmentExcluded[0].product.segment).toBe('salary');
    expect(response.unrankedWithoutFees).toHaveLength(1);
    // No fee lines published -> total and net stay null, never faked.
    expect(response.unrankedWithoutFees[0].totalFees).toBeNull();
    expect(response.unrankedWithoutFees[0].netAnnualValue).toBeNull();
  });

  it('sends the segment filter and account type through', async () => {
    let postedBody: Record<string, unknown> | null = null;
    server.use(
      rest.post(`${BASE}/account-products/scenario/`, async (req, res, ctx) => {
        postedBody = (await req.json()) as Record<string, unknown>;
        return res(
          ctx.json({
            average_balance: '50000.00',
            account_type: 'current',
            count: 0,
            excluded_without_rate: 0,
            results: [],
            segment_excluded: [],
            unranked_without_fees: [],
            notes: [],
          })
        );
      })
    );
    await runAccountScenario({
      averageBalance: 50000,
      accountType: 'current',
      segments: ['women'],
      bank: 14,
    });
    expect(postedBody).toMatchObject({
      account_type: 'current',
      segments: ['women'],
      bank: 14,
    });
  });
});
