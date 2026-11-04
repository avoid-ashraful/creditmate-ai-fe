import React from 'react';

import { useLanguage } from '../locales';
import { getScoreCopy, scoreBand } from '../locales/score';
import { CreditCard } from '../types';

/** Component display order, matching the backend breakdown. */
const COMPONENT_ORDER = ['annual_cost', 'interest', 'rewards', 'perks', 'data_confidence'] as const;

interface ScoreSectionProps {
  card: CreditCard;
}

/**
 * CreditMate Score section for the card detail page: the total, its
 * band, and the per-component breakdown (points, bar, reason) exactly
 * as scored by the backend. Renders nothing when the card is unscored.
 */
const ScoreSection: React.FC<ScoreSectionProps> = ({ card }) => {
  const { lang } = useLanguage();
  const score = card.creditmateScore;
  const breakdown = card.creditmateScoreBreakdown;
  if (score === null || score === undefined || !Number.isFinite(score) || !breakdown) {
    return null;
  }
  const copy = getScoreCopy(lang);
  const band = scoreBand(score);
  const components = COMPONENT_ORDER.filter(key => breakdown[key]);

  return (
    <section className="score-section" aria-labelledby="creditmate-score-heading">
      <h2 id="creditmate-score-heading">{copy.detailHeading}</h2>
      <div className="score-summary">
        <span className={`score-total score-total-${band}`}>{score.toFixed(1)}</span>
        <span className="score-band">{copy.bands[band]}</span>
      </div>
      <p className="score-intro">{copy.detailIntro}</p>
      <ul className="score-breakdown">
        {components.map(key => {
          const component = breakdown[key];
          const percent = component.max > 0 ? (component.points / component.max) * 100 : 0;
          return (
            <li key={key} className="score-component">
              <div className="score-component-header">
                <span className="score-component-label">{copy.componentLabels[key] ?? key}</span>
                <span className="score-component-points">
                  {copy.pointsOf
                    .replace('{points}', component.points.toFixed(2))
                    .replace('{max}', component.max.toFixed(1))}
                </span>
              </div>
              <div
                className="score-bar"
                role="img"
                aria-label={`${copy.componentLabels[key] ?? key}: ${component.points} / ${
                  component.max
                }`}
              >
                <div className="score-bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <p className="score-component-reason">{component.reason}</p>
            </li>
          );
        })}
      </ul>
      <a className="score-methodology-link" href="/methodology">
        {copy.methodologyLink}
      </a>
    </section>
  );
};

export default ScoreSection;
