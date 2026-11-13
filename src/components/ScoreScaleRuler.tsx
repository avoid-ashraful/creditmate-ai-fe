import React from 'react';

import { useLanguage } from '../locales';
import { getScoreCopy, type ScoreBand } from '../locales/score';

/**
 * The CreditMate Score 0–10 scale as a ledger ruler (plan V2 P4 — the
 * methodology page's one diagrammatic moment). Presentational only:
 * the band ranges mirror scoreBand() in locales/score and the labels
 * are the existing score copy, so the ruler can never drift from what
 * the product already says. The gold marker sits at 7, where the
 * Excellent band begins — gold marking the premium threshold, paired
 * with the band word below it (never colour alone).
 */
const BAND_RANGES: { band: ScoreBand; from: number; to: number }[] = [
  { band: 'basic', from: 0, to: 5 },
  { band: 'fair', from: 5, to: 6 },
  { band: 'good', from: 6, to: 7 },
  { band: 'excellent', from: 7, to: 10 },
];

const EXCELLENT_THRESHOLD = 7;

const ScoreScaleRuler: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getScoreCopy(lang);
  const ariaLabel =
    `${copy.badgeLabel} 0–10: ` +
    BAND_RANGES.map(range => `${copy.bands[range.band]} ${range.from}–${range.to}`).join(', ');

  return (
    <div className="score-ruler" role="img" aria-label={ariaLabel}>
      <div className="score-ruler-track-wrap" aria-hidden="true">
        <div className="score-ruler-track">
          {BAND_RANGES.map(range => (
            <span
              key={range.band}
              className={`score-ruler-segment score-ruler-segment-${range.band}`}
              style={{ width: `${(range.to - range.from) * 10}%` }}
            />
          ))}
        </div>
        <span
          className="score-ruler-marker"
          data-testid="score-ruler-marker"
          style={{ left: `${EXCELLENT_THRESHOLD * 10}%` }}
        />
      </div>
      <div className="score-ruler-scale" aria-hidden="true">
        {Array.from({ length: 11 }, (_, n) => (
          <span
            key={n}
            className="score-ruler-tick"
            style={{ left: `${n * 10}%` }}
            data-edge={n === 0 ? 'start' : n === 10 ? 'end' : undefined}
          >
            {n}
          </span>
        ))}
      </div>
      <ul className="score-ruler-bands" aria-hidden="true">
        {BAND_RANGES.map(range => (
          <li key={range.band} style={{ width: `${(range.to - range.from) * 10}%` }}>
            <span className={`score-ruler-band-name score-ruler-band-name-${range.band}`}>
              {copy.bands[range.band]}
            </span>
            <span className="score-ruler-band-range">
              {range.from}–{range.to}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreScaleRuler;
