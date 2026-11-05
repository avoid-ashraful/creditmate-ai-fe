import { ENV } from '../config/env';

import { ApiResponse } from './api';
import { ApiError, responseApiError, resilientFetch } from './apiError';
import { authClient } from './auth';

export { ApiError } from './apiError';

/**
 * Client for the deposit comparison API (`/api/v1/deposit-products/`).
 *
 * Rates and money come from the backend as decimal strings; they are
 * normalized to numbers here. Ranking is done server-side by the scenario
 * endpoint (net-of-tax maturity) — the page never re-sorts on its own
 * numbers, so what the user sees is exactly what the backend computed.
 */

export type DepositKind = 'fdr' | 'dps' | 'monthly_benefit' | 'scheme';
export type DepositRateType = 'interest' | 'expected_profit';
export type DepositCompounding = 'monthly' | 'quarterly' | 'annual' | 'at_maturity';

export interface DepositRate {
  id: number;
  tenureMonthsMin: number;
  /** Null when the band is open-ended ("N months and above"). */
  tenureMonthsMax: number | null;
  tenureIsOpenEnded: boolean;
  amountMin: number;
  amountMax: number | null;
  rateMin: number;
  rateMax: number;
  isRange: boolean;
  isDerived: boolean;
  note: string;
}

/** The catalogue bank a product belongs to (null for benchmarks / BB-chart-only rows). */
export interface DepositBankRef {
  id: number;
  name: string;
}

export interface DepositProduct {
  id: number;
  bank: DepositBankRef | null;
  institutionName: string;
  institutionDisplayName: string;
  institutionType: string;
  kind: DepositKind;
  name: string;
  slug: string;
  rateType: DepositRateType;
  isIslamic: boolean;
  isBenchmark: boolean;
  isGeneric: boolean;
  segment: string;
  payoutStyle: string;
  compounding: DepositCompounding;
  minAmount: number | null;
  maxAmount: number | null;
  minInstalment: number | null;
  maxInstalment: number | null;
  /** Published rate span across the product's tenures (list serializer's rate_range). */
  rateRange: { min: number; max: number } | null;
  /**
   * Published-rate history for the headline tenure cell (Phase 4),
   * reconstructed server-side from real field-history rows. Points are
   * recorded values only — the UI renders a trend solely from 3+.
   */
  rateHistory: DepositProductRateHistory | null;
  tenuresMonths: number[];
  loanAgainstPercent: number | null;
  sourceUrl: string;
  sourceKind: string;
  rateEffectiveDate: string | null;
  verifiedAt: string | null;
}

/** Headline-cell published-rate history (Phase 4 sparkline payload). */
export interface DepositProductRateHistory {
  tenureMonthsMin: number;
  tenureMonthsMax: number | null;
  points: { at: string; value: number }[];
}

export interface DepositProductDetail extends DepositProduct {
  instalmentStep: number | null;
  loanSpreadPp: number | null;
  prematureEncashmentTerms: string;
  eligibilityNotes: string;
  investmentCap: number | null;
  jointCap: number | null;
  rates: DepositRate[];
}

/**
 * Wire shapes below mirror the backend serializers exactly
 * (deposits/api/serializers.py): rate rows carry no `is_range` or
 * open-ended flag — a range is rate_min != rate_max, and an open-ended
 * band is tenure_months_max === null. `bank` is the nested BankSerializer
 * object, not an id.
 */
interface DepositRateApi {
  id: number;
  tenure_months_min: number;
  tenure_months_max: number | null;
  amount_min: string;
  amount_max: string | null;
  rate_min: string;
  rate_max: string;
  is_derived: boolean;
  note: string;
}

interface DepositBankApi {
  id: number;
  name: string;
  logo: string | null;
  website: string | null;
  is_active: boolean;
  credit_card_count: number;
  created: string;
  modified: string;
}

interface DepositProductApi {
  id: number;
  bank: DepositBankApi | null;
  institution_name: string;
  institution_display_name: string;
  institution_type: string;
  kind: DepositKind;
  name: string;
  slug: string;
  rate_type: DepositRateType;
  is_islamic: boolean;
  is_benchmark: boolean;
  is_generic: boolean;
  segment: string;
  payout_style: string;
  compounding: DepositCompounding;
  min_amount: string | null;
  max_amount: string | null;
  min_instalment: string | null;
  max_instalment: string | null;
  tenures_months: number[];
  loan_against_percent: string | null;
  rate_range: { min: string; max: string } | null;
  rate_history: {
    tenure_months_min: number;
    tenure_months_max: number | null;
    points: { at: string; value: string }[];
  } | null;
  source_url: string;
  source_kind: string;
  rate_effective_date: string | null;
  verified_at: string | null;
}

interface DepositProductDetailApi extends DepositProductApi {
  instalment_step: string | null;
  loan_spread_pp: string | null;
  premature_encashment_terms: string;
  eligibility_notes: string;
  investment_cap: string | null;
  joint_cap: string | null;
  rates: DepositRateApi[];
}

const num = (value: string | null): number | null =>
  value === null || value === undefined ? null : Number(value);

const transformRate = (api: DepositRateApi): DepositRate => ({
  id: api.id,
  tenureMonthsMin: api.tenure_months_min,
  // Open-ended bands arrive as tenure_months_max: null and stay null —
  // collapsing them to the minimum would misstate the coverage.
  tenureMonthsMax: api.tenure_months_max,
  tenureIsOpenEnded: api.tenure_months_max === null,
  amountMin: Number(api.amount_min),
  amountMax: num(api.amount_max),
  rateMin: Number(api.rate_min),
  rateMax: Number(api.rate_max),
  // The rate serializer emits no is_range flag; a range is defined by the
  // two ends differing (the backend's own definition).
  isRange: Number(api.rate_min) !== Number(api.rate_max),
  isDerived: api.is_derived,
  note: api.note,
});

const transformProduct = (api: DepositProductApi): DepositProduct => ({
  id: api.id,
  bank: api.bank ? { id: api.bank.id, name: api.bank.name } : null,
  institutionName: api.institution_name,
  institutionDisplayName: api.institution_display_name,
  institutionType: api.institution_type,
  kind: api.kind,
  name: api.name,
  slug: api.slug,
  rateType: api.rate_type,
  isIslamic: api.is_islamic,
  isBenchmark: api.is_benchmark,
  isGeneric: api.is_generic,
  segment: api.segment,
  payoutStyle: api.payout_style,
  compounding: api.compounding,
  minAmount: num(api.min_amount),
  maxAmount: num(api.max_amount),
  minInstalment: num(api.min_instalment),
  maxInstalment: num(api.max_instalment),
  tenuresMonths: api.tenures_months ?? [],
  rateRange: api.rate_range
    ? { min: Number(api.rate_range.min), max: Number(api.rate_range.max) }
    : null,
  rateHistory: api.rate_history
    ? {
        tenureMonthsMin: api.rate_history.tenure_months_min,
        tenureMonthsMax: api.rate_history.tenure_months_max,
        points: api.rate_history.points.map(point => ({
          at: point.at,
          value: Number(point.value),
        })),
      }
    : null,
  loanAgainstPercent: num(api.loan_against_percent),
  sourceUrl: api.source_url,
  sourceKind: api.source_kind,
  rateEffectiveDate: api.rate_effective_date,
  verifiedAt: api.verified_at,
});

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

export interface DepositListParams {
  kind?: DepositKind;
  bank?: number;
  islamicOnly?: boolean;
  isBenchmark?: boolean;
  page?: number;
  pageSize?: number;
}

export const getDepositProducts = async (
  params: DepositListParams = {}
): Promise<ApiResponse<DepositProduct>> => {
  const query = new URLSearchParams();
  if (params.kind) query.append('kind', params.kind);
  if (params.bank) query.append('bank', String(params.bank));
  if (params.islamicOnly) query.append('is_islamic', 'true');
  if (params.isBenchmark !== undefined) {
    query.append('is_benchmark', params.isBenchmark ? 'true' : 'false');
  }
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('page_size', String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await resilientFetch(`${BASE_URL}/deposit-products/${suffix}`);
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as ApiResponse<DepositProductApi>;
  return { ...data, results: data.results.map(transformProduct) };
};

export const getDepositProduct = async (slug: string): Promise<DepositProductDetail> => {
  const response = await resilientFetch(`${BASE_URL}/deposit-products/${slug}/`);
  if (!response.ok) throw await responseApiError(response);
  const api = (await response.json()) as DepositProductDetailApi;
  return {
    ...transformProduct(api),
    instalmentStep: num(api.instalment_step),
    loanSpreadPp: num(api.loan_spread_pp),
    prematureEncashmentTerms: api.premature_encashment_terms,
    eligibilityNotes: api.eligibility_notes,
    investmentCap: num(api.investment_cap),
    jointCap: num(api.joint_cap),
    rates: api.rates.map(transformRate),
  };
};

export interface DepositScenarioInput {
  kind: 'fdr' | 'dps';
  /** FDR: lump sum. DPS: ignored. */
  amount?: number;
  /** DPS: monthly instalment. FDR: ignored. */
  monthlyInstalment?: number;
  months: number;
  hasTin?: boolean;
  islamicOnly?: boolean;
  bank?: number;
}

export interface DepositScenarioResult {
  product: DepositProduct;
  rateMin: number;
  rateMax: number;
  isRange: boolean;
  rateIsDerived: boolean;
  grossMaturity: number;
  interestEarned: number;
  sourceTax: number;
  taxRatePercent: number;
  netMaturity: number;
  netMaturityAtMaxRate: number | null;
  effectiveYieldPercent: number;
}

export interface DepositScenarioResponse {
  results: DepositScenarioResult[];
  benchmarks: DepositScenarioResult[];
  excludedWithoutRate: number;
  notes: string[];
}

/**
 * Scenario entries spread the backend's evaluate_product() dict next to
 * the product: keys are is_derived_rate / source_tax_pct /
 * effective_yield_pct (decimals serialised as strings, the yield as a
 * JSON number).
 */
interface ScenarioResultApi {
  product: DepositProductApi;
  rate_min: string;
  rate_max: string;
  is_range: boolean;
  is_derived_rate: boolean;
  gross_maturity: string;
  interest_earned: string;
  source_tax: string;
  source_tax_pct: string;
  net_maturity: string;
  net_maturity_at_max_rate: string | null;
  effective_yield_pct: number;
}

const transformScenarioResult = (api: ScenarioResultApi): DepositScenarioResult => ({
  product: transformProduct(api.product),
  rateMin: Number(api.rate_min),
  rateMax: Number(api.rate_max),
  isRange: api.is_range,
  rateIsDerived: api.is_derived_rate,
  grossMaturity: Number(api.gross_maturity),
  interestEarned: Number(api.interest_earned),
  sourceTax: Number(api.source_tax),
  taxRatePercent: Number(api.source_tax_pct),
  netMaturity: Number(api.net_maturity),
  netMaturityAtMaxRate: num(api.net_maturity_at_max_rate),
  effectiveYieldPercent: Number(api.effective_yield_pct),
});

/** Run the server-side scenario ranking (net-of-tax maturity, descending). */
export const runDepositScenario = async (
  input: DepositScenarioInput
): Promise<DepositScenarioResponse> => {
  const body: Record<string, unknown> = {
    kind: input.kind,
    months: input.months,
    has_tin: input.hasTin ?? true,
    islamic_only: input.islamicOnly ?? false,
  };
  if (input.kind === 'dps') body.monthly_instalment = input.monthlyInstalment;
  else body.amount = input.amount;
  if (input.bank) body.bank = input.bank;

  const response = await resilientFetch(`${BASE_URL}/deposit-products/scenario/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as {
    results: ScenarioResultApi[];
    benchmarks: ScenarioResultApi[];
    excluded_without_rate: number;
    notes: string[];
  };
  return {
    results: data.results.map(transformScenarioResult),
    benchmarks: data.benchmarks.map(transformScenarioResult),
    excludedWithoutRate: data.excluded_without_rate,
    notes: data.notes,
  };
};

/** One deposit field-history entry, normalized from the API shape. */
export interface DepositHistoryEntry {
  id: number;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  changedAt: Date;
}

interface DepositHistoryApiEntry {
  id: number;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  created: string;
}

/**
 * Fetch a product's rate-change history. The endpoint is public
 * (redesign decision D1); the access token is attached when a session
 * exists, but anonymous requests are served identically.
 */
export const getDepositFieldHistory = async (slug: string): Promise<DepositHistoryEntry[]> => {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (authClient.hasSession()) {
    const token = await authClient.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await resilientFetch(`${BASE_URL}/deposit-products/${slug}/field-history/`, {
    headers,
  });
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as ApiResponse<DepositHistoryApiEntry>;
  return data.results.map(entry => ({
    id: entry.id,
    fieldName: entry.field_name,
    oldValue: entry.old_value ?? null,
    newValue: entry.new_value ?? null,
    changedAt: new Date(entry.created),
  }));
};
