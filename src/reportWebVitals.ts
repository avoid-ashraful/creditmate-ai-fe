import { ReportHandler } from 'web-vitals';

import {
  initWebVitalsReporting,
  DEFAULT_PERFORMANCE_BUDGET,
  checkPerformanceBudget,
} from './lib/web-vitals';

/**
 * Enhanced Web Vitals Reporter
 *
 * Initializes comprehensive web vitals reporting with:
 * - Console logging (development)
 * - LocalStorage persistence (offline analysis)
 * - Performance budget checking
 * - Optional endpoint reporting
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  // Default: initialize full reporting in development
  if (process.env.NODE_ENV !== 'production') {
    const cleanup = initWebVitalsReporting({
      logToConsole: true,
      storeInLocalStorage: true,
      sampleRate: 1.0,
      // Optional: send to local endpoint for analysis
      // endpoint: 'http://localhost:3001/web-vitals',
      onMetric: metric => {
        // Call the original callback if provided
        if (onPerfEntry) {
          onPerfEntry({
            name: metric.name,
            value: metric.value,
            delta: metric.delta,
            id: metric.id,
            entries: metric.entries as any,
          });
        }
      },
    });

    // Check performance budget on page unload
    window.addEventListener('beforeunload', () => {
      const result = checkPerformanceBudget(DEFAULT_PERFORMANCE_BUDGET);
      if (!result.passed) {
        console.warn('⚠️ Performance budget violations:', result.violations);
      } else {
        console.log('✅ Performance budget met');
      }
    });

    // Expose for manual inspection in devtools
    (window as Window & { __webVitalsCleanup?: () => void }).__webVitalsCleanup = cleanup;
  } else if (onPerfEntry && onPerfEntry instanceof Function) {
    // Production: minimal reporting via callback only
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
