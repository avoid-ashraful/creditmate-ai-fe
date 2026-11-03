import { CreditCard } from '../types';
import { slugify } from '../utils/slugify';

import { apiService, BankApiResponse } from './api';

/**
 * Bank lookup helpers.
 *
 * The backend banks API has no slug lookup: bank detail is by numeric id
 * (`GET /banks/:id/`). Bank pages therefore resolve a URL slug by listing
 * banks and matching `slugify(bank.name)` — the same slug convention card
 * URLs already use for the bank segment (`/card/:bankSlug/:cardSlug`).
 */
export const bankSlug = (bank: Pick<BankApiResponse, 'name'>): string => slugify(bank.name);

export const bankPath = (bank: Pick<BankApiResponse, 'name'>): string => `/bank/${bankSlug(bank)}`;

export const findBankBySlug = (
  banks: BankApiResponse[],
  slug: string
): BankApiResponse | undefined => {
  const target = slugify(slug);
  return banks.find(bank => bankSlug(bank) === target);
};

/** Fetch every bank, following the list endpoint's pagination to the end. */
export const fetchAllBanks = async (): Promise<BankApiResponse[]> => {
  const banks: BankApiResponse[] = [];
  let page = 1;
  for (;;) {
    const response = await apiService.getBanks(undefined, undefined, page);
    banks.push(...response.results);
    if (!response.next) return banks;
    page += 1;
  }
};

export interface BankCardStats {
  /** Number of cards the stats were derived from. */
  totalCards: number;
  /** Min/max of the cards' published annual fees; null when no fee is known. */
  annualFeeMin: number | null;
  annualFeeMax: number | null;
  /** Min/max of the cards' published APRs; null when no APR is known. */
  aprMin: number | null;
  aprMax: number | null;
  /** Cards whose published annual fee is exactly zero. */
  freeCardCount: number;
  /** Cards with any published lounge access (international or domestic). */
  loungeCardCount: number;
}

const range = (values: number[]): { min: number | null; max: number | null } =>
  values.length === 0
    ? { min: null, max: null }
    : { min: Math.min(...values), max: Math.max(...values) };

/**
 * Derive honest summary stats from a bank's cards. Unknown fees/APRs (null)
 * are excluded from ranges rather than treated as zero.
 */
export const computeBankCardStats = (cards: CreditCard[]): BankCardStats => {
  const fees = cards
    .map(card => card.annualFee)
    .filter((fee): fee is number => fee !== null && Number.isFinite(fee));
  const aprs = cards
    .map(card => card.interestRateApr)
    .filter((apr): apr is number => apr !== null && Number.isFinite(apr));
  const feeRange = range(fees);
  const aprRange = range(aprs);
  return {
    totalCards: cards.length,
    annualFeeMin: feeRange.min,
    annualFeeMax: feeRange.max,
    aprMin: aprRange.min,
    aprMax: aprRange.max,
    freeCardCount: cards.filter(card => card.annualFee === 0).length,
    loungeCardCount: cards.filter(
      card =>
        (card.loungeAccessInternational ?? '') !== '' || (card.loungeAccessDomestic ?? '') !== ''
    ).length,
  };
};
