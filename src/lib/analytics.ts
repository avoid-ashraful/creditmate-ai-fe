export const ANALYTICS_EVENTS = {
  pageView: 'page_view',
  search: 'search',
  filterApply: 'filter_apply',
  cardSelect: 'card_select',
  compareStart: 'compare_start',
  compareShare: 'compare_share',
  cardDetailView: 'card_detail_view',
  quizStart: 'quiz_start',
  quizComplete: 'quiz_complete',
  calculatorUse: 'calculator_use',
  appError: 'app_error',
  signup: 'signup',
  login: 'login',
  // Experiment events (allowlisted for exposure/conversion tracking)
  experimentExposure: 'experiment_exposure',
  experimentConversion: 'experiment_conversion',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface AnalyticsProperties {
  cardId?: number;
  cardIds?: number[];
  filterCount?: number;
  filterKeys?: string[];
  referrer?: string;
  bank?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  // Experiment properties
  experimentKey?: string;
  variant?: 'control' | 'treatment';
  errorName?: string;
}

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  properties: AnalyticsProperties;
}

export interface AnalyticsUserProperties {
  tier?: string;
  savedComparisons?: number;
  emailOptIn?: boolean;
}

export type AnalyticsProvider = (event: AnalyticsEvent) => void;
export type AnalyticsUserProvider = (properties: AnalyticsUserProperties) => void;
export type AnalyticsUserDeletionProvider = () => void;

const STORAGE_KEY = 'creditmate.analytics.optOut';
const MAX_STRING_LENGTH = 64;
const MAX_ARRAY_LENGTH = 16;
const SAFE_STRING_PATTERN = /^[A-Za-z0-9-_][A-Za-z0-9_.-]*$/;
const SAFE_ORIGIN_PATTERN = /^https?:\/\/[A-Za-z0-9.-]+(?::\d+)?$/;

const hasLocalStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readOptOut = (): boolean =>
  hasLocalStorage() ? window.localStorage.getItem(STORAGE_KEY) === 'true' : false;

const hasAnalyticsKey = (): boolean => Boolean(process.env.REACT_APP_ANALYTICS_KEY);

const getLocationSearch = (): string => {
  if (typeof window === 'undefined' || !window.location) return '';
  return window.location.search;
};

export const getAnalyticsContextProperties = (): AnalyticsProperties => {
  if (typeof document === 'undefined') return {};
  const searchParams = new URLSearchParams(getLocationSearch());
  return {
    referrer: document.referrer || undefined,
    utmSource: searchParams.get('utm_source') || undefined,
    utmMedium: searchParams.get('utm_medium') || undefined,
    utmCampaign: searchParams.get('utm_campaign') || undefined,
    utmTerm: searchParams.get('utm_term') || undefined,
    utmContent: searchParams.get('utm_content') || undefined,
  };
};

const safeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_STRING_LENGTH) return undefined;
  return SAFE_STRING_PATTERN.test(trimmed) ? trimmed : undefined;
};

const safeOrigin = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!SAFE_ORIGIN_PATTERN.test(trimmed)) return undefined;
  return new URL(trimmed).origin;
};

type NumberProperty = 'cardId' | 'filterCount';
type StringProperty = 'bank' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmTerm' | 'utmContent';

const numberKeys: NumberProperty[] = ['cardId', 'filterCount'];
const stringKeys: StringProperty[] = [
  'bank',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
];

const normalizeProperties = (properties: AnalyticsProperties): AnalyticsProperties => {
  const normalized: AnalyticsProperties = {};

  numberKeys.forEach(key => {
    const value = properties[key];
    if (typeof value === 'number' && Number.isFinite(value)) normalized[key] = value;
  });

  const cardIds = properties.cardIds;
  if (Array.isArray(cardIds)) {
    normalized.cardIds = cardIds
      .filter(item => typeof item === 'number' && Number.isFinite(item))
      .slice(0, MAX_ARRAY_LENGTH);
  }

  const filterKeys = properties.filterKeys;
  if (Array.isArray(filterKeys)) {
    normalized.filterKeys = filterKeys
      .map(safeString)
      .filter((item): item is string => Boolean(item))
      .slice(0, MAX_ARRAY_LENGTH);
  }

  stringKeys.forEach(key => {
    const value = safeString(properties[key]);
    if (value) normalized[key] = value;
  });

  const referrer = safeOrigin(properties.referrer);
  if (referrer) normalized.referrer = referrer;

  // Experiment properties: allow experimentKey and variant through
  if (typeof properties.experimentKey === 'string') {
    const safeExpKey = safeString(properties.experimentKey);
    if (safeExpKey) normalized.experimentKey = safeExpKey;
  }
  if (properties.variant === 'control' || properties.variant === 'treatment') {
    normalized.variant = properties.variant;
  }
  const errorName = safeString(properties.errorName);
  if (errorName) normalized.errorName = errorName;

  return normalized;
};

const normalizeUserProperties = (properties: AnalyticsUserProperties): AnalyticsUserProperties => {
  const normalized: AnalyticsUserProperties = {};

  if (typeof properties.tier === 'string') {
    const tier = safeString(properties.tier);
    if (tier) normalized.tier = tier;
  }
  if (
    typeof properties.savedComparisons === 'number' &&
    Number.isFinite(properties.savedComparisons)
  ) {
    normalized.savedComparisons = properties.savedComparisons;
  }
  if (typeof properties.emailOptIn === 'boolean') {
    normalized.emailOptIn = properties.emailOptIn;
  }

  return normalized;
};

class Analytics {
  private provider: AnalyticsProvider | null = null;
  private userProvider: AnalyticsUserProvider | null = null;
  private userDeletionProvider: AnalyticsUserDeletionProvider | null = null;
  private optedOut = readOptOut();

  setProvider(provider: AnalyticsProvider | null): void {
    this.provider = provider;
  }

  setUserProvider(provider: AnalyticsUserProvider | null): void {
    this.userProvider = provider;
  }

  setUserDeletionProvider(provider: AnalyticsUserDeletionProvider | null): void {
    this.userDeletionProvider = provider;
  }

  optIn(): void {
    this.optedOut = false;
    if (hasLocalStorage()) window.localStorage.removeItem(STORAGE_KEY);
  }

  optOut(): void {
    this.setOptedOut();
  }

  isOptedOut(): boolean {
    return this.optedOut;
  }

  clearUserData(): void {
    this.setOptedOut();
  }

  deleteUserData(): void {
    if (this.userDeletionProvider) {
      try {
        this.userDeletionProvider();
      } catch (error) {
        console.error('Analytics user deletion provider failed:', error);
      }
    }
    this.setOptedOut();
  }

  track(name: AnalyticsEventName, properties: AnalyticsProperties = {}): void {
    if (this.optedOut || !hasAnalyticsKey() || !this.provider) return;

    try {
      this.provider({
        name,
        properties: normalizeProperties(properties),
      });
    } catch (error) {
      console.error('Analytics provider failed:', error);
    }
  }

  identify(properties: AnalyticsUserProperties): void {
    if (this.optedOut || !hasAnalyticsKey() || !this.userProvider) return;

    try {
      this.userProvider(normalizeUserProperties(properties));
    } catch (error) {
      console.error('Analytics user provider failed:', error);
    }
  }

  private setOptedOut(): void {
    this.optedOut = true;
    if (hasLocalStorage()) window.localStorage.setItem(STORAGE_KEY, 'true');
  }
}

export const analytics = new Analytics();
