/**
 * Server-side "Your numbers" defaults (redesign Phase 3, D4).
 *
 * Mirrors the backend serializer for GET/PATCH /api/v1/auth/me/defaults/
 * exactly: three nullable decimal strings. Null means the user has never
 * set the value — clients fall back to the shipped defaults. Eligibility
 * inputs are not part of this payload and are never stored server-side.
 */

import { authClient } from './auth';

export interface ServerProfileDefaults {
  typical_balance: string | null;
  monthly_card_spend: string | null;
  planned_loan_amount: string | null;
}

export const getServerProfileDefaults = (): Promise<ServerProfileDefaults> =>
  authClient.requestApi<ServerProfileDefaults>('auth/me/defaults/', {
    authenticated: true,
  });

export const updateServerProfileDefaults = (
  patch: Partial<ServerProfileDefaults>
): Promise<ServerProfileDefaults> =>
  authClient.requestApi<ServerProfileDefaults>('auth/me/defaults/', {
    method: 'PATCH',
    body: patch,
    authenticated: true,
  });
