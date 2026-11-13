import React from 'react';

import { useLanguage } from '../locales';
import { getScoreCopy, scoreBand } from '../locales/score';

interface ScoreBadgeProps {
  score?: number | null;
}

/**
 * CreditMate Score badge for card tiles. Renders nothing when the card
 * has no score, so unscored cards never show a fabricated value.
 */
const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  const { lang } = useLanguage();
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return null;
  }
  const copy = getScoreCopy(lang);
  const band = scoreBand(score);
  return (
    <span
      className={`card-badge card-badge-score card-badge-score-${band}`}
      aria-label={`${copy.badgeLabel}: ${score.toFixed(1)} (${copy.bands[band]})`}
      title={copy.badgeLabel}
    >
      <span className="card-badge-score-value">{score.toFixed(1)}</span> {copy.bands[band]}
    </span>
  );
};

export default ScoreBadge;
