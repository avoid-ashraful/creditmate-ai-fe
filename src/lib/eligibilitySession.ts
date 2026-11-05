/**
 * Session-only eligibility results (plan Sections 4.3 and 4.9).
 *
 * The eligibility endpoint is stateless and stores nothing server-side;
 * this module mirrors that promise on the client: inputs and verdicts
 * live in `sessionStorage` only, so they vanish when the tab session
 * ends and are never written to the stored profile or localStorage.
 * Card detail pages read the verdict for their card from here to show
 * the "your check this session" signal — never an inferred one.
 */

import type {
  EligibilityProfile,
  EligibilityResponse,
  EligibilityVerdict,
} from '../services/eligibility';

export const ELIGIBILITY_SESSION_KEY = 'creditmate.eligibility.session.v1';

export interface EligibilityCardVerdict {
  verdict: EligibilityVerdict;
  reasons: string[];
}

export interface EligibilitySession {
  profile: EligibilityProfile;
  /** Verdict per card id from the most recent check this session. */
  verdicts: Record<number, EligibilityCardVerdict>;
  checkedAt: string;
}

export const saveEligibilitySession = (
  profile: EligibilityProfile,
  response: EligibilityResponse
): void => {
  try {
    const verdicts: Record<number, EligibilityCardVerdict> = {};
    response.results.forEach(item => {
      verdicts[item.card.id] = { verdict: item.verdict, reasons: item.reasons };
    });
    const session: EligibilitySession = {
      profile,
      verdicts,
      checkedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(ELIGIBILITY_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Session storage can be unavailable; the signal simply won't persist.
  }
};

export const readEligibilitySession = (): EligibilitySession | null => {
  try {
    const raw = window.sessionStorage.getItem(ELIGIBILITY_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EligibilitySession;
    if (!parsed || typeof parsed !== 'object' || !parsed.profile || !parsed.verdicts) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearEligibilitySession = (): void => {
  try {
    window.sessionStorage.removeItem(ELIGIBILITY_SESSION_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
};

/** The verdict for one card from this session's check, if any. */
export const sessionVerdictForCard = (cardId: number): EligibilityCardVerdict | null => {
  const session = readEligibilitySession();
  if (!session) return null;
  return session.verdicts[cardId] ?? null;
};
