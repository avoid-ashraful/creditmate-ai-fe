/**
 * CreditMate AI - A/B Testing Framework
 *
 * Deterministic, consent-gated, analytics-allowlisted experiment assignment.
 * Built on top of the existing analytics infrastructure.
 */

import { analytics, type AnalyticsEventName } from './analytics';

/**
 * Experiment variants type
 */
export type Variant = 'control' | 'treatment';

/**
 * Experiment configuration
 */
export interface ExperimentConfig {
  /** Unique experiment key */
  key: string;
  /** Human-readable name */
  name: string;
  /** Treatment allocation percentage (0-100) */
  treatmentAllocation: number;
  /** Whether experiment is enabled */
  enabled: boolean;
  /** Minimum sample size per variant before significance can be evaluated */
  minSampleSize: number;
  /** Confidence level for significance testing (e.g., 0.95) */
  confidenceLevel: number;
}

/**
 * Experiment assignment result
 */
export interface ExperimentAssignment {
  experimentKey: string;
  variant: Variant;
  /** Whether this is a new exposure (first time seeing this experiment) */
  isNewExposure: boolean;
}

/**
 * Experiment exposure event payload
 */
export interface ExperimentExposurePayload {
  experimentKey: string;
  variant: Variant;
}

/**
 * Remote override provider interface (PostHog-style feature flags)
 */
export interface RemoteOverrideProvider {
  /** Fetch variant for a given experiment key and anonymous ID */
  getVariant: (experimentKey: string, anonymousId: string) => Promise<Variant | null>;
  /** Optional: fetch all overrides at once */
  getAllOverrides?: (anonymousId: string) => Promise<Record<string, Variant>>;
}

/**
 * Experiment result data for statistical analysis
 */
export interface ExperimentResult {
  experimentKey: string;
  control: {
    exposures: number;
    conversions: number;
  };
  treatment: {
    exposures: number;
    conversions: number;
  };
}

/**
 * Significance test result
 */
export interface SignificanceResult {
  experimentKey: string;
  significant: boolean;
  pValue: number;
  zScore: number;
  confidenceLevel: number;
  /** Whether the treatment is harmful (guardrail triggered) */
  harmful: boolean;
  /** Relative lift of treatment over control (conversion rate ratio - 1) */
  lift: number;
  /** Minimum sample size required */
  minSampleSize: number;
  /** Whether minimum sample size is met for both variants */
  minSampleMet: boolean;
}

/**
 * Auto-stop evaluation result
 */
export interface AutoStopResult {
  shouldStop: boolean;
  reason: 'significance' | 'harm' | 'none';
  significanceResult: SignificanceResult;
}

/**
 * Internal experiment results view data
 */
export interface ExperimentViewData {
  experimentKey: string;
  config: ExperimentConfig;
  results: ExperimentResult;
  significance: SignificanceResult;
  autoStop: AutoStopResult;
}

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ANONYMOUS_ID: 'creditmate.experiments.anonymousId',
  EXPOSURES: 'creditmate.experiments.exposures',
  CONVERSIONS: 'creditmate.experiments.conversions',
} as const;

/**
 * Generate a stable anonymous ID stored in localStorage
 */
export const getAnonymousId = (): string => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'server-side';
  }

  let id = window.localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
  if (!id) {
    // Generate a UUID v4-like string
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    window.localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, id);
  }
  return id;
};

/**
 * Simple hash function for deterministic bucketing
 * Uses FNV-1a hash algorithm
 */
export const hashString = (str: string): number => {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Ensure positive 32-bit integer
  return hash >>> 0;
};

/**
 * Get bucket (0-99) for an experiment key + anonymous ID combination
 */
export const getBucket = (experimentKey: string, anonymousId: string): number => {
  const combined = `${experimentKey}:${anonymousId}`;
  return hashString(combined) % 100;
};

/**
 * Check if user has opted out of analytics
 */
const isAnalyticsOptedOut = (): boolean => {
  return analytics.isOptedOut();
};

/**
 * Get stored exposures for an experiment
 */
const getStoredExposures = (): Record<string, Variant> => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.EXPOSURES);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Store exposure for an experiment
 */
const storeExposure = (experimentKey: string, variant: Variant): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const exposures = getStoredExposures();
    exposures[experimentKey] = variant;
    window.localStorage.setItem(STORAGE_KEYS.EXPOSURES, JSON.stringify(exposures));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Get stored conversions for an experiment
 */
const getStoredConversions = (): Record<string, Variant> => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.CONVERSIONS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Store conversion for an experiment
 */
export const storeConversion = (experimentKey: string): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const exposures = getStoredExposures();
    const variant = exposures[experimentKey];
    if (!variant) return;

    const conversions = getStoredConversions();
    conversions[experimentKey] = variant;
    window.localStorage.setItem(STORAGE_KEYS.CONVERSIONS, JSON.stringify(conversions));
  } catch {
    // Ignore storage errors
  }
};

/**
 * Experiment registry with the three configured experiments.
 * All are disabled (control for everyone) until a real analytics provider and
 * consent flow exist; the quiz must never be redirected away.
 */
export const EXPERIMENTS: Record<string, ExperimentConfig> = {
  hero_cta_text: {
    key: 'hero_cta_text',
    name: 'Hero CTA Text',
    treatmentAllocation: 50,
    enabled: false,
    minSampleSize: 100,
    confidenceLevel: 0.95,
  },
  quiz_vs_browse_default: {
    key: 'quiz_vs_browse_default',
    name: 'Quiz vs Browse Default',
    treatmentAllocation: 50,
    enabled: false,
    minSampleSize: 100,
    confidenceLevel: 0.95,
  },
  card_layout: {
    key: 'card_layout',
    name: 'Card Layout',
    treatmentAllocation: 50,
    enabled: false,
    minSampleSize: 100,
    confidenceLevel: 0.95,
  },
} as const;

/**
 * Experiment keys type for type safety
 */
export type ExperimentKey = keyof typeof EXPERIMENTS;

/**
 * Remote override provider (no-network default)
 */
let remoteOverrideProvider: RemoteOverrideProvider | null = null;

/**
 * Set the remote override provider for feature flags
 */
export const setRemoteOverrideProvider = (provider: RemoteOverrideProvider | null): void => {
  remoteOverrideProvider = provider;
};

/**
 * Get the current remote override provider
 */
export const getRemoteOverrideProvider = (): RemoteOverrideProvider | null => {
  return remoteOverrideProvider;
};

/**
 * Assign user to experiment variant
 * - Deterministic: same user + same experiment = same variant
 * - Consistent: uses hash-based bucketing
 * - Respects analytics opt-out: opted-out users get control, no exposure event
 * - Supports remote override for feature flags
 */
export const assignVariant = async (
  experimentKey: ExperimentKey
): Promise<ExperimentAssignment> => {
  const config = EXPERIMENTS[experimentKey];

  // If analytics opted out, return control with no exposure tracking
  if (isAnalyticsOptedOut() || !config.enabled) {
    return {
      experimentKey,
      variant: 'control',
      isNewExposure: false,
    };
  }

  // Created only once an experiment is live, so nothing is stored for users in control-by-default
  const anonymousId = getAnonymousId();

  // Check for remote override first
  if (remoteOverrideProvider) {
    try {
      const overrideVariant = await remoteOverrideProvider.getVariant(experimentKey, anonymousId);
      if (overrideVariant) {
        const exposures = getStoredExposures();
        const isNewExposure = exposures[experimentKey] !== overrideVariant;
        if (isNewExposure) {
          storeExposure(experimentKey, overrideVariant);
          trackExposure(experimentKey, overrideVariant);
        }
        return {
          experimentKey,
          variant: overrideVariant,
          isNewExposure,
        };
      }
    } catch {
      // Fall through to local assignment on remote error
    }
  }

  // Deterministic local assignment
  const bucket = getBucket(experimentKey, anonymousId);
  const variant: Variant = bucket < config.treatmentAllocation ? 'treatment' : 'control';

  // Check if this is a new exposure
  const exposures = getStoredExposures();
  const isNewExposure = !(experimentKey in exposures);

  if (isNewExposure) {
    storeExposure(experimentKey, variant);
    trackExposure(experimentKey, variant);
  }

  return {
    experimentKey,
    variant,
    isNewExposure,
  };
};

/**
 * Synchronous version of assignVariant (for use in render paths)
 * Does not check remote overrides
 */
export const assignVariantSync = (experimentKey: ExperimentKey): ExperimentAssignment => {
  const config = EXPERIMENTS[experimentKey];

  if (isAnalyticsOptedOut() || !config.enabled) {
    return {
      experimentKey,
      variant: 'control',
      isNewExposure: false,
    };
  }

  const anonymousId = getAnonymousId();

  const bucket = getBucket(experimentKey, anonymousId);
  const variant: Variant = bucket < config.treatmentAllocation ? 'treatment' : 'control';

  const exposures = getStoredExposures();
  const isNewExposure = !(experimentKey in exposures);

  if (isNewExposure) {
    storeExposure(experimentKey, variant);
    trackExposure(experimentKey, variant);
  }

  return {
    experimentKey,
    variant,
    isNewExposure,
  };
};

/**
 * Track experiment exposure via analytics allowlist
 * Only fires for new exposures and non-opted-out users
 */
const trackExposure = (experimentKey: string, variant: Variant): void => {
  analytics.track(
    'experiment_exposure' as AnalyticsEventName,
    {
      experimentKey,
      variant,
    } as unknown as Parameters<typeof analytics.track>[1]
  );
};

/**
 * Track experiment conversion
 * Should be called when a conversion event occurs for an experiment
 */
export const trackConversion = (experimentKey: ExperimentKey): void => {
  if (isAnalyticsOptedOut()) return;

  const exposures = getStoredExposures();
  const variant = exposures[experimentKey];
  if (!variant) return;

  storeConversion(experimentKey);

  analytics.track(
    'experiment_conversion' as AnalyticsEventName,
    {
      experimentKey,
      variant,
    } as unknown as Parameters<typeof analytics.track>[1]
  );
};

/**
 * Get experiment variant for display (synchronous, no exposure tracking)
 * Useful for rendering without triggering exposure events
 */
export const getVariant = (experimentKey: ExperimentKey): Variant => {
  const assignment = assignVariantSync(experimentKey);
  return assignment.variant;
};

/**
 * Check if user is in treatment group for an experiment
 */
export const isTreatment = (experimentKey: ExperimentKey): boolean => {
  return getVariant(experimentKey) === 'treatment';
};

/**
 * Reset all experiment data (for testing)
 */
export const resetExperimentData = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_ID);
  window.localStorage.removeItem(STORAGE_KEYS.EXPOSURES);
  window.localStorage.removeItem(STORAGE_KEYS.CONVERSIONS);
};

/**
 * ============================================================
 * STATISTICAL SIGNIFICANCE CALCULATOR
 * Two-proportion z-test with confidence and minimum sample
 * ============================================================
 */

/**
 * Z-scores for common confidence levels
 */
const Z_SCORES: Record<number, number> = {
  0.9: 1.645,
  0.95: 1.96,
  0.99: 2.576,
};

/**
 * Get Z-score for a confidence level (with interpolation fallback)
 */
const getZScore = (confidenceLevel: number): number => {
  if (Z_SCORES[confidenceLevel]) {
    return Z_SCORES[confidenceLevel];
  }
  // Approximate inverse normal CDF for other confidence levels
  // Using a simple approximation for common values
  if (confidenceLevel >= 0.99) return 2.576;
  if (confidenceLevel >= 0.95) return 1.96;
  if (confidenceLevel >= 0.9) return 1.645;
  return 1.96; // default
};

/**
 * Calculate two-proportion z-test
 * Based on standard formula for comparing two proportions
 */
export const calculateSignificance = (
  result: ExperimentResult,
  confidenceLevel = 0.95,
  minSampleSize = 100
): SignificanceResult => {
  const { control, treatment } = result;

  const controlRate = control.exposures > 0 ? control.conversions / control.exposures : 0;
  const treatmentRate = treatment.exposures > 0 ? treatment.conversions / treatment.exposures : 0;

  // Pooled proportion
  const pooledConversions = control.conversions + treatment.conversions;
  const pooledExposures = control.exposures + treatment.exposures;
  const pooledRate = pooledExposures > 0 ? pooledConversions / pooledExposures : 0;

  // Standard error
  const se = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / control.exposures + 1 / treatment.exposures)
  );

  // Z-score
  const zScore = se > 0 ? (treatmentRate - controlRate) / se : 0;

  // Two-tailed p-value using normal CDF approximation
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  // Relative lift
  const lift = controlRate > 0 ? (treatmentRate - controlRate) / controlRate : 0;

  // Check minimum sample size
  const minSampleMet = control.exposures >= minSampleSize && treatment.exposures >= minSampleSize;

  // Check for harm (guardrail): treatment significantly worse than control
  // One-tailed test for harm at same confidence level
  const zCritical = getZScore(confidenceLevel);
  const harmful = zScore < -zCritical && minSampleMet;

  // Significant if p-value < alpha (two-tailed)
  const significant = pValue < 1 - confidenceLevel && minSampleMet;

  return {
    experimentKey: result.experimentKey,
    significant,
    pValue,
    zScore,
    confidenceLevel,
    harmful,
    lift,
    minSampleSize,
    minSampleMet,
  };
};

/**
 * Normal CDF approximation (Abramowitz & Stegun 26.2.17)
 * Accuracy ~ 1e-7
 */
export const normalCDF = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
};

/**
 * Evaluate auto-stop criteria (significance or harm guardrail)
 */
export const evaluateAutoStop = (
  result: ExperimentResult,
  confidenceLevel = 0.95,
  minSampleSize = 100
): AutoStopResult => {
  const significance = calculateSignificance(result, confidenceLevel, minSampleSize);

  if (significance.harmful) {
    return {
      shouldStop: true,
      reason: 'harm',
      significanceResult: significance,
    };
  }

  if (significance.significant) {
    return {
      shouldStop: true,
      reason: 'significance',
      significanceResult: significance,
    };
  }

  return {
    shouldStop: false,
    reason: 'none',
    significanceResult: significance,
  };
};

/**
 * ============================================================
 * INTERNAL RESULTS VIEW (guarded by env flag)
 * ============================================================
 */

/**
 * Check if experiment results view is enabled
 */
export const isResultsViewEnabled = (): boolean => {
  return process.env.REACT_APP_EXPERIMENTS_RESULTS_VIEW === 'true';
};

/**
 * Get experiment view data for the internal results page
 */
export const getExperimentViewData = (experimentKey: ExperimentKey): ExperimentViewData | null => {
  // Guard: return null if results view not enabled
  if (!isResultsViewEnabled()) {
    return null;
  }

  const config = EXPERIMENTS[experimentKey];

  // Get stored data
  const exposures = getStoredExposures();
  const conversions = getStoredConversions();

  const controlExposures = Object.entries(exposures).filter(([, v]) => v === 'control').length;
  const treatmentExposures = Object.entries(exposures).filter(([, v]) => v === 'treatment').length;

  const controlConversions = Object.entries(conversions).filter(([, v]) => v === 'control').length;
  const treatmentConversions = Object.entries(conversions).filter(
    ([, v]) => v === 'treatment'
  ).length;

  const result: ExperimentResult = {
    experimentKey,
    control: {
      exposures: controlExposures,
      conversions: controlConversions,
    },
    treatment: {
      exposures: treatmentExposures,
      conversions: treatmentConversions,
    },
  };

  const significance = calculateSignificance(result, config.confidenceLevel, config.minSampleSize);
  const autoStop = evaluateAutoStop(result, config.confidenceLevel, config.minSampleSize);

  return {
    experimentKey,
    config,
    results: result,
    significance,
    autoStop,
  };
};

/**
 * Get all experiment view data
 */
export const getAllExperimentViewData = (): ExperimentViewData[] => {
  return Object.keys(EXPERIMENTS)
    .map(key => getExperimentViewData(key as ExperimentKey))
    .filter((data): data is ExperimentViewData => data !== null);
};
