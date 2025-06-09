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

/**
 * Credit Card entity with complete product information
 */
export interface CreditCard {
  id: number;
  bankId: number;
  name: string;
  annualFee: number;
  interestRateApr: number;
  loungeAccessInternational: number;
  loungeAccessDomestic: number;
  cashAdvanceFee: string;
  latePaymentFee: string;
  annualFeeWaiverPolicy: Record<string, any> | null;
  rewardPointsPolicy: string;
  additionalFeatures: any[];
  sourceUrl: string;
  isActive: boolean;
  lastUpdated: Date;
}

/**
 * Filter options for credit card search
 */
export interface CardFilterOptions {
  bankIds?: number[];
  minAnnualFee?: number;
  maxAnnualFee?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  hasInternationalLounge?: boolean;
  hasDomesticLounge?: boolean;
  searchTerm?: string;
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
