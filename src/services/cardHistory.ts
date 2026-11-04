/**
 * Typed client for the credit-card field-history endpoint.
 *
 * `GET /api/v1/credit-cards/{id}/field-history/` returns the recorded
 * changes to a card's tracked fields (fees, APR, lounge access, reward
 * terms, …), newest first, in the standard paginated envelope.
 * `getFieldHistory` follows the envelope's `next` links (capped at
 * MAX_HISTORY_PAGES) so callers always see the complete history.
 *
 * The backend requires authentication for this endpoint (anonymous
 * requests get a 403), so — like the alerts client — the access token
 * comes from AuthProvider and a 401 is retried once after a refresh.
 */

import { ENV } from '../config/env';

import { ApiResponse } from './api';
import { ApiError, responseApiError, resilientFetch } from './apiError';
import { authClient } from './auth';

export { ApiError } from './apiError';

/**
 * One field-history entry exactly as the backend serializer emits it.
 * `old_value` / `new_value` are JSON values; DRF serializes decimals as
 * strings, so money/APR values arrive as numeric strings.
 */
export interface FieldHistoryApiEntry {
  id: number;
  card_id: number;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  created: string; // ISO datetime
}

/** Frontend-friendly field-history entry with normalized fields. */
export interface FieldHistoryEntry {
  id: number;
  cardId: number;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  changedAt: Date;
}

export type FieldHistoryResponse = ApiResponse<FieldHistoryApiEntry>;

/** Safety cap on history pages fetched by a single getFieldHistory call. */
export const MAX_HISTORY_PAGES = 10;

/** Normalize a field-history entry from the API shape. */
export function transformFieldHistoryEntry(apiEntry: FieldHistoryApiEntry): FieldHistoryEntry {
  return {
    id: apiEntry.id,
    cardId: apiEntry.card_id,
    fieldName: apiEntry.field_name,
    oldValue: apiEntry.old_value ?? null,
    newValue: apiEntry.new_value ?? null,
    changedAt: new Date(apiEntry.created),
  };
}

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

export class CardHistoryClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Fetch a card's complete field history, newest first.
   *
   * The backend paginates at 20 entries per page, so the first page's
   * `next` is followed until exhausted — otherwise the timeline would
   * silently drop every change beyond the newest 20. Pagination stops
   * after MAX_HISTORY_PAGES pages as a guard against a pathological
   * backend that never stops emitting `next`.
   * Throws ApiError(401) when there is no active session, matching the
   * backend's authentication requirement for this endpoint.
   */
  async getFieldHistory(cardId: number): Promise<FieldHistoryResponse> {
    const firstPage = await this.fetchFieldHistoryPage(cardId, 1);
    const results = [...firstPage.results];
    let lastPage = firstPage;
    let pageNumber = 1;
    while (lastPage.next && pageNumber < MAX_HISTORY_PAGES) {
      pageNumber += 1;
      lastPage = await this.fetchFieldHistoryPage(cardId, pageNumber);
      results.push(...lastPage.results);
    }
    return { ...firstPage, next: lastPage.next, results };
  }

  /** Fetch one page of a card's field history, newest first. */
  private async fetchFieldHistoryPage(cardId: number, page: number): Promise<FieldHistoryResponse> {
    if (!authClient.hasSession()) {
      throw new ApiError(401, 'No active session');
    }
    const token = await authClient.getAccessToken();
    if (!token) throw new ApiError(401, 'No active session');

    const params = new URLSearchParams();
    params.append('page', page.toString());
    const url = `${this.baseUrl}/credit-cards/${cardId}/field-history/?${params.toString()}`;

    let response = await resilientFetch(url, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 && authClient.hasSession()) {
      // Another request may have refreshed already; try once more.
      const retryToken = await authClient.refreshAccessToken();
      response = await resilientFetch(url, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${retryToken}` },
      });
    }

    if (!response.ok) throw await responseApiError(response);
    return (await response.json()) as FieldHistoryResponse;
  }
}

export const cardHistoryClient = new CardHistoryClient();
