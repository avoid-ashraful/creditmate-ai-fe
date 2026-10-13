/**
 * Lighthouse CI Configuration
 *
 * Runs Lighthouse locally without network (using the built app).
 * Configured for performance budget checking.
 *
 * Usage:
 *   npm run build
 *   npx lhci autorun
 *
 * Or via npm script: npm run lighthouse
 */

module.exports = {
  ci: {
    collect: {
      // Start the built app on a local server
      startServerCommand: 'npx serve -s build -l 3001',
      url: [
        'http://localhost:3001/',
        'http://localhost:3001/compare?ids=1,2,3',
        'http://localhost:3001/category/travel',
        'http://localhost:3001/card/synthetic-bank-2/synthetic-visa-travel',
        'http://localhost:3001/perfect-card-finder',
        'http://localhost:3001/reward-calculator',
      ],
      // Number of runs per URL (for stability)
      numberOfRuns: 3,
      // Use headless Chrome
      settings: {
        headless: true,
        // Disable network for local testing
        disableStorageReset: true,
        // Use a fixed viewport
        emulatedFormFactor: 'mobile',
        // Preset for CI
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // Performance budgets (mobile thresholds)
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],

        // Core Web Vitals thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
        'first-input-delay': ['error', { maxNumericValue: 100 }], // 100ms
        'interaction-to-next-paint': ['error', { maxNumericValue: 200 }], // 200ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }], // 1.8s
        'time-to-first-byte': ['warn', { maxNumericValue: 800 }], // 800ms

        // Additional metrics
        'total-blocking-time': ['error', { maxNumericValue: 200 }], // 200ms
        'speed-index': ['warn', { maxNumericValue: 3400 }], // 3.4s
      },
    },
    upload: {
      // Don't upload to external service by default
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
  },
};
