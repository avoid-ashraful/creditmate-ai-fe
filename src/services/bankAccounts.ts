import { ENV } from '../config/env';

import { ApiResponse } from './api';
import { ApiError, responseApiError, resilientFetch } from './apiError';
import { authClient } from './auth';

export { ApiError } from './apiError';

/**
 * Client for the bank-accounts API (`/api/v1/account-products/`).
 *
 * Money and rates arrive as decimal strings and are normalized to
 * numbers here. Ranking is done server-side by the scenario endpoint
 * (net annual value at the user's average balance) — the page never
 * re-sorts on its own numbers. A fee of `null` means the bank does not
 * publish that figure in the sources we hold; it is never coerced to 0.
 */

export type AccountType = 'savings' | 'current' | 'snd';
export type AccountRateType = 'interest' | 'expected_profit';
export type AccountSegment =
  | 'general'
  | 'women'
  | 'student'
  | 'senior'
  | 'salary'
  | 'nrb'
  | 'digital'
  | 'minor'
  | 'inclusion'
  | 'premium';

export interface AccountRateSlab {
  balanceMin: number;
  /** Null = open-ended top band. */
  balanceMax: number | null;
  rate: number;
  /** Set when the bank publishes the rate as a range (BB/Islamic). */
  rateMax: number | null;
  isRange: boolean;
}

export interface AccountFeeSlab {
  balanceMin: number;
  /** Inclusive ceiling as printed by the bank; null = open-ended. */
  balanceMax: number | null;
  /** Half-yearly charge. */
  fee: number;
}

export interface AccountBankRef {
  id: number;
  name: string;
}

export interface AccountProduct {
  id: number;
  slug: string;
  name: string;
  accountType: AccountType;
  bank: AccountBankRef;
  variantOf: { slug: string; name: string } | null;
  variantsCount: number;
  segment: AccountSegment;
  isIslamic: boolean;
  contractType: string;
  rateType: AccountRateType;
  rateSlabs: AccountRateSlab[];
  interestBasis: string;
  interestPayoutFrequency: string;
  minBalanceToEarn: number | null;
  maintenanceFeeSlabs: AccountFeeSlab[] | null;
  debitCardFeeAnnual: number | null;
  debitCardWaiverText: string;
  debitCardWaiverMinBalance: number | null;
  smsFeeAnnual: number | null;
  onlineBankingFeeAnnual: number | null;
  chequePerLeaf: number | null;
  chequeFirstBookFree: boolean;
  closureFee: number | null;
  feeDataComplete: boolean;
  feesIncludeVat: boolean;
  sourceSocUrl: string;
  sourceRateUrl: string;
  socEffectiveDate: string | null;
  rateEffectiveDate: string | null;
  verifiedAt: string | null;
}

export interface AccountProductDetail extends AccountProduct {
  variants: { slug: string; name: string; segment: string }[];
  rateConditionsText: string;
  withdrawalLimitForInterest: number | null;
  maintenanceWaiverText: string;
  debitCardFirstYearFee: number | null;
  debitCardReplacementFee: number | null;
  statementDuplicateFee: number | null;
  balanceConfirmationExtraFee: number | null;
  minBalanceRequired: number | null;
  openingDeposit: number | null;
  chequeBookAvailable: boolean;
  debitCardIncluded: boolean;
  dormancyTerms: string;
  eligibilityNotes: string;
  sourceKind: string;
  lastVerifiedAt: string | null;
  verificationStatus: string;
}

/**
 * Wire shapes mirror bank_accounts/api/serializers.py exactly: `bank`
 * is the nested BankSerializer object, `variant_of` is {slug, name} or
 * null, decimals are strings, and the slab JSON keeps the backend's
 * string values (rate_slabs entries may carry an optional rate_max).
 */
interface AccountBankApi {
  id: number;
  name: string;
  logo: string | null;
  website: string | null;
  is_active: boolean;
  credit_card_count: number;
  created: string;
  modified: string;
}

interface RateSlabApi {
  balance_min: string;
  balance_max: string | null;
  rate: string;
  rate_max?: string | null;
}

interface FeeSlabApi {
  balance_min: string;
  balance_max: string | null;
  fee: string;
}

interface AccountProductApi {
  id: number;
  slug: string;
  name: string;
  account_type: AccountType;
  bank: AccountBankApi;
  variant_of: { slug: string; name: string } | null;
  variants_count: number;
  segment: AccountSegment;
  is_islamic: boolean;
  contract_type: string;
  rate_type: AccountRateType;
  rate_slabs: RateSlabApi[];
  interest_basis: string;
  interest_payout_frequency: string;
  min_balance_to_earn: string | null;
  maintenance_fee_slabs: FeeSlabApi[] | null;
  debit_card_fee_annual: string | null;
  debit_card_waiver_text: string;
  debit_card_waiver_min_balance: string | null;
  sms_fee_annual: string | null;
  online_banking_fee_annual: string | null;
  cheque_per_leaf: string | null;
  cheque_first_book_free: boolean;
  closure_fee: string | null;
  fee_data_complete: boolean;
  fees_include_vat: boolean;
  source_soc_url: string;
  source_rate_url: string;
  soc_effective_date: string | null;
  rate_effective_date: string | null;
  verified_at: string | null;
}

interface AccountProductDetailApi extends AccountProductApi {
  variants: { slug: string; name: string; segment: string }[];
  rate_conditions_text: string;
  withdrawal_limit_for_interest: number | null;
  maintenance_waiver_text: string;
  debit_card_first_year_fee: string | null;
  debit_card_replacement_fee: string | null;
  statement_duplicate_fee: string | null;
  balance_confirmation_extra_fee: string | null;
  min_balance_required: string | null;
  opening_deposit: string | null;
  cheque_book_available: boolean;
  debit_card_included: boolean;
  dormancy_terms: string;
  eligibility_notes: string;
  source_kind: string;
  last_verified_at: string | null;
  verification_status: string;
}

const num = (value: string | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

const transformRateSlab = (api: RateSlabApi): AccountRateSlab => {
  const rate = Number(api.rate);
  const rateMax = api.rate_max != null ? Number(api.rate_max) : null;
  return {
    balanceMin: Number(api.balance_min),
    balanceMax: num(api.balance_max),
    rate,
    rateMax,
    isRange: rateMax !== null && rateMax !== rate,
  };
};

const transformFeeSlab = (api: FeeSlabApi): AccountFeeSlab => ({
  balanceMin: Number(api.balance_min),
  balanceMax: num(api.balance_max),
  fee: Number(api.fee),
});

const transformProduct = (api: AccountProductApi): AccountProduct => ({
  id: api.id,
  slug: api.slug,
  name: api.name,
  accountType: api.account_type,
  bank: { id: api.bank.id, name: api.bank.name },
  variantOf: api.variant_of,
  variantsCount: api.variants_count,
  segment: api.segment,
  isIslamic: api.is_islamic,
  contractType: api.contract_type,
  rateType: api.rate_type,
  rateSlabs: (api.rate_slabs ?? []).map(transformRateSlab),
  interestBasis: api.interest_basis,
  interestPayoutFrequency: api.interest_payout_frequency,
  minBalanceToEarn: num(api.min_balance_to_earn),
  maintenanceFeeSlabs:
    api.maintenance_fee_slabs === null ? null : api.maintenance_fee_slabs.map(transformFeeSlab),
  debitCardFeeAnnual: num(api.debit_card_fee_annual),
  debitCardWaiverText: api.debit_card_waiver_text,
  debitCardWaiverMinBalance: num(api.debit_card_waiver_min_balance),
  smsFeeAnnual: num(api.sms_fee_annual),
  onlineBankingFeeAnnual: num(api.online_banking_fee_annual),
  chequePerLeaf: num(api.cheque_per_leaf),
  chequeFirstBookFree: api.cheque_first_book_free,
  closureFee: num(api.closure_fee),
  feeDataComplete: api.fee_data_complete,
  feesIncludeVat: api.fees_include_vat,
  sourceSocUrl: api.source_soc_url,
  sourceRateUrl: api.source_rate_url,
  socEffectiveDate: api.soc_effective_date,
  rateEffectiveDate: api.rate_effective_date,
  verifiedAt: api.verified_at,
});

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

export interface AccountListParams {
  accountType?: AccountType;
  bank?: number;
  segment?: AccountSegment;
  islamicOnly?: boolean;
  feeDataComplete?: boolean;
  includeVariants?: boolean;
  page?: number;
  pageSize?: number;
}

export const getAccountProducts = async (
  params: AccountListParams = {}
): Promise<ApiResponse<AccountProduct>> => {
  const query = new URLSearchParams();
  if (params.accountType) query.append('account_type', params.accountType);
  if (params.bank) query.append('bank', String(params.bank));
  if (params.segment) query.append('segment', params.segment);
  if (params.islamicOnly) query.append('is_islamic', 'true');
  if (params.feeDataComplete !== undefined) {
    query.append('fee_data_complete', params.feeDataComplete ? 'true' : 'false');
  }
  if (params.includeVariants) query.append('include_variants', 'true');
  if (params.page) query.append('page', String(params.page));
  if (params.pageSize) query.append('page_size', String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await resilientFetch(`${BASE_URL}/account-products/${suffix}`);
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as ApiResponse<AccountProductApi>;
  return { ...data, results: data.results.map(transformProduct) };
};

export const getAccountProduct = async (slug: string): Promise<AccountProductDetail> => {
  const response = await resilientFetch(`${BASE_URL}/account-products/${slug}/`);
  if (!response.ok) throw await responseApiError(response);
  const api = (await response.json()) as AccountProductDetailApi;
  return {
    ...transformProduct(api),
    variants: api.variants,
    rateConditionsText: api.rate_conditions_text,
    withdrawalLimitForInterest: api.withdrawal_limit_for_interest,
    maintenanceWaiverText: api.maintenance_waiver_text,
    debitCardFirstYearFee: num(api.debit_card_first_year_fee),
    debitCardReplacementFee: num(api.debit_card_replacement_fee),
    statementDuplicateFee: num(api.statement_duplicate_fee),
    balanceConfirmationExtraFee: num(api.balance_confirmation_extra_fee),
    minBalanceRequired: num(api.min_balance_required),
    openingDeposit: num(api.opening_deposit),
    chequeBookAvailable: api.cheque_book_available,
    debitCardIncluded: api.debit_card_included,
    dormancyTerms: api.dormancy_terms,
    eligibilityNotes: api.eligibility_notes,
    sourceKind: api.source_kind,
    lastVerifiedAt: api.last_verified_at,
    verificationStatus: api.verification_status,
  };
};

export interface AccountScenarioInput {
  averageBalance: number;
  accountType?: AccountType;
  segments?: AccountSegment[];
  bank?: number;
  islamicOnly?: boolean;
  includeVariants?: boolean;
}

export interface AccountScenarioResult {
  product: AccountProduct;
  balance: number;
  rate: number;
  rateMax: number | null;
  isRange: boolean;
  interestBasis: string;
  basisNote: string;
  interestBlockedByMinBalance: boolean;
  interestEarned: number;
  interestEarnedAtMaxRate: number | null;
  /** Annualised (half-yearly charge × 2); null = not published. */
  maintenanceFeeAnnual: number | null;
  debitCardFeeAnnual: number | null;
  smsFeeAnnual: number | null;
  onlineBankingFeeAnnual: number | null;
  /** Sum of the published fee lines; null when no line is published. */
  totalFees: number | null;
  feesComplete: boolean;
  waiversApplied: string[];
  netAnnualValue: number | null;
  netAnnualValueAtMaxRate: number | null;
}

export interface AccountScenarioResponse {
  averageBalance: number;
  accountType: string;
  count: number;
  excludedWithoutRate: number;
  results: AccountScenarioResult[];
  segmentExcluded: AccountScenarioResult[];
  unrankedWithoutFees: AccountScenarioResult[];
  notes: string[];
}

/**
 * Scenario entries spread the backend's evaluate_product() dict next to
 * the list-serializer product; decimals arrive as strings, nulls stay
 * null (an unpublished fee line is never a zero).
 */
interface ScenarioResultApi {
  product: AccountProductApi;
  balance: string;
  rate: string;
  rate_max: string | null;
  is_range: boolean;
  interest_basis: string;
  basis_note: string;
  interest_blocked_by_min_balance: boolean;
  interest_earned: string;
  interest_earned_at_max_rate: string | null;
  maintenance_fee_annual: string | null;
  debit_card_fee_annual: string | null;
  sms_fee_annual: string | null;
  online_banking_fee_annual: string | null;
  total_fees: string | null;
  fees_complete: boolean;
  waivers_applied: string[];
  net_annual_value: string | null;
  net_annual_value_at_max_rate: string | null;
}

const transformScenarioResult = (api: ScenarioResultApi): AccountScenarioResult => ({
  product: transformProduct(api.product),
  balance: Number(api.balance),
  rate: Number(api.rate),
  rateMax: num(api.rate_max),
  isRange: api.is_range,
  interestBasis: api.interest_basis,
  basisNote: api.basis_note,
  interestBlockedByMinBalance: api.interest_blocked_by_min_balance,
  interestEarned: Number(api.interest_earned),
  interestEarnedAtMaxRate: num(api.interest_earned_at_max_rate),
  maintenanceFeeAnnual: num(api.maintenance_fee_annual),
  debitCardFeeAnnual: num(api.debit_card_fee_annual),
  smsFeeAnnual: num(api.sms_fee_annual),
  onlineBankingFeeAnnual: num(api.online_banking_fee_annual),
  totalFees: num(api.total_fees),
  feesComplete: api.fees_complete,
  waiversApplied: api.waivers_applied ?? [],
  netAnnualValue: num(api.net_annual_value),
  netAnnualValueAtMaxRate: num(api.net_annual_value_at_max_rate),
});

/** Run the server-side net-annual-value ranking. */
export const runAccountScenario = async (
  input: AccountScenarioInput
): Promise<AccountScenarioResponse> => {
  const body: Record<string, unknown> = {
    average_balance: input.averageBalance,
    account_type: input.accountType ?? 'savings',
    islamic_only: input.islamicOnly ?? false,
    include_variants: input.includeVariants ?? true,
  };
  if (input.segments && input.segments.length > 0) body.segments = input.segments;
  if (input.bank) body.bank = input.bank;

  const response = await resilientFetch(`${BASE_URL}/account-products/scenario/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as {
    average_balance: string;
    account_type: string;
    count: number;
    excluded_without_rate: number;
    results: ScenarioResultApi[];
    segment_excluded: ScenarioResultApi[];
    unranked_without_fees: ScenarioResultApi[];
    notes: string[];
  };
  return {
    averageBalance: Number(data.average_balance),
    accountType: data.account_type,
    count: data.count,
    excludedWithoutRate: data.excluded_without_rate,
    results: data.results.map(transformScenarioResult),
    segmentExcluded: data.segment_excluded.map(transformScenarioResult),
    unrankedWithoutFees: data.unranked_without_fees.map(transformScenarioResult),
    notes: data.notes,
  };
};

/** One account field-history entry, normalized from the API shape. */
export interface AccountHistoryEntry {
  id: number;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  changedAt: Date;
}

interface AccountHistoryApiEntry {
  id: number;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  created: string;
}

/**
 * Fetch a product's fee/rate-change history. Like the card and deposit
 * history endpoints, this requires authentication (anonymous requests
 * get a 403), so the access token comes from AuthProvider.
 */
export const getAccountFieldHistory = async (slug: string): Promise<AccountHistoryEntry[]> => {
  if (!authClient.hasSession()) {
    throw new ApiError(401, 'No active session');
  }
  const token = await authClient.getAccessToken();
  if (!token) throw new ApiError(401, 'No active session');
  const response = await resilientFetch(`${BASE_URL}/account-products/${slug}/field-history/`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as ApiResponse<AccountHistoryApiEntry>;
  return data.results.map(entry => ({
    id: entry.id,
    fieldName: entry.field_name,
    oldValue: entry.old_value ?? null,
    newValue: entry.new_value ?? null,
    changedAt: new Date(entry.created),
  }));
};
