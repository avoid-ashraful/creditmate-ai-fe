/**
 * CreditMate AI - A/B Testing Framework Tests
 */

import { analytics } from './analytics';
import {
  EXPERIMENTS,
  getAnonymousId,
  hashString,
  getBucket,
  assignVariantSync,
  getVariant,
  isTreatment,
  resetExperimentData,
  calculateSignificance,
  evaluateAutoStop,
  normalCDF,
  trackConversion,
  setRemoteOverrideProvider,
  getRemoteOverrideProvider,
  isResultsViewEnabled,
  getExperimentViewData,
  getAllExperimentViewData,
} from './experiments';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getStore: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Registry defaults, captured before the tests below switch experiments on.
const SHIPPED_ENABLED = Object.values(EXPERIMENTS).map(exp => exp.enabled);
const setAllEnabled = (enabled: boolean) =>
  Object.values(EXPERIMENTS).forEach(exp => {
    (exp as { enabled: boolean }).enabled = enabled;
  });

// Mock analytics
const mockAnalyticsProvider = jest.fn();
const mockUserProvider = jest.fn();
const mockDeletionProvider = jest.fn();

beforeEach(() => {
  mockLocalStorage.clear();
  mockAnalyticsProvider.mockClear();
  mockUserProvider.mockClear();
  mockDeletionProvider.mockClear();
  analytics.setProvider(mockAnalyticsProvider);
  analytics.setUserProvider(mockUserProvider);
  analytics.setUserDeletionProvider(mockDeletionProvider);
  analytics.optIn();
  process.env.REACT_APP_ANALYTICS_KEY = 'test-key';
  process.env.REACT_APP_EXPERIMENTS_RESULTS_VIEW = 'false';
  setRemoteOverrideProvider(null);
  // Experiments ship disabled; the framework tests exercise them enabled.
  setAllEnabled(true);
});

afterAll(() => {
  setAllEnabled(false);
  analytics.setProvider(null);
  analytics.setUserProvider(null);
  analytics.setUserDeletionProvider(null);
});

describe('Anonymous ID', () => {
  it('generates and persists a stable anonymous ID', () => {
    const id1 = getAnonymousId();
    const id2 = getAnonymousId();
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('returns server-side when localStorage unavailable', () => {
    const originalLocalStorage = window.localStorage;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete window.localStorage;
    const id = getAnonymousId();
    expect(id).toBe('server-side');
    window.localStorage = originalLocalStorage;
  });
});

describe('Hash-based bucketing', () => {
  it('produces deterministic buckets for same input', () => {
    const bucket1 = getBucket('hero_cta_text', 'test-user-123');
    const bucket2 = getBucket('hero_cta_text', 'test-user-123');
    expect(bucket1).toBe(bucket2);
  });

  it('produces different buckets for different users', () => {
    const buckets = new Set();
    for (let i = 0; i < 100; i++) {
      buckets.add(getBucket('hero_cta_text', `user-${i}`));
    }
    // Should have good distribution
    expect(buckets.size).toBeGreaterThan(50);
  });

  it('produces different buckets for different experiments', () => {
    const bucket1 = getBucket('hero_cta_text', 'same-user');
    const bucket2 = getBucket('quiz_vs_browse_default', 'same-user');
    // Could be same by chance, but unlikely for all 3
    const bucket3 = getBucket('card_layout', 'same-user');
    const unique = new Set([bucket1, bucket2, bucket3]);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('hashString is deterministic', () => {
    expect(hashString('test')).toBe(hashString('test'));
    expect(hashString('test')).not.toBe(hashString('different'));
  });
});

describe('Experiment assignment (sync)', () => {
  it('returns control when analytics opted out', () => {
    analytics.optOut();
    const assignment = assignVariantSync('hero_cta_text');
    expect(assignment.variant).toBe('control');
    expect(assignment.isNewExposure).toBe(false);
  });

  it('returns control when experiment disabled', () => {
    // Temporarily disable
    const originalEnabled = EXPERIMENTS.hero_cta_text.enabled;
    (EXPERIMENTS.hero_cta_text as unknown as { enabled: boolean }).enabled = false;
    const assignment = assignVariantSync('hero_cta_text');
    expect(assignment.variant).toBe('control');
    (EXPERIMENTS.hero_cta_text as unknown as { enabled: boolean }).enabled = originalEnabled;
  });

  it('assigns treatment/control deterministically per user', () => {
    const assignments: Array<{ id: string; variant: string }> = [];
    for (let i = 0; i < 100; i++) {
      mockLocalStorage.clear();
      mockLocalStorage.setItem('creditmate.experiments.anonymousId', `user-${i}`);
      const assignment = assignVariantSync('hero_cta_text');
      assignments.push({ id: `user-${i}`, variant: assignment.variant });
    }

    // Same user should get same variant
    mockLocalStorage.clear();
    mockLocalStorage.setItem('creditmate.experiments.anonymousId', 'user-0');
    const a1 = assignVariantSync('hero_cta_text');
    const a2 = assignVariantSync('hero_cta_text');
    expect(a1.variant).toBe(a2.variant);
  });

  it('distributes roughly according to treatment allocation', () => {
    const counts = { control: 0, treatment: 0 };
    for (let i = 0; i < 1000; i++) {
      mockLocalStorage.clear();
      mockLocalStorage.setItem('creditmate.experiments.anonymousId', `dist-user-${i}`);
      const assignment = assignVariantSync('hero_cta_text');
      counts[assignment.variant]++;
    }
    // 50% allocation, expect ~40-60% treatment
    expect(counts.treatment).toBeGreaterThan(400);
    expect(counts.treatment).toBeLessThan(600);
  });

  it('tracks new exposure on first assignment', () => {
    mockLocalStorage.clear();
    const assignment = assignVariantSync('hero_cta_text');
    expect(assignment.isNewExposure).toBe(true);
  });

  it('does not track new exposure on subsequent calls', () => {
    mockLocalStorage.clear();
    assignVariantSync('hero_cta_text');
    const assignment = assignVariantSync('hero_cta_text');
    expect(assignment.isNewExposure).toBe(false);
  });

  it('persists exposure across calls', () => {
    mockLocalStorage.clear();
    const a1 = assignVariantSync('hero_cta_text');
    const a2 = assignVariantSync('hero_cta_text');
    expect(a1.variant).toBe(a2.variant);
    expect(a1.isNewExposure).toBe(true);
    expect(a2.isNewExposure).toBe(false);
  });
});

describe('getVariant and isTreatment helpers', () => {
  it('getVariant returns variant only', () => {
    mockLocalStorage.clear();
    const variant = getVariant('hero_cta_text');
    expect(['control', 'treatment']).toContain(variant);
  });

  it('isTreatment returns boolean', () => {
    mockLocalStorage.clear();
    const result = isTreatment('hero_cta_text');
    expect(typeof result).toBe('boolean');
  });
});

describe('Experiment registry', () => {
  it('has three experiments configured', () => {
    expect(Object.keys(EXPERIMENTS)).toHaveLength(3);
    expect(EXPERIMENTS.hero_cta_text).toBeDefined();
    expect(EXPERIMENTS.quiz_vs_browse_default).toBeDefined();
    expect(EXPERIMENTS.card_layout).toBeDefined();
  });

  it('ships every experiment disabled so all users get control', () => {
    expect(SHIPPED_ENABLED).toEqual([false, false, false]);
  });

  it('each experiment has required config', () => {
    Object.values(EXPERIMENTS).forEach(exp => {
      expect(exp.key).toBeTruthy();
      expect(exp.name).toBeTruthy();
      expect(exp.treatmentAllocation).toBeGreaterThanOrEqual(0);
      expect(exp.treatmentAllocation).toBeLessThanOrEqual(100);
      expect(exp.minSampleSize).toBeGreaterThan(0);
      expect(exp.confidenceLevel).toBeGreaterThan(0);
      expect(exp.confidenceLevel).toBeLessThan(1);
    });
  });
});

describe('Remote override provider', () => {
  it('can set and get provider', () => {
    const provider = {
      getVariant: jest.fn().mockResolvedValue('treatment' as const),
    };
    setRemoteOverrideProvider(provider);
    expect(getRemoteOverrideProvider()).toBe(provider);
  });

  it('returns null when no provider set', () => {
    setRemoteOverrideProvider(null);
    expect(getRemoteOverrideProvider()).toBeNull();
  });
});

describe('Statistical significance - two-proportion z-test', () => {
  it('calculates correct p-value for known scenario: equal proportions', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 100 },
      treatment: { exposures: 1000, conversions: 100 },
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.pValue).toBeCloseTo(1.0, 1); // p ≈ 1 for equal proportions
    expect(sig.zScore).toBeCloseTo(0, 1);
    expect(sig.significant).toBe(false);
    expect(sig.lift).toBeCloseTo(0, 2);
  });

  it('detects significance for clear difference', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 100 }, // 10%
      treatment: { exposures: 1000, conversions: 150 }, // 15%
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.pValue).toBeLessThan(0.05);
    expect(sig.significant).toBe(true);
    expect(sig.lift).toBeCloseTo(0.5, 1); // 50% lift
  });

  it('detects harm (guardrail)', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 150 }, // 15%
      treatment: { exposures: 1000, conversions: 100 }, // 10%
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.harmful).toBe(true);
    expect(sig.zScore).toBeLessThan(0);
  });

  it('requires minimum sample size', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 50, conversions: 10 },
      treatment: { exposures: 50, conversions: 20 },
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.minSampleMet).toBe(false);
    expect(sig.significant).toBe(false); // Not significant even if p < 0.05
  });

  it('handles zero exposures gracefully', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 0, conversions: 0 },
      treatment: { exposures: 0, conversions: 0 },
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.pValue).toBeCloseTo(1, 5);
    expect(sig.zScore).toBe(0);
    expect(sig.significant).toBe(false);
  });

  it('handles zero control exposures', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 0, conversions: 0 },
      treatment: { exposures: 100, conversions: 10 },
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.zScore).toBe(0);
  });

  it('matches known z-test values from stats textbook', () => {
    // Example: control 100/1000 (10%), treatment 120/1000 (12%)
    // Pooled = 220/2000 = 0.11
    // SE = sqrt(0.11 * 0.89 * (1/1000 + 1/1000)) = sqrt(0.0979 * 0.002) = sqrt(0.0001958) = 0.01399
    // z = (0.12 - 0.10) / 0.01399 = 1.43
    // p = 2 * (1 - Φ(1.43)) ≈ 2 * 0.0764 = 0.1528
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 100 },
      treatment: { exposures: 1000, conversions: 120 },
    };
    const sig = calculateSignificance(result, 0.95, 100);
    expect(sig.zScore).toBeCloseTo(1.43, 1);
    expect(sig.pValue).toBeCloseTo(0.153, 2);
    expect(sig.significant).toBe(false);
  });
});

describe('Auto-stop evaluation', () => {
  it('stops for significance', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 100 },
      treatment: { exposures: 1000, conversions: 150 },
    };
    const autoStop = evaluateAutoStop(result, 0.95, 100);
    expect(autoStop.shouldStop).toBe(true);
    expect(autoStop.reason).toBe('significance');
  });

  it('stops for harm', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 150 },
      treatment: { exposures: 1000, conversions: 100 },
    };
    const autoStop = evaluateAutoStop(result, 0.95, 100);
    expect(autoStop.shouldStop).toBe(true);
    expect(autoStop.reason).toBe('harm');
  });

  it('continues when neither significant nor harmful', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 1000, conversions: 100 },
      treatment: { exposures: 1000, conversions: 110 },
    };
    const autoStop = evaluateAutoStop(result, 0.95, 100);
    expect(autoStop.shouldStop).toBe(false);
    expect(autoStop.reason).toBe('none');
  });

  it('does not stop for significance if min sample not met', () => {
    const result = {
      experimentKey: 'test',
      control: { exposures: 50, conversions: 5 },
      treatment: { exposures: 50, conversions: 25 },
    };
    const autoStop = evaluateAutoStop(result, 0.95, 100);
    expect(autoStop.shouldStop).toBe(false);
  });
});

describe('Normal CDF approximation', () => {
  it('returns 0.5 for x=0', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 4);
  });

  it('returns ~0.8413 for x=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it('returns ~0.9772 for x=2', () => {
    expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
  });

  it('returns ~0.0228 for x=-2', () => {
    expect(normalCDF(-2)).toBeCloseTo(0.0228, 3);
  });

  it('is symmetric: CDF(-x) = 1 - CDF(x)', () => {
    for (const x of [0.5, 1, 1.5, 2, 2.5]) {
      expect(normalCDF(-x)).toBeCloseTo(1 - normalCDF(x), 6);
    }
  });
});

describe('Conversion tracking', () => {
  it('stores conversion for exposed variant', () => {
    mockLocalStorage.clear();
    assignVariantSync('hero_cta_text'); // Creates exposure
    trackConversion('hero_cta_text');
    const conversions = mockLocalStorage.getStore()['creditmate.experiments.conversions'];
    expect(conversions).toBeDefined();
  });

  it('does not store conversion without exposure', () => {
    mockLocalStorage.clear();
    trackConversion('hero_cta_text');
    const conversions = mockLocalStorage.getStore()['creditmate.experiments.conversions'];
    expect(conversions).toBeUndefined();
  });
});

describe('Reset experiment data', () => {
  it('clears all experiment storage', () => {
    mockLocalStorage.clear();
    assignVariantSync('hero_cta_text');
    assignVariantSync('quiz_vs_browse_default');
    trackConversion('hero_cta_text');
    resetExperimentData();
    const store = mockLocalStorage.getStore();
    expect(store['creditmate.experiments.anonymousId']).toBeUndefined();
    expect(store['creditmate.experiments.exposures']).toBeUndefined();
    expect(store['creditmate.experiments.conversions']).toBeUndefined();
  });
});

describe('Results view (env gated)', () => {
  it('isResultsViewEnabled returns false by default', () => {
    expect(isResultsViewEnabled()).toBe(false);
  });

  it('returns null when results view disabled', () => {
    // Need to clear localStorage so no exposures exist
    mockLocalStorage.clear();
    expect(getExperimentViewData('hero_cta_text')).toBeNull();
  });

  it('returns view data when enabled', () => {
    process.env.REACT_APP_EXPERIMENTS_RESULTS_VIEW = 'true';
    mockLocalStorage.clear();
    assignVariantSync('hero_cta_text');
    const data = getExperimentViewData('hero_cta_text');
    expect(data).not.toBeNull();
    // TypeScript doesn't narrow the type after expect().not.toBeNull(),
    // but we know data is non-null here because the test would fail otherwise.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const viewData = data!;
    expect(viewData.experimentKey).toBe('hero_cta_text');
    expect(viewData.config).toBeDefined();
    expect(viewData.results).toBeDefined();
    expect(viewData.significance).toBeDefined();
    expect(viewData.autoStop).toBeDefined();
  });

  it('getAllExperimentViewData returns all experiments', () => {
    process.env.REACT_APP_EXPERIMENTS_RESULTS_VIEW = 'true';
    mockLocalStorage.clear();
    assignVariantSync('hero_cta_text');
    assignVariantSync('quiz_vs_browse_default');
    assignVariantSync('card_layout');
    const all = getAllExperimentViewData();
    expect(all).toHaveLength(3);
  });
});
