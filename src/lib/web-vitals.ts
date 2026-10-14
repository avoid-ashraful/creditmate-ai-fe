import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import type { Metric } from 'web-vitals';

/**
 * Web Vitals Reporting Hooks
 *
 * Reports Core Web Vitals to a local endpoint or console for analysis.
 * Does not require network connectivity - can log locally or send to a dev endpoint.
 */

export interface WebVitalMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

// Enriched metric type with additional context
export interface EnrichedWebVitalMetric {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  entries: Metric['entries'];
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
}

export interface WebVitalsReporterOptions {
  /** Callback for each metric */
  onMetric?: (metric: EnrichedWebVitalMetric) => void;
  /** Optional endpoint to POST metrics to (dev only) */
  endpoint?: string;
  /** Whether to log to console */
  logToConsole?: boolean;
  /** Whether to store in localStorage for later retrieval */
  storeInLocalStorage?: boolean;
  /** Sample rate (0-1) for production */
  sampleRate?: number;
}

/**
 * Initialize web vitals reporting
 */
export function initWebVitalsReporting(options: WebVitalsReporterOptions = {}) {
  const {
    onMetric,
    endpoint,
    logToConsole = true,
    storeInLocalStorage = true,
    sampleRate = 1.0,
  } = options;

  // In development, always report; in production, respect sample rate
  const isDev = process.env.NODE_ENV !== 'production';
  const shouldReport = isDev || Math.random() < sampleRate;

  if (!shouldReport) return () => undefined;

  // web-vitals v2 doesn't return cleanup functions, so we use a no-op
  const reportMetric = (metric: Metric) => {
    // Add timestamp and page info
    const enrichedMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: (navigator as Navigator & { connection?: { effectiveType: string } }).connection
        ?.effectiveType,
    };

    // Console logging
    if (logToConsole) {
      const emoji = getMetricEmoji(metric.name);
      const rating = getMetricRating(metric.name, metric.value);
      // eslint-disable-next-line no-console
      console.log(
        `${emoji} [Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} ${
          metric.delta ? `(delta: ${metric.delta.toFixed(2)})` : ''
        } [${rating}]`,
        enrichedMetric
      );
    }

    // LocalStorage storage (for offline analysis)
    if (storeInLocalStorage) {
      try {
        const stored = JSON.parse(localStorage.getItem('web-vitals') || '[]');
        stored.push(enrichedMetric);
        // Keep only last 50 metrics
        if (stored.length > 50) stored.shift();
        localStorage.setItem('web-vitals', JSON.stringify(stored));
      } catch (e) {
        // Ignore storage errors (quota, private mode, etc.)
      }
    }

    // Custom callback
    if (onMetric) {
      onMetric(enrichedMetric);
    }

    // Send to endpoint (non-blocking)
    if (endpoint && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(enrichedMetric));
    }
  };

  // Register all Core Web Vitals handlers using web-vitals v2 API
  // Note: web-vitals v2 doesn't provide cleanup functions
  getCLS(reportMetric);
  getFID(reportMetric);
  getFCP(reportMetric);
  getLCP(reportMetric);
  getTTFB(reportMetric);

  // Return no-op cleanup (web-vitals v2 doesn't support unsubscribing)
  return () => undefined;
}

/**
 * Get emoji for metric
 */
function getMetricEmoji(name: string): string {
  switch (name) {
    case 'LCP':
      return '🎨';
    case 'FID':
      return '⚡';
    case 'INP':
      return '⚡';
    case 'CLS':
      return '📐';
    case 'FCP':
      return '🖼️';
    case 'TTFB':
      return '📡';
    default:
      return '📊';
  }
}

/**
 * Get rating for metric value based on thresholds
 */
function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
  };

  const t = thresholds[name];
  if (!t) return 'good';
  if (value <= t.good) return 'good';
  if (value >= t.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Get stored web vitals from localStorage
 */
export function getStoredWebVitals(): EnrichedWebVitalMetric[] {
  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored web vitals
 */
export function clearStoredWebVitals(): void {
  localStorage.removeItem('web-vitals');
}

/**
 * Generate a summary report of stored web vitals
 */
export function generateWebVitalsReport(): string {
  const metrics = getStoredWebVitals();
  if (metrics.length === 0) return 'No web vitals recorded.';

  const byName = metrics.reduce((acc, m) => {
    if (!acc[m.name]) acc[m.name] = [];
    acc[m.name].push(m.value);
    return acc;
  }, {} as Record<string, number[]>);

  let report = 'Web Vitals Summary Report\n';
  report += '='.repeat(40) + '\n\n';

  for (const [name, values] of Object.entries(byName)) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rating = getMetricRating(name, avg);

    report += `${name}: avg=${avg.toFixed(2)}, min=${min.toFixed(2)}, max=${max.toFixed(
      2
    )} [${rating}]\n`;
  }

  return report;
}

/**
 * Performance Budget Check (for CI/local verification)
 * Returns true if all metrics meet budget thresholds
 */
export interface PerformanceBudget {
  LCP?: number;
  FID?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
  totalBundleSizeKb?: number;
}

export function checkPerformanceBudget(
  budget: PerformanceBudget,
  metrics: EnrichedWebVitalMetric[] = getStoredWebVitals()
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  const latestByName = metrics.reduce((acc, m) => {
    if (!acc[m.name] || m.timestamp > acc[m.name].timestamp) {
      acc[m.name] = m;
    }
    return acc;
  }, {} as Record<string, EnrichedWebVitalMetric>);

  const checkMetric = (name: string, threshold: number | undefined) => {
    if (threshold === undefined) return;
    const metric = latestByName[name];
    if (metric && metric.value > threshold) {
      violations.push(`${name}: ${metric.value.toFixed(2)} exceeds budget of ${threshold}`);
    }
  };

  checkMetric('LCP', budget.LCP);
  checkMetric('FID', budget.FID);
  checkMetric('CLS', budget.CLS);
  checkMetric('FCP', budget.FCP);
  checkMetric('TTFB', budget.TTFB);

  return {
    passed: violations.length === 0,
    violations,
  };
}

// Default performance budget based on TASK_BREAKDOWN.md
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  LCP: 2500, // 2.5s mobile, 1.5s desktop (we use mobile budget)
  FID: 100, // < 100ms
  CLS: 0.1, // < 0.1
  FCP: 1800, // < 1.8s
  TTFB: 800, // < 800ms
  totalBundleSizeKb: 200,
};
