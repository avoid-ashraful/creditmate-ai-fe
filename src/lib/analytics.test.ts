import {
  ANALYTICS_EVENTS,
  AnalyticsProperties,
  analytics,
  getAnalyticsContextProperties,
} from './analytics';

const originalAnalyticsKey = process.env.REACT_APP_ANALYTICS_KEY;
const originalLocation = window.location;

describe('analytics', () => {
  const provider = jest.fn();
  const userProvider = jest.fn();
  const deletionProvider = jest.fn();

  beforeEach(() => {
    process.env.REACT_APP_ANALYTICS_KEY = 'test-key';
    provider.mockClear();
    userProvider.mockClear();
    deletionProvider.mockClear();
    analytics.setProvider(provider);
    analytics.setUserProvider(userProvider);
    analytics.setUserDeletionProvider(deletionProvider);
    analytics.optIn();
  });

  afterEach(() => {
    analytics.setUserDeletionProvider(null);
    analytics.setUserProvider(null);
    analytics.setProvider(null);
    analytics.optOut();
    process.env.REACT_APP_ANALYTICS_KEY = originalAnalyticsKey;
  });

  it('tracks a page view with sanitized context properties', () => {
    window.history.replaceState(
      null,
      '',
      '/?utm_source=google&utm_medium=cpc&utm_campaign=travel-cards'
    );
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://example.com/private/path?token=secret',
    });

    analytics.track(ANALYTICS_EVENTS.pageView, {
      ...getAnalyticsContextProperties(),
      referrer: new URL(document.referrer).origin,
    });

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.pageView,
      properties: {
        referrer: 'https://example.com',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'travel-cards',
      },
    });
  });

  it('drops unsafe referrer and UTM values', () => {
    const unsafeReferrer = `java${'script:alert(1)'}`;
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: unsafeReferrer,
    });
    window.history.replaceState(
      null,
      '',
      '/?utm_source=good&utm_medium=bad%20value&utm_campaign=' + 'x'.repeat(65)
    );

    analytics.track(ANALYTICS_EVENTS.pageView, {
      ...getAnalyticsContextProperties(),
      referrer: document.referrer,
    });

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.pageView,
      properties: { utmSource: 'good' },
    });
  });

  it('sends only normalized allowlisted event properties', () => {
    const payload: unknown = {
      bank: 'Eastern_Bank_Limited',
      cardId: Number.NaN,
      cardIds: [2, Number.NaN, ...new Array(20).fill(3)],
      filterKeys: ['bankId', '', 'bad key', 'valid_key'],
      searchLength: 8,
      primaryUse: 'travel',
      email: 'person@example.com',
    };
    analytics.track(ANALYTICS_EVENTS.search, payload as AnalyticsProperties);

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.search,
      properties: {
        bank: 'Eastern_Bank_Limited',
        cardIds: [2, ...new Array(15).fill(3)],
        filterKeys: ['bankId', 'valid_key'],
      },
    });
  });

  it('drops forbidden quiz answer properties (monthlySpend, primaryUse, etc.)', () => {
    const payload: unknown = {
      monthlySpend: 50000,
      primaryUse: 'travel',
      travelFrequency: 'frequent',
      feeTolerance: 'moderate',
      cardTier: 'premium',
      fromStep: 'spend',
      toStep: 'results',
    };
    analytics.track(ANALYTICS_EVENTS.quizStart, payload as AnalyticsProperties);

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.quizStart,
      properties: {},
    });
  });

  it('drops all non-allowlisted calculator properties', () => {
    const payload: unknown = {
      resultCount: 5,
      monthlySpend: 100000,
    };
    analytics.track(ANALYTICS_EVENTS.calculatorUse, payload as AnalyticsProperties);

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.calculatorUse,
      properties: {},
    });
  });

  it('drops non-allowlisted event properties (resultCount, selectedCount, shareId, tier, etc.)', () => {
    const payload: unknown = {
      cardId: 42,
      resultCount: 5,
      selectedCount: 3,
      shareId: 'abc123',
      tier: 'premium',
      emailOptIn: true,
      savedComparisons: 10,
    };
    analytics.track(ANALYTICS_EVENTS.cardSelect, payload as AnalyticsProperties);

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.cardSelect,
      properties: { cardId: 42 },
    });
  });

  it('sends only the allowlisted user properties', () => {
    analytics.identify({
      tier: 'premium',
      savedComparisons: 4,
      emailOptIn: true,
      // @ts-expect-error prove that user emails are rejected
      email: 'person@example.com',
    });

    expect(userProvider).toHaveBeenCalledWith({
      tier: 'premium',
      savedComparisons: 4,
      emailOptIn: true,
    });
  });

  it('is opt-in: a fresh session has no consent and sends nothing', async () => {
    window.localStorage.clear();
    jest.resetModules();
    const fresh = await import('./analytics');
    fresh.analytics.setProvider(provider);

    fresh.analytics.track(fresh.ANALYTICS_EVENTS.pageView);

    expect(fresh.analytics.isOptedOut()).toBe(true);
    expect(provider).not.toHaveBeenCalled();

    fresh.analytics.optIn();
    expect(window.localStorage.getItem('creditmate.analytics.consent')).toBe('granted');
    fresh.analytics.track(fresh.ANALYTICS_EVENTS.pageView);
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it('does not send events when opted out and persists the opt-out', () => {
    analytics.optOut();

    analytics.track(ANALYTICS_EVENTS.filterApply, { filterCount: 2 });

    expect(provider).not.toHaveBeenCalled();
    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.consent')).toBeNull();
  });

  it('does not send events without an analytics key', () => {
    process.env.REACT_APP_ANALYTICS_KEY = '';

    analytics.track(ANALYTICS_EVENTS.filterApply, { filterCount: 2 });

    expect(provider).not.toHaveBeenCalled();
  });

  it('keeps behavior safe when providers throw', () => {
    provider.mockImplementation(() => {
      throw new Error('provider unavailable');
    });
    userProvider.mockImplementation(() => {
      throw new Error('user provider unavailable');
    });
    deletionProvider.mockImplementation(() => {
      throw new Error('deletion provider unavailable');
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    analytics.track(ANALYTICS_EVENTS.quizStart);
    analytics.identify({ tier: 'premium' });
    analytics.deleteUserData();

    expect(provider).toHaveBeenCalledTimes(1);
    expect(userProvider).toHaveBeenCalledTimes(1);
    expect(deletionProvider).toHaveBeenCalledTimes(1);
    expect(analytics.isOptedOut()).toBe(true);
    expect(consoleError).toHaveBeenCalledTimes(3);
    consoleError.mockRestore();
  });

  it('clears local emission and opts out without requesting provider deletion', () => {
    analytics.clearUserData();

    expect(deletionProvider).not.toHaveBeenCalled();
    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.consent')).toBeNull();
  });

  it('requests provider deletion before persisting opt-out', () => {
    analytics.deleteUserData();

    expect(deletionProvider).toHaveBeenCalledTimes(1);
    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.consent')).toBeNull();
  });

  it('persists opt-out when no provider deletion callback is registered', () => {
    analytics.setUserDeletionProvider(null);

    analytics.deleteUserData();

    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.consent')).toBeNull();
  });
});

afterAll(() => {
  window.history.replaceState(null, '', originalLocation.pathname + originalLocation.search);
});
