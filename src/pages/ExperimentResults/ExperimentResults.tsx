import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getAllExperimentViewData,
  isResultsViewEnabled,
  ExperimentViewData,
} from '../../lib/experiments';
import { GradientButton } from '../../styles/StyledComponents';
import '../../styles/ExperimentResults.css';

const ExperimentResults: React.FC = () => {
  const navigate = useNavigate();

  // Guard: redirect if not enabled
  useEffect(() => {
    if (!isResultsViewEnabled()) {
      navigate('/');
    }
  }, [navigate]);

  if (!isResultsViewEnabled()) {
    return null;
  }

  const experiments = getAllExperimentViewData();

  return (
    <div className="experiment-results-page">
      <header className="results-header">
        <div className="header-content">
          <h1>Experiment Results</h1>
          <p className="subtitle">Internal A/B Testing Dashboard</p>
          <GradientButton onClick={() => navigate('/')} className="back-button">
            ← Back to App
          </GradientButton>
        </div>
      </header>

      <main className="results-main">
        {experiments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h2>No Experiments Running</h2>
            <p>Experiments will appear here once they receive traffic.</p>
          </div>
        ) : (
          <div className="experiments-grid">
            {experiments.map(exp => (
              <ExperimentCard key={exp.experimentKey} data={exp} />
            ))}
          </div>
        )}

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
                Default 95% (α = 0.05). The probability that the observed difference is not due to
                chance.
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
  );
};

interface ExperimentCardProps {
  data: ExperimentViewData;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ data }) => {
  const { config, results, significance, autoStop } = data;
  const { control, treatment } = results;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatRate = (exposures: number, conversions: number): string => {
    if (exposures === 0) return '—';
    return ((conversions / exposures) * 100).toFixed(2) + '%';
  };

  const formatPValue = (p: number): string => {
    if (p < 0.001) return '< 0.001';
    return p.toFixed(4);
  };

  const controlRate = control.exposures > 0 ? control.conversions / control.exposures : 0;
  const treatmentRate = treatment.exposures > 0 ? treatment.conversions / treatment.exposures : 0;
  const lift = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;

  const getStatusBadge = () => {
    if (autoStop.shouldStop) {
      if (autoStop.reason === 'harm') {
        return <span className="status-badge status-harm">⚠️ STOPPED – Harm Detected</span>;
      }
      if (autoStop.reason === 'significance') {
        return <span className="status-badge status-significant">✅ STOPPED – Significant</span>;
      }
    }
    if (significance.minSampleMet) {
      return <span className="status-badge status-running">🔄 Running (min sample met)</span>;
    }
    return <span className="status-badge status-collecting">⏳ Collecting Data</span>;
  };

  return (
    <article className="experiment-card">
      <header className="card-header">
        <div className="card-title-section">
          <h2>{config.name}</h2>
          <span className="experiment-key">{config.key}</span>
        </div>
        {getStatusBadge()}
      </header>

      <div className="card-body">
        {/* Metrics table */}
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
                <td>{formatNumber(control.exposures)}</td>
                <td>{formatNumber(control.conversions)}</td>
                <td>{formatRate(control.exposures, control.conversions)}</td>
              </tr>
              <tr className="treatment-row">
                <td>
                  <span className="variant-label treatment">Treatment</span>
                </td>
                <td>{formatNumber(treatment.exposures)}</td>
                <td>{formatNumber(treatment.conversions)}</td>
                <td>{formatRate(treatment.exposures, treatment.conversions)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Significance stats */}
        <div className="significance-stats">
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">Lift</span>
              <span className={`stat-value ${lift > 0 ? 'positive' : lift < 0 ? 'negative' : ''}`}>
                {lift >= 0 ? '+' : ''}
                {lift.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Z-Score</span>
              <span className="stat-value">{significance.zScore.toFixed(3)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">P-Value</span>
              <span className={`stat-value ${significance.significant ? 'significant' : ''}`}>
                {formatPValue(significance.pValue)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Confidence</span>
              <span className="stat-value">{(significance.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="sample-status">
            <span className={significance.minSampleMet ? 'met' : 'not-met'}>
              {significance.minSampleMet ? '✓' : '✗'} Minimum sample size (
              {significance.minSampleSize} per variant)
            </span>
            {significance.harmful && (
              <span className="harm-warning">
                ⚠️ Guardrail triggered: Treatment significantly worse than control
              </span>
            )}
          </div>
        </div>

        {/* Config details */}
        <details className="config-details">
          <summary>Experiment Configuration</summary>
          <dl className="config-list">
            <div>
              <dt>Treatment Allocation</dt>
              <dd>{config.treatmentAllocation}%</dd>
            </div>
            <div>
              <dt>Min Sample Size</dt>
              <dd>{config.minSampleSize}</dd>
            </div>
            <div>
              <dt>Confidence Level</dt>
              <dd>{(config.confidenceLevel * 100).toFixed(0)}%</dd>
            </div>
            <div>
              <dt>Enabled</dt>
              <dd>{config.enabled ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  );
};

export default ExperimentResults;
