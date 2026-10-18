/**
 * Advanced Search API client for CreditMate AI.
 *
 * Calls the backend endpoints:
 * - GET /api/v1/credit-cards/advanced-search/ (main search with filters, sorting, facets)
 * - GET /api/v1/credit-cards/advanced-search/sort-options/
 * - GET /api/v1/credit-cards/advanced-search/categories/
 * - GET /api/v1/credit-cards/advanced-search/normalize/
 */

import { ENV } from '../config/env';
import { CreditCard } from '../types';

import { apiService, CreditCardApiResponse } from './api';

const ADVANCED_SEARCH_BASE = '/credit-cards/advanced-search/';

/** Canonical category from backend */
export interface AdvancedSearchCategory {
  slug: string;
  name: string;
}

/** Sort option from backend */
export interface AdvancedSearchSortOption {
  key: string;
  label: string;
  description: string;
}

/** Facet bucket (common shape across types) */
export interface FacetBucket {
  key: string;
  label: string;
  count?: number;
  from?: number;
  to?: number;
  filter?: string;
  true_count?: number;
  false_count?: number;
}

/** Facet definition */
export interface AdvancedSearchFacet {
  label: string;
  type: 'terms' | 'range' | 'boolean' | 'category';
  buckets: FacetBucket[];
}

/** Normalized query params from backend */
export interface NormalizedQuery {
  search?: string;
  categories?: string;
  annual_fee_min?: string;
  annual_fee_max?: string;
  interest_rate_min?: string;
  interest_rate_max?: string;
  has_lounge_access?: string;
  has_international_lounge?: string;
  has_domestic_lounge?: string;
  has_annual_fee?: string;
  no_annual_fee?: string;
  has_additional_features?: string;
  has_fee_waiver?: string;
  feature_search?: string;
  bank_ids?: string;
  ordering?: string;
  page?: string;
  page_size?: string;
  facets?: string;
  [key: string]: string | undefined;
}

/** Advanced search response */
export interface AdvancedSearchResponse {
  query: string;
  total: number;
  page: number;
  page_size: number;
  results: CreditCardApiResponse[];
  facets: Record<string, AdvancedSearchFacet>;
  took: number;
  source: 'elasticsearch' | 'database';
  cached?: boolean;
  sort_options: AdvancedSearchSortOption[];
  categories: AdvancedSearchCategory[];
  normalized_query: NormalizedQuery;
}

/** Sort options response */
export interface SortOptionsResponse {
  sort_options: AdvancedSearchSortOption[];
}

/** Categories response */
export interface CategoriesResponse {
  categories: AdvancedSearchCategory[];
}

/** Normalize response */
export interface NormalizeResponse {
  normalized_query: NormalizedQuery;
  query_hash: string;
  canonical_string: string;
}

/** Request parameters for advanced search */
export interface AdvancedSearchParams {
  search?: string;
  categories?: string; // comma-separated slugs
  annual_fee_min?: number;
  annual_fee_max?: number;
  interest_rate_min?: number;
  interest_rate_max?: number;
  has_lounge_access?: boolean;
  has_international_lounge?: boolean;
  has_domestic_lounge?: boolean;
  has_annual_fee?: boolean;
  no_annual_fee?: boolean;
  has_additional_features?: boolean;
  has_fee_waiver?: boolean;
  card_network?: string; // comma-separated networks
  is_islamic?: boolean;
  is_dual_currency?: boolean;
  max_min_monthly_income?: number;
  include_unknown_income?: 'true' | 'false'; // 'false' must reach the API, so not a boolean
  feature_search?: string;
  bank_ids?: number[];
  ordering?: string;
  page?: number;
  page_size?: number;
  facets?: string; // comma-separated facet names
}

/** UI state for the advanced search page */
export interface AdvancedSearchUIState {
  search: string;
  categories: string[]; // selected category slugs
  annualFeeMin: number | '';
  annualFeeMax: number | '';
  aprMin: number | '';
  aprMax: number | '';
  hasLoungeAccess: boolean;
  hasInternationalLounge: boolean;
  hasDomesticLounge: boolean;
  hasAnnualFee: boolean;
  noAnnualFee: boolean;
  hasFeeWaiver: boolean;
  cardNetworks: string[];
  isIslamic: boolean;
  isDualCurrency: boolean;
  maxMinMonthlyIncome: number | '';
  includeUnknownIncome: boolean;
  featureSearch: string;
  bankIds: number[];
  ordering: string;
  page: number;
  pageSize: number;
  facets: string;
}

/** Default facets to request */
export const DEFAULT_FACETS = [
  'bank',
  'category',
  'annual_fee_range',
  'interest_rate_range',
  'lounge_access',
  'fee_waiver',
  'has_annual_fee',
  'card_network',
  'is_islamic',
  'is_dual_currency',
].join(',');

/** Default page size */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Convert UI state to API parameters
 */
export function uiStateToParams(state: AdvancedSearchUIState): AdvancedSearchParams {
  const params: AdvancedSearchParams = {
    page: state.page,
    page_size: state.pageSize,
    facets: state.facets || DEFAULT_FACETS,
  };

  if (state.search) params.search = state.search;
  if (state.categories.length > 0) params.categories = state.categories.join(',');
  if (state.annualFeeMin !== '') params.annual_fee_min = state.annualFeeMin as number;
  if (state.annualFeeMax !== '') params.annual_fee_max = state.annualFeeMax as number;
  if (state.aprMin !== '') params.interest_rate_min = state.aprMin as number;
  if (state.aprMax !== '') params.interest_rate_max = state.aprMax as number;
  if (state.hasLoungeAccess) params.has_lounge_access = true;
  if (state.hasInternationalLounge) params.has_international_lounge = true;
  if (state.hasDomesticLounge) params.has_domestic_lounge = true;
  if (state.hasAnnualFee) params.has_annual_fee = true;
  if (state.noAnnualFee) params.no_annual_fee = true;
  if (state.hasFeeWaiver) params.has_fee_waiver = true;
  if (state.cardNetworks.length > 0) params.card_network = state.cardNetworks.join(',');
  if (state.isIslamic) params.is_islamic = true;
  if (state.isDualCurrency) params.is_dual_currency = true;
  if (state.maxMinMonthlyIncome !== '') {
    params.max_min_monthly_income = state.maxMinMonthlyIncome;
    params.include_unknown_income = state.includeUnknownIncome ? 'true' : 'false';
  }
  if (state.featureSearch) params.feature_search = state.featureSearch;
  if (state.bankIds.length > 0) params.bank_ids = state.bankIds;
  if (state.ordering) params.ordering = state.ordering;

  return params;
}

/**
 * Convert API parameters to URL search params string
 */
export function paramsToSearchParams(params: AdvancedSearchParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, value.join(','));
      }
    } else if (typeof value === 'boolean') {
      if (value) searchParams.set(key, 'true');
    } else {
      searchParams.set(key, String(value));
    }
  });

  return searchParams;
}

/**
 * Parse URL search params to UI state
 */
export function searchParamsToUIState(
  searchParams: URLSearchParams
): Partial<AdvancedSearchUIState> {
  const state: Partial<AdvancedSearchUIState> = {};

  const search = searchParams.get('search');
  if (search) state.search = search;

  const categories = searchParams.get('categories');
  if (categories) state.categories = categories.split(',').filter(Boolean);

  const annualFeeMin = searchParams.get('annual_fee_min');
  if (annualFeeMin) state.annualFeeMin = Number(annualFeeMin);

  const annualFeeMax = searchParams.get('annual_fee_max');
  if (annualFeeMax) state.annualFeeMax = Number(annualFeeMax);

  const interestRateMin = searchParams.get('interest_rate_min');
  if (interestRateMin) state.aprMin = Number(interestRateMin);

  const interestRateMax = searchParams.get('interest_rate_max');
  if (interestRateMax) state.aprMax = Number(interestRateMax);

  // Boolean params - explicitly handle both 'true' and 'false'
  const hasLoungeAccess = searchParams.get('has_lounge_access');
  if (hasLoungeAccess !== null) state.hasLoungeAccess = hasLoungeAccess === 'true';

  const hasInternationalLounge = searchParams.get('has_international_lounge');
  if (hasInternationalLounge !== null)
    state.hasInternationalLounge = hasInternationalLounge === 'true';

  const hasDomesticLounge = searchParams.get('has_domestic_lounge');
  if (hasDomesticLounge !== null) state.hasDomesticLounge = hasDomesticLounge === 'true';

  const hasAnnualFee = searchParams.get('has_annual_fee');
  if (hasAnnualFee !== null) state.hasAnnualFee = hasAnnualFee === 'true';

  const noAnnualFee = searchParams.get('no_annual_fee');
  if (noAnnualFee !== null) state.noAnnualFee = noAnnualFee === 'true';

  const hasFeeWaiver = searchParams.get('has_fee_waiver');
  if (hasFeeWaiver !== null) state.hasFeeWaiver = hasFeeWaiver === 'true';

  const cardNetwork = searchParams.get('card_network');
  if (cardNetwork) state.cardNetworks = cardNetwork.split(',').filter(Boolean);

  const isIslamic = searchParams.get('is_islamic');
  if (isIslamic !== null) state.isIslamic = isIslamic === 'true';

  const isDualCurrency = searchParams.get('is_dual_currency');
  if (isDualCurrency !== null) state.isDualCurrency = isDualCurrency === 'true';

  const maxMinIncome = searchParams.get('max_min_monthly_income');
  if (maxMinIncome && Number.isFinite(Number(maxMinIncome))) {
    state.maxMinMonthlyIncome = Number(maxMinIncome);
  }

  const includeUnknownIncome = searchParams.get('include_unknown_income');
  if (includeUnknownIncome !== null) state.includeUnknownIncome = includeUnknownIncome === 'true';

  const featureSearch = searchParams.get('feature_search');
  if (featureSearch) state.featureSearch = featureSearch;

  const bankIds = searchParams.get('bank_ids');
  if (bankIds) {
    state.bankIds = bankIds
      .split(',')
      .map(Number)
      .filter((n): n is number => Number.isFinite(n) && n !== 0);
  }

  const ordering = searchParams.get('ordering');
  if (ordering) state.ordering = ordering;

  const page = searchParams.get('page');
  if (page) state.page = Math.max(1, Number(page));

  const pageSize = searchParams.get('page_size');
  if (pageSize) state.pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize)));

  const facets = searchParams.get('facets');
  if (facets) state.facets = facets;

  return state;
}

/**
 * Default UI state
 */
export const DEFAULT_UI_STATE: AdvancedSearchUIState = {
  search: '',
  categories: [],
  annualFeeMin: '',
  annualFeeMax: '',
  aprMin: '',
  aprMax: '',
  hasLoungeAccess: false,
  hasInternationalLounge: false,
  hasDomesticLounge: false,
  hasAnnualFee: false,
  noAnnualFee: false,
  hasFeeWaiver: false,
  cardNetworks: [],
  isIslamic: false,
  isDualCurrency: false,
  maxMinMonthlyIncome: '',
  includeUnknownIncome: true,
  featureSearch: '',
  bankIds: [],
  ordering: 'relevance',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  facets: DEFAULT_FACETS,
};

/** Advanced Search API Service */
class AdvancedSearchService {
  private async fetchApi<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
    const url = params
      ? `${ENV.API_BASE_URL}${endpoint}?${params.toString()}`
      : `${ENV.API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMITED');
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (ENV.ENABLE_API_LOGGING) {
        // eslint-disable-next-line no-console
        console.log('Advanced Search API Response:', { url, status: response.status, data });
      }

      return data;
    } catch (error) {
      if (ENV.ENABLE_API_LOGGING) {
        // eslint-disable-next-line no-console
        console.error('Advanced Search API fetch error:', { url, error });
      }
      throw error;
    }
  }

  /**
   * Execute advanced search with filters, sorting, and facets
   */
  async search(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
    const searchParams = paramsToSearchParams(params);
    return this.fetchApi<AdvancedSearchResponse>(ADVANCED_SEARCH_BASE, searchParams);
  }

  /**
   * Get available sort options
   */
  async getSortOptions(): Promise<SortOptionsResponse> {
    return this.fetchApi<SortOptionsResponse>(`${ADVANCED_SEARCH_BASE}sort-options/`);
  }

  /**
   * Get canonical categories
   */
  async getCategories(): Promise<CategoriesResponse> {
    return this.fetchApi<CategoriesResponse>(`${ADVANCED_SEARCH_BASE}categories/`);
  }

  /**
   * Normalize query parameters for saved searches
   */
  async normalize(params: AdvancedSearchParams): Promise<NormalizeResponse> {
    const searchParams = paramsToSearchParams(params);
    return this.fetchApi<NormalizeResponse>(`${ADVANCED_SEARCH_BASE}normalize/`, searchParams);
  }
}

export const advancedSearchService = new AdvancedSearchService();

/**
 * Transform backend card to frontend CreditCard type
 * Reuses the existing apiService.transformCreditCard
 */
export function transformAdvancedSearchCard(card: CreditCardApiResponse): CreditCard {
  return apiService.transformCreditCard(card);
}

/**
 * Extract facet counts for UI display
 * Returns a map of filter key -> count for showing badge counts on filter controls
 */
export function extractFacetCounts(
  facets: Record<string, AdvancedSearchFacet>
): Record<string, number> {
  const counts: Record<string, number> = {};

  Object.entries(facets).forEach(([facetName, facet]) => {
    if (facet.type === 'category') {
      facet.buckets.forEach(bucket => {
        if (bucket.filter) {
          // Extract category slug from filter like "categories=travel"
          const match = bucket.filter.match(/categories=([^&]+)/);
          if (match) {
            counts[`category:${match[1]}`] = bucket.count ?? 0;
          }
        }
      });
    } else if (facet.type === 'boolean') {
      facet.buckets.forEach(bucket => {
        counts[`${facetName}:${bucket.key}`] =
          bucket.count ?? bucket.true_count ?? bucket.false_count ?? 0;
      });
    } else if (facet.type === 'range') {
      facet.buckets.forEach(bucket => {
        counts[`${facetName}:${bucket.key}`] = bucket.count ?? 0;
      });
    } else if (facet.type === 'terms') {
      facet.buckets.forEach(bucket => {
        counts[`${facetName}:${bucket.key}`] = bucket.count ?? 0;
      });
    }
  });

  return counts;
}
