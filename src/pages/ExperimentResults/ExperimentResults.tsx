import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getAllExperimentViewData,
  isResultsViewEnabled,
  ExperimentViewData,
} from '../../lib/experiments';
import { useLanguage, getCommonCopy } from '../../locales';
import { GradientButton } from '../../styles/StyledComponents';
import '../../styles/ExperimentResults.css';

const ExperimentResults: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

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
          <h1>{common.experimentResultsTitle}</h1>
          <p className="subtitle">{common.experimentResultsSubtitle}</p>
          <GradientButton onClick={() => navigate('/')} className="back-button">
            {common.experimentBackToApp}
          </GradientButton>
        </div>
      </header>

      <main className="results-main">
        {experiments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h2>{common.experimentEmptyStateTitle}</h2>
            <p>{common.experimentEmptyStateDesc}</p>
          </div>
        ) : (
          <div className="experiments-grid">
            {experiments.map(exp => (
              <ExperimentCard key={exp.experimentKey} data={exp} common={common} />
            ))}
          </div>
        )}

        <div className="legend-section">
          <h3>{common.experimentLegendTitle}</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <h4>{common.experimentLegendZTest}</h4>
              <p>{common.experimentLegendZTestDesc}</p>
            </div>
            <div className="legend-item">
              <h4>{common.experimentLegendConfidence}</h4>
              <p>{common.experimentLegendConfidenceDesc}</p>
            </div>
            <div className="legend-item">
              <h4>{common.experimentLegendMinSample}</h4>
              <p>{common.experimentLegendMinSampleDesc}</p>
            </div>
            <div className="legend-item">
              <h4>{common.experimentLegendGuardrail}</h4>
              <p>{common.experimentLegendGuardrailDesc}</p>
            </div>
            <div className="legend-item">
              <h4>{common.experimentLegendLift}</h4>
              <p>{common.experimentLegendLiftDesc}</p>
            </div>
            <div className="legend-item">
              <h4>{common.experimentLegendAutoStop}</h4>
              <p>{common.experimentLegendAutoStopDesc}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface ExperimentCardProps {
  data: ExperimentViewData;
  common: ReturnType<typeof getCommonCopy>;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ data, common }) => {
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
        return <span className="status-badge status-harm">{common.experimentCardStatusHarm}</span>;
      }
      if (autoStop.reason === 'significance') {
        return (
          <span className="status-badge status-significant">
            {common.experimentCardStatusSignificant}
          </span>
        );
      }
    }
    if (significance.minSampleMet) {
      return (
        <span className="status-badge status-running">{common.experimentCardStatusRunning}</span>
      );
    }
    return (
      <span className="status-badge status-collecting">
        {common.experimentCardStatusCollecting}
      </span>
    );
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
                <th>{common.experimentCardVariant}</th>
                <th>{common.experimentCardExposures}</th>
                <th>{common.experimentCardConversions}</th>
                <th>{common.experimentCardRate}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="control-row">
                <td>
                  <span className="variant-label control">{common.experimentCardControl}</span>
                </td>
                <td>{formatNumber(control.exposures)}</td>
                <td>{formatNumber(control.conversions)}</td>
                <td>{formatRate(control.exposures, control.conversions)}</td>
              </tr>
              <tr className="treatment-row">
                <td>
                  <span className="variant-label treatment">{common.experimentCardTreatment}</span>
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
              <span className="stat-label">{common.experimentCardStatLift}</span>
              <span className={`stat-value ${lift > 0 ? 'positive' : lift < 0 ? 'negative' : ''}`}>
                {lift >= 0 ? '+' : ''}
                {lift.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{common.experimentCardStatZScore}</span>
              <span className="stat-value">{significance.zScore.toFixed(3)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{common.experimentCardStatPValue}</span>
              <span className={`stat-value ${significance.significant ? 'significant' : ''}`}>
                {formatPValue(significance.pValue)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{common.experimentCardStatConfidence}</span>
              <span className="stat-value">{(significance.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="sample-status">
            <span className={significance.minSampleMet ? 'met' : 'not-met'}>
              {significance.minSampleMet
                ? common.experimentCardSampleMet
                : common.experimentCardSampleNotMet}{' '}
              {common.experimentCardSampleStatus} ({significance.minSampleSize} per variant)
            </span>
            {significance.harmful && (
              <span className="harm-warning">{common.experimentCardHarmWarning}</span>
            )}
          </div>
        </div>

        {/* Config details */}
        <details className="config-details">
          <summary>{common.experimentCardConfigTitle}</summary>
          <dl className="config-list">
            <div>
              <dt>{common.experimentCardConfigTreatmentAlloc}</dt>
              <dd>{config.treatmentAllocation}%</dd>
            </div>
            <div>
              <dt>{common.experimentCardConfigMinSample}</dt>
              <dd>{config.minSampleSize}</dd>
            </div>
            <div>
              <dt>{common.experimentCardConfigConfidence}</dt>
              <dd>{(config.confidenceLevel * 100).toFixed(0)}%</dd>
            </div>
            <div>
              <dt>{common.experimentCardConfigEnabled}</dt>
              <dd>
                {config.enabled ? common.experimentCardConfigYes : common.experimentCardConfigNo}
              </dd>
            </div>
          </dl>
        </details>
      </div>
    </article>
  );
};

export default ExperimentResults;
