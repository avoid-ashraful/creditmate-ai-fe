/**
 * Typed client for the `/api/v1/alerts/` endpoints.
 *
 * Mirrors the AuthClient pattern: access token via AuthProvider,
 * silent refresh on 401 handled by the auth layer.
 */

import { ENV } from '../config/env';
import {
  AlertSubscription,
  AlertSubscriptionsResponse,
  AlertPreferences,
  UpdateAlertPreferencesRequest,
  CreateAlertSubscriptionRequest,
  UnsubscribeResponse,
} from '../types/alerts';

import { ApiError, responseApiError, resilientFetch } from './apiError';
import { authClient } from './auth';
export { ApiError } from './apiError';

const HTTP_METHOD = { get: 'GET', post: 'POST', patch: 'PATCH', delete: 'DELETE' } as const;
type HttpMethod = (typeof HTTP_METHOD)[keyof typeof HTTP_METHOD];

const BASE_URL = ENV.API_BASE_URL.replace(/\/$/, '');

/**
 * An error response from the backend. Mirrors ApiError from auth.ts.
 */
/** @deprecated Use the shared ApiError. Kept as a source-compatible alias. */
export { ApiError as AlertsApiError };

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Attach the access token via AuthProvider. */
  authenticated?: boolean;
}

/**
 * AlertsClient provides typed methods for all alert-related API calls.
 */
export class AlertsClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Get the current access token from AuthClient, refreshing if needed.
   */
  private async getAccessToken(): Promise<string | null> {
    return authClient.hasSession() ? authClient.getAccessToken() : null;
  }

  /**
   * Send an authenticated request, retrying once after a silent refresh on 401.
   */
  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!options.authenticated) {
      return this.parse<T>(await this.send(path, options, null));
    }

    const token = await this.getAccessToken();
    if (!token) throw new ApiError(401, 'No active session');

    let response = await this.send(path, options, token);

    if (response.status === 401 && authClient.hasSession()) {
      // Another request may have refreshed already; try once more.
      const retryToken = await authClient.refreshAccessToken();
      response = await this.send(path, options, retryToken);
    }
    return this.parse<T>(response);
  }

  private send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    return resilientFetch(`${this.baseUrl}/alerts${path}`, {
      method: options.method ?? HTTP_METHOD.get,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) throw await responseApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  // ==================== Subscriptions ====================

  /** List all alert subscriptions for the current user. */
  async listSubscriptions(): Promise<AlertSubscriptionsResponse> {
    return this.request<AlertSubscriptionsResponse>('/subscriptions/', { authenticated: true });
  }

  /** Create a new alert subscription. */
  async createSubscription(input: CreateAlertSubscriptionRequest): Promise<AlertSubscription> {
    return this.request<AlertSubscription>('/subscriptions/', {
      method: HTTP_METHOD.post,
      body: input,
      authenticated: true,
    });
  }

  /** Delete an alert subscription by ID. */
  async deleteSubscription(id: number): Promise<void> {
    await this.request<void>(`/subscriptions/${id}/`, {
      method: HTTP_METHOD.delete,
      authenticated: true,
    });
  }

  // ==================== Preferences ====================

  /** Get the current user's alert preferences. */
  async getPreferences(): Promise<AlertPreferences> {
    return this.request<AlertPreferences>('/preferences/', { authenticated: true });
  }

  /** Update alert preferences (frequency, email_enabled). */
  async updatePreferences(input: UpdateAlertPreferencesRequest): Promise<AlertPreferences> {
    return this.request<AlertPreferences>('/preferences/', {
      method: HTTP_METHOD.patch,
      body: input,
      authenticated: true,
    });
  }

  // ==================== Public Unsubscribe ====================

  /**
   * Unsubscribe via token (public endpoint, no auth).
   * Used by the /unsubscribe?token= page.
   */
  async unsubscribe(token: string): Promise<UnsubscribeResponse> {
    return this.request<UnsubscribeResponse>(`/unsubscribe/${encodeURIComponent(token)}/`, {
      method: HTTP_METHOD.post,
      authenticated: false,
    });
  }
}

/** Shared client for the app. */
export const alertsClient = new AlertsClient();
