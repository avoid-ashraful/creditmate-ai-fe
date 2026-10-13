import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { LanguageProvider } from '../../locales';

import ExperimentResults from './ExperimentResults';

const withProviders = (Story: React.FC) => (
  <MemoryRouter initialEntries={['/experiments']}>
    <LanguageProvider initialLang="en">
      <div style={{ padding: '1rem' }}>
        <Story />
      </div>
    </LanguageProvider>
  </MemoryRouter>
);

export default {
  title: 'Pages/ExperimentResults',
  component: ExperimentResults,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'desktop' },
  },
  decorators: [withProviders],
};

/* State: experiments enabled with sample data (requires env flag) */
export const Enabled = () => {
  // This story requires REACT_APP_EXPERIMENTS_RESULTS_VIEW=true
  // In Storybook, we can&apos;t easily set this, so we document the expected state
  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--color-border-base)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
        <strong>Note:</strong> This page requires{' '}
        <code>REACT_APP_EXPERIMENTS_RESULTS_VIEW=true</code> environment variable.
      </p>
      <ExperimentResults />
    </div>
  );
};

/* State: disabled (shows empty state or redirects) */
export const Disabled = () => {
  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--color-border-base)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
        When <code>REACT_APP_EXPERIMENTS_RESULTS_VIEW</code> is not set to{' '}
        <code>&apos;true&apos;</code>, the page redirects to <code>/</code>.
      </p>
      <div className="experiment-results-page">
        <header className="results-header">
          <div className="header-content">
            <h1>Experiment Results</h1>
            <p className="subtitle">Internal A/B Testing Dashboard</p>
          </div>
        </header>
        <main className="results-main">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h2>No Experiments Running</h2>
            <p>Experiments will appear here once they receive traffic.</p>
          </div>
          <div className="legend-section">
            <h3>Legend & Methodology</h3>
            <div className="legend-grid">
              <div className="legend-item">
                <h4>Two-Proportion Z-Test</h4>
                <p>
                  Tests whether the difference in conversion rates between control and treatment is
                  statistically significant.
                </p>
              </div>
              <div className="legend-item">
                <h4>Confidence Level</h4>
                <p>
                  Default 95% (\u03b1 = 0.05). The probability that the observed difference is not
                  due to chance.
                </p>
              </div>
              <div className="legend-item">
                <h4>Minimum Sample Size</h4>
                <p>
                  Both variants must reach this exposure count before significance is evaluated
                  (default: 100).
                </p>
              </div>
              <div className="legend-item">
                <h4>Guardrail (Harm)</h4>
                <p>
                  If treatment performs significantly worse than control (one-tailed), experiment
                  auto-stops.
                </p>
              </div>
              <div className="legend-item">
                <h4>Lift</h4>
                <p>Relative improvement: (treatment_rate - control_rate) / control_rate.</p>
              </div>
              <div className="legend-item">
                <h4>Auto-Stop</h4>
                <p>Experiments stop automatically on significance or harm detection.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* State: experiment card with significant results */
export const SignificantResults = () => (
  <div
    style={{
      padding: '1rem',
      border: '1px solid var(--color-border-base)',
      borderRadius: 'var(--radius-md)',
      maxWidth: '600px',
    }}
  >
    <article className="experiment-card">
      <header className="card-header">
        <div className="card-title-section">
          <h2>Hero CTA Text</h2>
          <span className="experiment-key">hero_cta_text</span>
        </div>
        <span className="status-badge status-significant">\u2705 STOPPED \u2013 Significant</span>
      </header>
      <div className="card-body">
        <div className="metrics-table">
          <table>
            <thead>
              <tr>
                <th>Variant</th>
                <th>Exposures</th>
                <th>Conversions</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="control-row">
                <td>
                  <span className="variant-label control">Control</span>
                </td>
                <td>1,250</td>
                <td>125</td>
                <td>10.00%</td>
              </tr>
              <tr className="treatment-row">
                <td>
                  <span className="variant-label treatment">Treatment</span>
                </td>
                <td>1,200</td>
                <td>180</td>
                <td>15.00%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="significance-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Lift</span>
              <span className="stat-value positive">+50.0%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Z-Score</span>
              <span className="stat-value">3.452</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">P-Value</span>
              <span className="stat-value significant">0.0006</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">95%</span>
            </div>
          </div>
          <div className="sample-status">
            <span className="met">\u2713 Minimum sample size (100 per variant)</span>
          </div>
        </div>
        <details className="config-details">
          <summary>Experiment Configuration</summary>
          <dl className="config-list">
            <div>
              <dt>Treatment Allocation</dt>
              <dd>50%</dd>
            </div>
            <div>
              <dt>Min Sample Size</dt>
              <dd>100</dd>
            </div>
            <div>
              <dt>Confidence Level</dt>
              <dd>95%</dd>
            </div>
            <div>
              <dt>Enabled</dt>
              <dd>Yes</dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  </div>
);

/* State: experiment card with harm detected */
export const HarmDetected = () => (
  <div
    style={{
      padding: '1rem',
      border: '1px solid var(--color-border-base)',
      borderRadius: 'var(--radius-md)',
      maxWidth: '600px',
    }}
  >
    <article className="experiment-card">
      <header className="card-header">
        <div className="card-title-section">
          <h2>Quiz vs Browse Default</h2>
          <span className="experiment-key">quiz_vs_browse_default</span>
        </div>
        <span className="status-badge status-harm">\u26a0\ufe0f STOPPED \u2013 Harm Detected</span>
      </header>
      <div className="card-body">
        <div className="metrics-table">
          <table>
            <thead>
              <tr>
                <th>Variant</th>
                <th>Exposures</th>
                <th>Conversions</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="control-row">
                <td>
                  <span className="variant-label control">Control</span>
                </td>
                <td>1,000</td>
                <td>150</td>
                <td>15.00%</td>
              </tr>
              <tr className="treatment-row">
                <td>
                  <span className="variant-label treatment">Treatment</span>
                </td>
                <td>1,000</td>
                <td>100</td>
                <td>10.00%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="significance-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Lift</span>
              <span className="stat-value negative">-33.3%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Z-Score</span>
              <span className="stat-value">-2.828</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">P-Value</span>
              <span className="stat-value significant">0.0047</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">95%</span>
            </div>
          </div>
          <div className="sample-status">
            <span className="met">\u2713 Minimum sample size (100 per variant)</span>
            <span className="harm-warning">
              \u26a0\ufe0f Guardrail triggered: Treatment significantly worse than control
            </span>
          </div>
        </div>
        <details className="config-details">
          <summary>Experiment Configuration</summary>
          <dl className="config-list">
            <div>
              <dt>Treatment Allocation</dt>
              <dd>50%</dd>
            </div>
            <div>
              <dt>Min Sample Size</dt>
              <dd>100</dd>
            </div>
            <div>
              <dt>Confidence Level</dt>
              <dd>95%</dd>
            </div>
            <div>
              <dt>Enabled</dt>
              <dd>Yes</dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  </div>
);

/* State: experiment card collecting data (min sample not met) */
export const CollectingData = () => (
  <div
    style={{
      padding: '1rem',
      border: '1px solid var(--color-border-base)',
      borderRadius: 'var(--radius-md)',
      maxWidth: '600px',
    }}
  >
    <article className="experiment-card">
      <header className="card-header">
        <div className="card-title-section">
          <h2>Card Layout</h2>
          <span className="experiment-key">card_layout</span>
        </div>
        <span className="status-badge status-collecting">\u23f3 Collecting Data</span>
      </header>
      <div className="card-body">
        <div className="metrics-table">
          <table>
            <thead>
              <tr>
                <th>Variant</th>
                <th>Exposures</th>
                <th>Conversions</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="control-row">
                <td>
                  <span className="variant-label control">Control</span>
                </td>
                <td>45</td>
                <td>5</td>
                <td>11.11%</td>
              </tr>
              <tr className="treatment-row">
                <td>
                  <span className="variant-label treatment">Treatment</span>
                </td>
                <td>42</td>
                <td>6</td>
                <td>14.29%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="significance-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Lift</span>
              <span className="stat-value positive">+28.6%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Z-Score</span>
              <span className="stat-value">0.712</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">P-Value</span>
              <span className="stat-value">0.4763</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">95%</span>
            </div>
          </div>
          <div className="sample-status">
            <span className="not-met">\u2717 Minimum sample size (100 per variant)</span>
          </div>
        </div>
        <details className="config-details">
          <summary>Experiment Configuration</summary>
          <dl className="config-list">
            <div>
              <dt>Treatment Allocation</dt>
              <dd>50%</dd>
            </div>
            <div>
              <dt>Min Sample Size</dt>
              <dd>100</dd>
            </div>
            <div>
              <dt>Confidence Level</dt>
              <dd>95%</dd>
            </div>
            <div>
              <dt>Enabled</dt>
              <dd>Yes</dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  </div>
);

/* State: experiment card running (min sample met but not significant) */
export const RunningNotSignificant = () => (
  <div
    style={{
      padding: '1rem',
      border: '1px solid var(--color-border-base)',
      borderRadius: 'var(--radius-md)',
      maxWidth: '600px',
    }}
  >
    <article className="experiment-card">
      <header className="card-header">
        <div className="card-title-section">
          <h2>Hero CTA Text</h2>
          <span className="experiment-key">hero_cta_text</span>
        </div>
        <span className="status-badge status-running">\u2b50 Running (min sample met)</span>
      </header>
      <div className="card-body">
        <div className="metrics-table">
          <table>
            <thead>
              <tr>
                <th>Variant</th>
                <th>Exposures</th>
                <th>Conversions</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="control-row">
                <td>
                  <span className="variant-label control">Control</span>
                </td>
                <td>2,500</td>
                <td>250</td>
                <td>10.00%</td>
              </tr>
              <tr className="treatment-row">
                <td>
                  <span className="variant-label treatment">Treatment</span>
                </td>
                <td>2,400</td>
                <td>260</td>
                <td>10.83%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="significance-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Lift</span>
              <span className="stat-value positive">+8.3%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Z-Score</span>
              <span className="stat-value">1.123</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">P-Value</span>
              <span className="stat-value">0.2615</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">95%</span>
            </div>
          </div>
          <div className="sample-status">
            <span className="met">\u2713 Minimum sample size (100 per variant)</span>
          </div>
        </div>
        <details className="config-details">
          <summary>Experiment Configuration</summary>
          <dl className="config-list">
            <div>
              <dt>Treatment Allocation</dt>
              <dd>50%</dd>
            </div>
            <div>
              <dt>Min Sample Size</dt>
              <dd>100</dd>
            </div>
            <div>
              <dt>Confidence Level</dt>
              <dd>95%</dd>
            </div>
            <div>
              <dt>Enabled</dt>
              <dd>Yes</dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  </div>
);

/* State: multiple experiment cards grid */
export const MultipleExperiments = () => (
  <div style={{ padding: '1rem' }}>
    <div
      className="experiments-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {/* Significant */}
      <article
        className="experiment-card"
        style={{ border: '1px solid var(--color-border-base)', borderRadius: 'var(--radius-lg)' }}
      >
        <header className="card-header">
          <div className="card-title-section">
            <h2>Hero CTA Text</h2>
            <span className="experiment-key">hero_cta_text</span>
          </div>
          <span className="status-badge status-significant">\u2705 STOPPED \u2013 Significant</span>
        </header>
        <div className="card-body">
          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Exposures</th>
                  <th>Conversions</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="control-row">
                  <td>
                    <span className="variant-label control">Control</span>
                  </td>
                  <td>1,250</td>
                  <td>125</td>
                  <td>10.00%</td>
                </tr>
                <tr className="treatment-row">
                  <td>
                    <span className="variant-label treatment">Treatment</span>
                  </td>
                  <td>1,200</td>
                  <td>180</td>
                  <td>15.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="significance-stats">
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Lift</span>
                <span className="stat-value positive">+50.0%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Z-Score</span>
                <span className="stat-value">3.452</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">P-Value</span>
                <span className="stat-value significant">0.0006</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Confidence</span>
                <span className="stat-value">95%</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Harm */}
      <article
        className="experiment-card"
        style={{ border: '1px solid var(--color-border-base)', borderRadius: 'var(--radius-lg)' }}
      >
        <header className="card-header">
          <div className="card-title-section">
            <h2>Quiz vs Browse</h2>
            <span className="experiment-key">quiz_vs_browse_default</span>
          </div>
          <span className="status-badge status-harm">\u26a0\ufe0f STOPPED \u2013 Harm</span>
        </header>
        <div className="card-body">
          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Exposures</th>
                  <th>Conversions</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="control-row">
                  <td>
                    <span className="variant-label control">Control</span>
                  </td>
                  <td>1,000</td>
                  <td>150</td>
                  <td>15.00%</td>
                </tr>
                <tr className="treatment-row">
                  <td>
                    <span className="variant-label treatment">Treatment</span>
                  </td>
                  <td>1,000</td>
                  <td>100</td>
                  <td>10.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="significance-stats">
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Lift</span>
                <span className="stat-value negative">-33.3%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Z-Score</span>
                <span className="stat-value">-2.828</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">P-Value</span>
                <span className="stat-value significant">0.0047</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Confidence</span>
                <span className="stat-value">95%</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Collecting */}
      <article
        className="experiment-card"
        style={{ border: '1px solid var(--color-border-base)', borderRadius: 'var(--radius-lg)' }}
      >
        <header className="card-header">
          <div className="card-title-section">
            <h2>Card Layout</h2>
            <span className="experiment-key">card_layout</span>
          </div>
          <span className="status-badge status-collecting">\u23f3 Collecting Data</span>
        </header>
        <div className="card-body">
          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th>Exposures</th>
                  <th>Conversions</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="control-row">
                  <td>
                    <span className="variant-label control">Control</span>
                  </td>
                  <td>45</td>
                  <td>5</td>
                  <td>11.11%</td>
                </tr>
                <tr className="treatment-row">
                  <td>
                    <span className="variant-label treatment">Treatment</span>
                  </td>
                  <td>42</td>
                  <td>6</td>
                  <td>14.29%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="significance-stats">
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Lift</span>
                <span className="stat-value positive">+28.6%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Z-Score</span>
                <span className="stat-value">0.712</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">P-Value</span>
                <span className="stat-value">0.4763</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Confidence</span>
                <span className="stat-value">95%</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
);

/* State: dark mode */
export const DarkMode = () => (
  <div data-theme="dark" style={{ padding: '1rem' }}>
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--color-border-base)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
        Dark mode variant of the experiment results dashboard.
      </p>
      <ExperimentResults />
    </div>
  </div>
);

/* State: legend section only */
export const LegendOnly = () => (
  <div
    style={{
      padding: '1rem',
      border: '1px solid var(--color-border-base)',
      borderRadius: 'var(--radius-md)',
      maxWidth: '800px',
    }}
  >
    <div className="legend-section">
      <h3>Legend & Methodology</h3>
      <div
        className="legend-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          className="legend-item"
          style={{
            padding: '1rem',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4>Two-Proportion Z-Test</h4>
          <p>
            Tests whether the difference in conversion rates between control and treatment is
            statistically significant.
          </p>
        </div>
        <div
          className="legend-item"
          style={{
            padding: '1rem',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4>Confidence Level</h4>
          <p>
            Default 95% (\u03b1 = 0.05). The probability that the observed difference is not due to
            chance.
          </p>
        </div>
        <div
          className="legend-item"
          style={{
            padding: '1rem',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4>Minimum Sample Size</h4>
          <p>
            Both variants must reach this exposure count before significance is evaluated (default:
            100).
          </p>
        </div>
        <div
          className="legend-item"
          style={{
            padding: '1rem',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4>Guardrail (Harm)</h4>
          <p>
            If treatment performs significantly worse than control (one-tailed), experiment
            auto-stops.
          </p>
        </div>
        <div
          className="legend-item"
          style={{
            padding: '1rem',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4>Lift</h4>
          <p>Relative improvement: (treatment_rate - control_rate) / control_rate.</p>
        </div>
        <div
          className="legend-item"
          style={{
            padding: '1rem',
            background: 'var(--color-background-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <h4>Auto-Stop</h4>
          <p>Experiments stop automatically on significance or harm detection.</p>
        </div>
      </div>
    </div>
  </div>
);
