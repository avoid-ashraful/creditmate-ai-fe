import { ENV } from '../config/env';

import { responseApiError, resilientFetch } from './apiError';
import { authClient } from './auth';

/**
 * Client for the loan comparison API (/loan-products/).
 *
 * Rate discipline mirrors the backend: a product's price is a BAND
 * (min–max), never a point. `effectiveRate` is the band the UI should
 * show — the product's own published band when it has one, otherwise the
 * Bangladesh Bank lending-chart band for its bank, always labelled with
 * its source. Formula-priced products (a spread over a deposit rate)
 * have no band and no EMI — the UI must say so rather than invent one.
 *
 * Islamic products are priced in EXPECTED PROFIT (`rateLabel`), never
 * interest.
 */

export type LoanType = 'personal' | 'home' | 'car' | 'secured_against_deposit';
export type RateSource =
  | 'bb_chart'
  | 'annexure_a'
  | 'product_page'
  | 'schedule_of_charges'
  | 'manual'
  | 'none';
export type RateLabel = 'interest' | 'expected_profit';
/** Bangladesh Bank lending-chart column a fallback band was taken from. */
export type BandCategory = 'consumer_credit' | 'housing';

export interface EffectiveRate {
  min: number;
  max: number;
  source: RateSource;
  label: RateLabel;
  /** Set only for bb_chart fallback bands: which chart column priced this. */
  category: BandCategory | null;
}

export interface LoanProductListItem {
  id: number;
  slug: string;
  name: string;
  bank: number | null;
  bankName: string | null;
  institutionName: string;
  lenderName: string;
  lenderType: 'bank' | 'nbfi' | 'govt';
  loanType: LoanType;
  segmentTags: string[];
  purposeTags: string[];
  isIslamic: boolean;
  shariahMode: string;
  rateLabel: RateLabel;
  rateMin: number | null;
  rateMax: number | null;
  rateType: string;
  rateSource: RateSource;
  spreadOverDepositRate: number | null;
  usesSimpleInterest: boolean;
  effectiveRate: EffectiveRate | null;
  amountMinBdt: number | null;
  amountMaxBdt: number | null;
  tenureMinMonths: number | null;
  tenureMaxMonths: number | null;
  ltvPercent: number | null;
  processingFeePercent: number | null;
  processingFeePercentMax: number | null;
  processingFeeCapBdt: number | null;
  minIncomeBySegment: Record<string, number>;
  incomeMetric: 'gross' | 'net' | 'mixed';
  sourceUrl: string;
  verifiedAt: string | null;
}

export interface LoanProductDetail extends LoanProductListItem {
  rateBasisText: string;
  amountNotes: string;
  gracePeriodMonths: number | null;
  processingFeeNotes: string;
  earlySettlementPercent: number | null;
  earlySettlementNotes: string;
  partialPrepaymentPercent: number | null;
  partialPrepaymentRules: string;
  penalChargePercent: number | null;
  penalChargeNotes: string;
  supervisionChargePercent: number | null;
  minAge: number | null;
  maxAgeAtMaturity: number | null;
  experienceRequirements: Record<string, string>;
  guarantorRequired: boolean;
  guarantorCount: number | null;
  guarantorRules: string;
  collateralType: string;
  collateralRules: string;
  dbrMaxPercent: number | null;
  documentsChecklist: string[];
  disbursementMode: string;
  jointApplicationAllowed: boolean;
  insuranceRequired: boolean;
  insuranceBundled: boolean;
  insuranceNotes: string;
  unsecuredMaxBdt: number | null;
  incomeMultipleMax: number | null;
  securedBy: string;
  depositType: string;
  ltvOfDepositPercent: number | null;
  propertyTypes: string[];
  maxAmountByPurpose: Record<string, unknown>;
  takeoverAllowed: boolean;
  nrbEligible: boolean;
  registrationCostIncluded: boolean;
  vehicleConditions: string[];
  ltvByVehicleType: Record<string, number>;
  brtaRegistrationRequired: boolean;
  sourceKind: string;
  sourceEffectiveDate: string | null;
  verifiedBy: string;
  regulatoryCapFlags: string[];
  notes: string;
}

export interface LoanFieldHistoryEntry {
  id: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  source: string;
  created: string;
}

export interface RegulatoryCap {
  key: string;
  effectiveFrom: string;
  params: Record<string, number>;
  description: string;
  sourceNote: string;
}

export interface ScenarioFlag {
  code: string;
  message: string;
}

export interface ScenarioCostAtRate {
  rate: number;
  emi: number;
  totalInterestOrProfit: number;
  totalCost: number;
}

export interface ScenarioResultItem {
  product: LoanProductListItem;
  eligible: boolean;
  flags: ScenarioFlag[];
  warnings: ScenarioFlag[];
  band: { min: number; max: number; source: RateSource; category: BandCategory | null } | null;
  rateLabel: RateLabel;
  usesSimpleInterest: boolean;
  processingFee: number | null;
  processingFeeInclVat: number | null;
  supervisionCharge: number | null;
  atMinRate: ScenarioCostAtRate | null;
  atMaxRate: ScenarioCostAtRate | null;
  note: string | null;
}

export interface LoanScenarioInput {
  loanType: LoanType;
  amount: number;
  tenureMonths: number;
  monthlyIncome?: number;
  islamicOnly?: boolean;
}

export interface LoanScenarioResponse {
  loanType: LoanType;
  amount: number;
  tenureMonths: number;
  monthlyIncome: number | null;
  results: ScenarioResultItem[];
  notes: string[];
}

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapBandCategory = (value: unknown): BandCategory | null =>
  value === 'consumer_credit' || value === 'housing' ? value : null;

const mapEffectiveRate = (raw: Record<string, unknown> | null): EffectiveRate | null => {
  if (!raw) return null;
  const min = num(raw.min);
  const max = num(raw.max);
  if (min === null || max === null) return null;
  return {
    min,
    max,
    source: (raw.source as RateSource) ?? 'none',
    label: (raw.label as RateLabel) ?? 'interest',
    category: mapBandCategory(raw.category),
  };
};

const mapListItem = (raw: Record<string, unknown>): LoanProductListItem => ({
  id: Number(raw.id),
  slug: String(raw.slug),
  name: String(raw.name),
  bank: raw.bank === null || raw.bank === undefined ? null : Number(raw.bank),
  bankName: (raw.bank_name as string) ?? null,
  institutionName: String(raw.institution_name ?? ''),
  lenderName: String(raw.lender_name ?? raw.bank_name ?? raw.institution_name ?? ''),
  lenderType: (raw.lender_type as LoanProductListItem['lenderType']) ?? 'bank',
  loanType: raw.loan_type as LoanType,
  segmentTags: (raw.segment_tags as string[]) ?? [],
  purposeTags: (raw.purpose_tags as string[]) ?? [],
  isIslamic: Boolean(raw.is_islamic),
  shariahMode: String(raw.shariah_mode ?? ''),
  rateLabel: (raw.rate_label as RateLabel) ?? 'interest',
  rateMin: num(raw.rate_min),
  rateMax: num(raw.rate_max),
  rateType: String(raw.rate_type ?? 'unknown'),
  rateSource: (raw.rate_source as RateSource) ?? 'none',
  spreadOverDepositRate: num(raw.spread_over_deposit_rate),
  usesSimpleInterest: Boolean(raw.uses_simple_interest),
  effectiveRate: mapEffectiveRate(raw.effective_rate as Record<string, unknown> | null),
  amountMinBdt: num(raw.amount_min_bdt),
  amountMaxBdt: num(raw.amount_max_bdt),
  tenureMinMonths: num(raw.tenure_min_months),
  tenureMaxMonths: num(raw.tenure_max_months),
  ltvPercent: num(raw.ltv_percent),
  processingFeePercent: num(raw.processing_fee_percent),
  processingFeePercentMax: num(raw.processing_fee_percent_max),
  processingFeeCapBdt: num(raw.processing_fee_cap_bdt),
  minIncomeBySegment: (raw.min_income_by_segment as Record<string, number>) ?? {},
  incomeMetric: (raw.income_metric as LoanProductListItem['incomeMetric']) ?? 'gross',
  sourceUrl: String(raw.source_url ?? ''),
  verifiedAt: (raw.verified_at as string) ?? null,
});

const mapDetail = (raw: Record<string, unknown>): LoanProductDetail => ({
  ...mapListItem(raw),
  rateBasisText: String(raw.rate_basis_text ?? ''),
  amountNotes: String(raw.amount_notes ?? ''),
  gracePeriodMonths: num(raw.grace_period_months),
  processingFeeNotes: String(raw.processing_fee_notes ?? ''),
  earlySettlementPercent: num(raw.early_settlement_percent),
  earlySettlementNotes: String(raw.early_settlement_notes ?? ''),
  partialPrepaymentPercent: num(raw.partial_prepayment_percent),
  partialPrepaymentRules: String(raw.partial_prepayment_rules ?? ''),
  penalChargePercent: num(raw.penal_charge_percent),
  penalChargeNotes: String(raw.penal_charge_notes ?? ''),
  supervisionChargePercent: num(raw.supervision_charge_percent),
  minAge: num(raw.min_age),
  maxAgeAtMaturity: num(raw.max_age_at_maturity),
  experienceRequirements: (raw.experience_requirements as Record<string, string>) ?? {},
  guarantorRequired: Boolean(raw.guarantor_required),
  guarantorCount: num(raw.guarantor_count),
  guarantorRules: String(raw.guarantor_rules ?? ''),
  collateralType: String(raw.collateral_type ?? 'none'),
  collateralRules: String(raw.collateral_rules ?? ''),
  dbrMaxPercent: num(raw.dbr_max_percent),
  documentsChecklist: (raw.documents_checklist as string[]) ?? [],
  disbursementMode: String(raw.disbursement_mode ?? ''),
  jointApplicationAllowed: Boolean(raw.joint_application_allowed),
  insuranceRequired: Boolean(raw.insurance_required),
  insuranceBundled: Boolean(raw.insurance_bundled),
  insuranceNotes: String(raw.insurance_notes ?? ''),
  unsecuredMaxBdt: num(raw.unsecured_max_bdt),
  incomeMultipleMax: num(raw.income_multiple_max),
  securedBy: String(raw.secured_by ?? ''),
  depositType: String(raw.deposit_type ?? ''),
  ltvOfDepositPercent: num(raw.ltv_of_deposit_percent),
  propertyTypes: (raw.property_types as string[]) ?? [],
  maxAmountByPurpose: (raw.max_amount_by_purpose as Record<string, unknown>) ?? {},
  takeoverAllowed: Boolean(raw.takeover_allowed),
  nrbEligible: Boolean(raw.nrb_eligible),
  registrationCostIncluded: Boolean(raw.registration_cost_included),
  vehicleConditions: (raw.vehicle_conditions as string[]) ?? [],
  ltvByVehicleType: (raw.ltv_by_vehicle_type as Record<string, number>) ?? {},
  brtaRegistrationRequired: Boolean(raw.brta_registration_required),
  sourceKind: String(raw.source_kind ?? ''),
  sourceEffectiveDate: (raw.source_effective_date as string) ?? null,
  verifiedBy: String(raw.verified_by ?? ''),
  regulatoryCapFlags: (raw.regulatory_cap_flags as string[]) ?? [],
  notes: String(raw.notes ?? ''),
});

export interface LoanListParams {
  loanType?: LoanType;
  segment?: string;
  islamicOnly?: boolean;
  bank?: number;
}

interface Paginated {
  results: Array<Record<string, unknown>>;
  next: string | null;
}

const fetchAllPages = async <T>(
  firstUrl: string,
  map: (raw: Record<string, unknown>) => T
): Promise<T[]> => {
  const items: T[] = [];
  let url: string | null = firstUrl;
  let guard = 0;
  while (url && guard < 10) {
    guard += 1;
    const response: Response = await resilientFetch(url);
    if (!response.ok) throw await responseApiError(response);
    const data = (await response.json()) as Paginated;
    items.push(...data.results.map(map));
    url = data.next;
  }
  return items;
};

/** Fetch the public loan catalogue (optionally filtered server-side). */
export const fetchLoanProducts = async (
  params: LoanListParams = {}
): Promise<LoanProductListItem[]> => {
  const query = new URLSearchParams({ page_size: '100' });
  if (params.loanType) query.set('loan_type', params.loanType);
  if (params.segment) query.set('segment', params.segment);
  if (params.islamicOnly) query.set('is_islamic', 'true');
  if (params.bank) query.set('bank', String(params.bank));
  return fetchAllPages(`${BASE_URL}/loan-products/?${query.toString()}`, mapListItem);
};

/** Fetch one product's full terms by slug. */
export const fetchLoanProduct = async (slug: string): Promise<LoanProductDetail> => {
  const response = await resilientFetch(`${BASE_URL}/loan-products/${slug}/`);
  if (!response.ok) throw await responseApiError(response);
  return mapDetail((await response.json()) as Record<string, unknown>);
};

/**
 * Field history for a product. The endpoint is public (redesign
 * decision D1); the token is attached when a session exists. A 401/403
 * still degrades to an empty list rather than failing the page.
 */
export const fetchLoanFieldHistory = async (slug: string): Promise<LoanFieldHistoryEntry[]> => {
  const headers: Record<string, string> = {};
  if (authClient.hasSession()) {
    const token = await authClient.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await resilientFetch(`${BASE_URL}/loan-products/${slug}/field-history/`, {
    headers,
  });
  if (response.status === 403 || response.status === 401) return [];
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as Array<Record<string, unknown>>;
  return data.map(entry => ({
    id: Number(entry.id),
    fieldName: String(entry.field_name),
    oldValue: String(entry.old_value ?? ''),
    newValue: String(entry.new_value ?? ''),
    source: String(entry.source ?? ''),
    created: String(entry.created ?? ''),
  }));
};

/** The latest dated Bangladesh Bank ceilings (context for the UI). */
export const fetchRegulatoryCaps = async (): Promise<RegulatoryCap[]> => {
  const response = await resilientFetch(`${BASE_URL}/loan-products/regulatory-caps/`);
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as Array<Record<string, unknown>>;
  return data.map(cap => ({
    key: String(cap.key),
    effectiveFrom: String(cap.effective_from),
    params: (cap.params as Record<string, number>) ?? {},
    description: String(cap.description ?? ''),
    sourceNote: String(cap.source_note ?? ''),
  }));
};

const mapCostAtRate = (raw: Record<string, unknown> | null): ScenarioCostAtRate | null => {
  if (!raw) return null;
  const rate = num(raw.rate);
  const emi = num(raw.emi);
  const totalInterestOrProfit = num(raw.total_interest_or_profit);
  const totalCost = num(raw.total_cost);
  if (rate === null || emi === null || totalInterestOrProfit === null || totalCost === null)
    return null;
  return { rate, emi, totalInterestOrProfit, totalCost };
};

/** Run the scenario: cost every product of a type at both band ends. */
export const runLoanScenario = async (input: LoanScenarioInput): Promise<LoanScenarioResponse> => {
  const body: Record<string, unknown> = {
    loan_type: input.loanType,
    amount: input.amount,
    tenure_months: input.tenureMonths,
    islamic_only: input.islamicOnly ?? false,
  };
  if (input.monthlyIncome !== undefined && input.monthlyIncome !== null) {
    body.monthly_income = input.monthlyIncome;
  }
  const response = await resilientFetch(`${BASE_URL}/loan-products/scenario/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await responseApiError(response);
  const data = (await response.json()) as Record<string, unknown>;
  const results = (data.results as Array<Record<string, unknown>>).map(item => ({
    product: mapListItem(item.product as Record<string, unknown>),
    eligible: Boolean(item.eligible),
    flags: (item.flags as ScenarioFlag[]) ?? [],
    warnings: (item.warnings as ScenarioFlag[]) ?? [],
    band:
      item.band === null || item.band === undefined
        ? null
        : {
            min: num((item.band as Record<string, unknown>).min) ?? 0,
            max: num((item.band as Record<string, unknown>).max) ?? 0,
            source: ((item.band as Record<string, unknown>).source as RateSource) ?? 'none',
            category: mapBandCategory((item.band as Record<string, unknown>).category),
          },
    rateLabel: (item.rate_label as RateLabel) ?? 'interest',
    usesSimpleInterest: Boolean(item.uses_simple_interest),
    processingFee: num(item.processing_fee),
    processingFeeInclVat: num(item.processing_fee_incl_vat),
    supervisionCharge: num(item.supervision_charge),
    atMinRate: mapCostAtRate(item.at_min_rate as Record<string, unknown> | null),
    atMaxRate: mapCostAtRate(item.at_max_rate as Record<string, unknown> | null),
    note: (item.note as string) ?? null,
  }));
  return {
    loanType: data.loan_type as LoanType,
    amount: Number(data.amount),
    tenureMonths: Number(data.tenure_months),
    monthlyIncome: num(data.monthly_income),
    results,
    notes: (data.notes as string[]) ?? [],
  };
};
