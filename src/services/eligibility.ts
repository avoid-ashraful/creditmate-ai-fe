import { ENV } from '../config/env';
import { CreditCard } from '../types';

import { apiService, CreditCardApiResponse } from './api';
import { responseApiError, resilientFetch } from './apiError';

/**
 * Client for the stateless eligibility checker
 * (POST /credit-cards/eligibility/).
 *
 * Verdicts come from the backend, which bases them only on each card's
 * published minimum monthly income and the applicant's self-declared CIB
 * status. Nothing is stored server-side.
 */

export type EligibilityVerdict = 'eligible' | 'likely' | 'unknown' | 'not_yet';
export type CibStatus = 'clean' | 'has_issues' | 'unknown';
export type EmploymentType = 'salaried' | 'self_employed' | 'other';

export interface EligibilityProfile {
  monthlyIncome: number;
  employmentType: EmploymentType;
  age?: number;
  hasTin?: boolean;
  cibStatus?: CibStatus;
  islamicOnly?: boolean;
}

export interface EligibilityResultItem {
  card: CreditCard;
  verdict: EligibilityVerdict;
  reasons: string[];
}

export interface EligibilityResponse {
  counts: Record<EligibilityVerdict, number>;
  totalCards: number;
  results: EligibilityResultItem[];
  notes: string[];
  method: string;
  disclaimer: string;
}

interface EligibilityApiItem {
  card: CreditCardApiResponse;
  verdict: EligibilityVerdict;
  reasons: string[];
}

interface EligibilityApiResponse {
  counts: Record<EligibilityVerdict, number>;
  total_cards: number;
  results: EligibilityApiItem[];
  notes: string[];
  method: string;
  disclaimer: string;
}

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

/** Display order for verdict groups: strongest first. */
export const VERDICT_ORDER: EligibilityVerdict[] = ['eligible', 'likely', 'unknown', 'not_yet'];

/** Group result items by verdict, in display order, skipping empty groups. */
export const groupResultsByVerdict = (
  results: EligibilityResultItem[]
): Array<{ verdict: EligibilityVerdict; items: EligibilityResultItem[] }> =>
  VERDICT_ORDER.map(verdict => ({
    verdict,
    items: results.filter(item => item.verdict === verdict),
  })).filter(group => group.items.length > 0);

/** Run one eligibility check for an applicant profile. */
export const checkEligibility = async (
  profile: EligibilityProfile
): Promise<EligibilityResponse> => {
  const body: Record<string, unknown> = {
    monthly_income: profile.monthlyIncome,
    employment_type: profile.employmentType,
    islamic_only: profile.islamicOnly ?? false,
  };
  if (profile.age !== undefined) body.age = profile.age;
  if (profile.hasTin !== undefined) body.has_tin = profile.hasTin;
  if (profile.cibStatus !== undefined) body.cib_status = profile.cibStatus;

  const response = await resilientFetch(`${BASE_URL}/credit-cards/eligibility/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await responseApiError(response);

  const data = (await response.json()) as EligibilityApiResponse;
  return {
    counts: data.counts,
    totalCards: data.total_cards,
    results: data.results.map(item => ({
      card: apiService.transformCreditCard(item.card),
      verdict: item.verdict,
      reasons: item.reasons,
    })),
    notes: data.notes,
    method: data.method,
    disclaimer: data.disclaimer,
  };
};
