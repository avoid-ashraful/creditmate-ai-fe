import { ENV } from '../config/env';
import { CreditCard, Bank, CardFilterOptions } from '../types';

const API_BASE_URL = ENV.API_BASE_URL;

export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CreditCardApiResponse {
  id: number;
  bank: Bank;
  bank_id: number;
  name: string;
  annual_fee: number;
  interest_rate_apr: number;
  lounge_access_international: number;
  lounge_access_domestic: number;
  cash_advance_fee: string;
  late_payment_fee: string;
  annual_fee_waiver_policy: Record<string, unknown> | null;
  reward_points_policy: string;
  additional_features: unknown[];
  is_active: boolean;
  has_lounge_access: boolean;
  total_lounge_access: number;
  has_annual_fee: boolean;
  created: string;
  modified: string;
  sourceUrl?: string;
  images?: Array<{ small: string; full: string }>;
}

export interface BankApiResponse {
  id: number;
  name: string;
  logo: string;
  website: string;
  is_active: boolean;
  credit_card_count: number;
  created: string;
  modified: string;
}

class ApiService {
  private async fetchApi<T>(endpoint: string, params?: URLSearchParams): Promise<T> {
    const url = params
      ? `${API_BASE_URL}${endpoint}?${params.toString()}`
      : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (ENV.ENABLE_API_LOGGING) {
        // eslint-disable-next-line no-console
        console.log('API Response:', { url, status: response.status, data });
      }

      return data;
    } catch (error) {
      if (ENV.ENABLE_API_LOGGING) {
        // eslint-disable-next-line no-console
        console.error('API fetch error:', { url, error });
      }
      throw error;
    }
  }

  // Banks API
  async getBanks(search?: string, ordering?: string): Promise<ApiResponse<BankApiResponse>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (ordering) params.append('ordering', ordering);

    return this.fetchApi<ApiResponse<BankApiResponse>>('/banks/', params);
  }

  async getBankDetails(id: number): Promise<BankApiResponse> {
    return this.fetchApi<BankApiResponse>(`/banks/${id}/`);
  }

  // Credit Cards API
  async getCreditCards(
    filters?: CardFilterOptions & {
      ids?: string;
      bank_ids?: string;
      ordering?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<ApiResponse<CreditCardApiResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      // ID filters
      if (filters.ids) params.append('ids', filters.ids);
      if (filters.bank_ids) params.append('bank_ids', filters.bank_ids);

      // Bank filters
      if (filters.bankId) params.append('bank', filters.bankId.toString());
      if (filters.bankName) params.append('bank_name', filters.bankName);

      // Search
      if (filters.searchTerm) params.append('search', filters.searchTerm);

      // Annual fee filters
      if (filters.annualFeeRange) {
        // Check if we should use string format (both min and max defined)
        if (filters.annualFeeRange.min !== undefined && filters.annualFeeRange.max !== undefined) {
          params.append(
            'annual_fee_range',
            `${filters.annualFeeRange.min},${filters.annualFeeRange.max}`
          );
        } else {
          // Use individual min/max parameters
          if (filters.annualFeeRange.min !== undefined) {
            params.append('annual_fee_min', filters.annualFeeRange.min.toString());
          }
          if (filters.annualFeeRange.max !== undefined) {
            params.append('annual_fee_max', filters.annualFeeRange.max.toString());
          }
        }
      }
      // Support for direct string format
      if (filters.annualFeeRangeString) {
        params.append('annual_fee_range', filters.annualFeeRangeString);
      }
      if (filters.hasAnnualFee !== undefined) {
        if (filters.hasAnnualFee) {
          params.append('has_annual_fee', 'true');
        } else {
          params.append('no_annual_fee', 'true');
        }
      }

      // Interest rate filters
      if (filters.interestRateRange) {
        // Check if we should use string format (both min and max defined)
        if (
          filters.interestRateRange.min !== undefined &&
          filters.interestRateRange.max !== undefined
        ) {
          params.append(
            'interest_rate_range',
            `${filters.interestRateRange.min},${filters.interestRateRange.max}`
          );
        } else {
          // Use individual min/max parameters
          if (filters.interestRateRange.min !== undefined) {
            params.append('interest_rate_min', filters.interestRateRange.min.toString());
          }
          if (filters.interestRateRange.max !== undefined) {
            params.append('interest_rate_max', filters.interestRateRange.max.toString());
          }
        }
      }
      // Support for direct string format
      if (filters.interestRateRangeString) {
        params.append('interest_rate_range', filters.interestRateRangeString);
      }

      // Lounge access filters
      if (filters.hasLoungeAccess !== undefined) {
        params.append('has_lounge_access', filters.hasLoungeAccess.toString());
      }
      if (filters.hasInternationalLounge !== undefined) {
        params.append('has_international_lounge', filters.hasInternationalLounge.toString());
      }
      if (filters.hasDomesticLounge !== undefined) {
        params.append('has_domestic_lounge', filters.hasDomesticLounge.toString());
      }
      if (filters.minInternationalLounge !== undefined) {
        params.append('min_international_lounge', filters.minInternationalLounge.toString());
      }
      if (filters.minDomesticLounge !== undefined) {
        params.append('min_domestic_lounge', filters.minDomesticLounge.toString());
      }

      // Feature filters
      if (filters.hasAdditionalFeatures !== undefined) {
        params.append('has_additional_features', filters.hasAdditionalFeatures.toString());
      }
      if (filters.featureSearch) {
        params.append('feature_search', filters.featureSearch);
      }
      if (filters.hasFeeWaiver !== undefined) {
        params.append('has_fee_waiver', filters.hasFeeWaiver.toString());
      }

      // Status filter
      if (filters.isActive !== undefined) {
        params.append('is_active', filters.isActive.toString());
      }

      // Pagination and ordering
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.page_size) params.append('page_size', filters.page_size.toString());
    }

    return this.fetchApi<ApiResponse<CreditCardApiResponse>>('/credit-cards/', params);
  }

  async getCreditCardDetails(id: number): Promise<CreditCardApiResponse> {
    return this.fetchApi<CreditCardApiResponse>(`/credit-cards/${id}/`);
  }

  async getSearchSuggestions(): Promise<{
    annual_fee_ranges: Array<{ label: string; filter: string }>;
    benefits: Array<{ label: string; filter: string }>;
    popular_banks: string[];
  }> {
    return this.fetchApi('/credit-cards/search-suggestions/');
  }

  // Transform API response to match frontend types
  transformCreditCard(apiCard: CreditCardApiResponse): CreditCard {
    return {
      id: apiCard.id,
      bankId: apiCard.bank_id,
      name: apiCard.name,
      annualFee: apiCard.annual_fee,
      interestRateApr: apiCard.interest_rate_apr,
      loungeAccessInternational: apiCard.lounge_access_international,
      loungeAccessDomestic: apiCard.lounge_access_domestic,
      cashAdvanceFee: apiCard.cash_advance_fee,
      latePaymentFee: apiCard.late_payment_fee,
      annualFeeWaiverPolicy: apiCard.annual_fee_waiver_policy,
      rewardPointsPolicy: apiCard.reward_points_policy,
      additionalFeatures: apiCard.additional_features,
      isActive: apiCard.is_active,
      sourceUrl: apiCard.sourceUrl || '',
      lastUpdated: new Date(apiCard.modified),
      images: apiCard.images || [],
    };
  }

  transformBank(apiBank: BankApiResponse): Bank {
    return {
      id: apiBank.id,
      name: apiBank.name,
      logo: apiBank.logo,
      website: apiBank.website,
      isActive: apiBank.is_active,
    };
  }
}

export const apiService = new ApiService();
