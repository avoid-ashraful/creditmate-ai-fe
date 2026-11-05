/**
 * Alert types for the email notifications feature.
 */

/** Alert subscription kinds as defined by the backend contract. */
export type AlertKind = 'fee_change' | 'apr_change' | 'new_card' | 'any_change';

/** Frequency options for alert delivery. */
export type AlertFrequency = 'immediate' | 'daily' | 'weekly';

/** Request payload for creating a new alert subscription. */
export interface CreateAlertSubscriptionRequest {
  card?: number;
  kind: AlertKind;
}

/** Alert subscription as returned by the API. */
export interface AlertSubscription {
  id: number;
  card?: number;
  card_name?: string;
  bank_name?: string;
  kind: AlertKind;
  created: string;
}

/** List response for alert subscriptions. */
export interface AlertSubscriptionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AlertSubscription[];
}

/** A bank follow as returned by the API (redesign D4: server-backed). */
export interface BankFollow {
  id: number;
  bank: number;
  bank_name: string;
  created: string;
}

/** List response for bank follows. */
export interface BankFollowsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BankFollow[];
}

/** One field-change event in the bank-follow feed (mirrors alerts/feed.py). */
export interface BankFollowFeedEntry {
  id: string;
  vertical: 'cards' | 'deposits' | 'loans' | 'accounts';
  product_name: string;
  product_key: string;
  bank_id: number | null;
  bank_name: string;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  /** Only loans history records a source; null elsewhere — never invented. */
  source: string | null;
  changed_at: string;
  /** Phase 4 (D4): newer than the requesting user's seen watermark. */
  is_new: boolean;
}

/** Feed page: offset pagination with an exact has_more flag (no total). */
export interface BankFollowFeedResponse {
  results: BankFollowFeedEntry[];
  page: number;
  page_size: number;
  has_more: boolean;
  /**
   * The user's seen watermark at read time (Phase 4, D4), or null when
   * no baseline exists yet. Reading never advances it — the client
   * calls markBankFollowFeedSeen once the entries have been displayed.
   */
  seen_at: string | null;
}

/** Alert preferences as returned by the API. */
export interface AlertPreferences {
  frequency: AlertFrequency;
  email_enabled: boolean;
}

/** Request payload for updating alert preferences. */
export interface UpdateAlertPreferencesRequest {
  frequency?: AlertFrequency;
  email_enabled?: boolean;
}

/** GET /alerts/unsubscribe/{token}/ — read-only; POST performs the unsubscribe. */
export interface UnsubscribePreview {
  confirm_required: boolean;
  is_active: boolean;
  kind: AlertKind;
  card_name: string | null;
}

/** Response from the unsubscribe endpoint. */
export interface UnsubscribeResponse {
  detail: string;
}

/** Human-readable labels for alert kinds. */
export const ALERT_KIND_LABELS: Record<AlertKind, { en: string; bn: string }> = {
  fee_change: { en: 'Fee changes', bn: 'ফি পরিবর্তন' },
  apr_change: { en: 'APR changes', bn: 'এপিআর পরিবর্তন' },
  new_card: { en: 'New cards', bn: 'নতুন কার্ড' },
  any_change: { en: 'Any change', bn: 'কোনো পরিবর্তন' },
};

/** Human-readable labels for frequency options. */
export const ALERT_FREQUENCY_LABELS: Record<AlertFrequency, { en: string; bn: string }> = {
  immediate: { en: 'Immediate', bn: 'তাৎক্ষণিক' },
  daily: { en: 'Daily digest', bn: 'দৈনিক সারসংক্ষেপ' },
  weekly: { en: 'Weekly digest', bn: 'সাপ্তাহিক সারসংক্ষেপ' },
};

/** Get the label for an alert kind in the current language. */
export function getAlertKindLabel(kind: AlertKind, lang: 'en' | 'bn'): string {
  return ALERT_KIND_LABELS[kind][lang];
}

/** Get the label for a frequency in the current language. */
export function getAlertFrequencyLabel(frequency: AlertFrequency, lang: 'en' | 'bn'): string {
  return ALERT_FREQUENCY_LABELS[frequency][lang];
}
