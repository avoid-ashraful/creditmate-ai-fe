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
