/**
 * CreditMate AI - Core Type Definitions
 */

/**
 * Bank entity representing a financial institution
 */
export interface Bank {
  id: number;
  name: string;
  logo: string;
  website: string;
  isActive: boolean;
}

/** Payment network; '' = unknown. */
export type CardNetwork =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'unionpay'
  | 'jcb'
  | 'diners'
  | 'other'
  | '';

/** Body of POST /credit-cards/{id}/report-issue/ */
export interface ReportIssueInput {
  field?: string;
  message: string;
  suggested_value?: string;
  contact_email?: string;
}

/**
 * Credit Card entity with complete product information
 * Note: annualFee and interestRateApr can be null if data is not available from source
 */
export interface CreditCard {
  id: number;
  bankId?: number; // undefined when the response does not include a bank identity
  bankName?: string;
  name: string;
  annualFee: number | null;
  interestRateApr: number | null;
  // Truthful display text from backend (e.g. "5 visits", "Unlimited"); counts are never invented.
  // null = field absent in response (unknown), '' = explicitly no access shown as "None".
  loungeAccessInternational: string | null;
  loungeAccessDomestic: string | null;
  cashAdvanceFee: string;
  latePaymentFee: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  annualFeeWaiverPolicy: Record<string, any> | null; // Waiver policy structure varies by bank
  rewardPointsPolicy: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalFeatures: any[]; // Using any as features can be of various types and structures
  sourceUrl: string; // bank schedule of charges ('' when unknown)
  // Trust fields: absent/undefined or null/'' always means unknown, never 0/false.
  applyUrl?: string;
  verifiedAt?: Date | null;
  cardNetwork?: CardNetwork;
  isIslamic?: boolean;
  isDualCurrency?: boolean | null;
  minMonthlyIncome?: number | null;
  supplementaryCardFee?: string;
  foreignTransactionFee?: string;
  isActive: boolean;
  lastUpdated: Date | null; // null when API omits the modified date - freshness stays unknown
  images: {
    small: string;
    full: string;
  }[];
}

/**
 * Filter options for credit card search
 */
export interface CardFilterOptions {
  bankId?: number;
  bankIds?: number[];
  bankName?: string;
  searchTerm?: string;

  // Annual fee filters
  annualFeeRange?: {
    min?: number;
    max?: number;
  };
  annualFeeRangeString?: string; // Format: "min,max" e.g., "0,200"
  hasAnnualFee?: boolean;

  // Interest rate filters
  interestRateRange?: {
    min?: number;
    max?: number;
  };
  interestRateRangeString?: string; // Format: "min,max" e.g., "18.0,25.0"

  // Lounge access filters
  hasLoungeAccess?: boolean;
  hasInternationalLounge?: boolean;
  hasDomesticLounge?: boolean;
  minInternationalLounge?: number;
  minDomesticLounge?: number;

  // Feature filters
  hasAdditionalFeatures?: boolean;
  featureSearch?: string;
  hasFeeWaiver?: boolean;

  // Status
  isActive?: boolean;

  // Legacy support
  minAnnualFee?: number;
  maxAnnualFee?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
}

/**
 * Comparison result for selected credit cards
 */
export interface CardComparison {
  cards: CreditCard[];
  comparisonId?: string; // For shareable comparisons
  createdAt: Date;
}

/**
 * Educational content types
 */
export interface GlossaryItem {
  term: string;
  definition: string;
  relatedTerms?: string[];
}

export interface GuideArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  publishedDate: Date;
  lastUpdated?: Date;
}

/**
 * Alert types - re-exported from alerts.ts
 */
export * from './alerts';

/**
 * Review types for community reviews feature
 */
export interface Review {
  id: number;
  cardId: number;
  rating: number; // 1-5
  title: string;
  body: string;
  pros: string;
  cons: string;
  helpfulCount: number;
  reviewerName: string;
  created: Date;
  modified: Date;
}

export interface ReviewSummary {
  card: number;
  average_rating: number | null;
  review_count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface CreateReviewInput {
  card: number;
  rating: number;
  title: string;
  body: string;
  pros?: string;
  cons?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  body?: string;
  pros?: string;
  cons?: string;
}
