import { ANALYTICS_EVENTS, analytics, getAnalyticsContextProperties } from './analytics';

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
    analytics.optIn();
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
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'javascript:alert(1)',
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
    analytics.track(ANALYTICS_EVENTS.search, {
      bank: 'Eastern_Bank_Limited',
      cardId: Number.NaN,
      cardIds: [2, Number.NaN, ...new Array(20).fill(3)],
      filterKeys: ['bankId', '', 'bad key', 'valid_key'],
      searchLength: 8,
      primaryUse: 'travel',
      // @ts-expect-error prove that unknown fields are discarded
      email: 'person@example.com',
    });

    expect(provider).toHaveBeenCalledWith({
      name: ANALYTICS_EVENTS.search,
      properties: {
        bank: 'Eastern_Bank_Limited',
        cardIds: [2, ...new Array(15).fill(3)],
        filterKeys: ['bankId', 'valid_key'],
        searchLength: 8,
        primaryUse: 'travel',
      },
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

  it('does not send events when opted out and persists the opt-out', () => {
    analytics.optOut();

    analytics.track(ANALYTICS_EVENTS.filterApply, { filterCount: 2 });

    expect(provider).not.toHaveBeenCalled();
    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.optOut')).toBe('true');
  });

  it('does not send events without an analytics key', () => {
    process.env.REACT_APP_ANALYTICS_KEY = '';

    analytics.track(ANALYTICS_EVENTS.compareShare, { shareId: 'test' });

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
    expect(window.localStorage.getItem('creditmate.analytics.optOut')).toBe('true');
  });

  it('requests provider deletion before persisting opt-out', () => {
    analytics.deleteUserData();

    expect(deletionProvider).toHaveBeenCalledTimes(1);
    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.optOut')).toBe('true');
  });

  it('persists opt-out when no provider deletion callback is registered', () => {
    analytics.setUserDeletionProvider(null);

    analytics.deleteUserData();

    expect(analytics.isOptedOut()).toBe(true);
    expect(window.localStorage.getItem('creditmate.analytics.optOut')).toBe('true');
  });
});

afterAll(() => {
  window.history.replaceState(null, '', originalLocation.pathname + originalLocation.search);
});
