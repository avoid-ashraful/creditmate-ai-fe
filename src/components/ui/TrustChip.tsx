import React from 'react';

import './TrustChip.css';

export type TrustChipMarker = 'derived' | 'changed';

export interface TrustChipProps {
  /** Where the data came from, e.g. "BB chart" or "Bank schedule of charges". */
  source: string;
  /** When it applies / was verified, e.g. "Oct 2026 edition" or "verified 3 Nov". */
  dateLabel: string;
  marker?: TrustChipMarker;
  /** When provided, the chip is a button that opens the provenance detail. */
  onClick?: () => void;
  className?: string;
}

const MARKER_LABELS: Record<TrustChipMarker, string> = {
  derived: 'Derived',
  changed: 'Changed',
};

/**
 * A quiet provenance chip: where a figure came from and when it was current.
 * Text only — the marker is a small coloured dot plus its label.
 */
const TrustChip: React.FC<TrustChipProps> = ({ source, dateLabel, marker, onClick, className }) => {
  const classes = ['cm-trust-chip', className].filter(Boolean).join(' ');
  const content = (
    <>
      <span>
        {source} · {dateLabel}
      </span>
      {marker ? (
        <span className="cm-trust-chip-marker">
          <span className={`cm-trust-chip-dot cm-trust-chip-dot-${marker}`} aria-hidden="true" />
          {MARKER_LABELS[marker]}
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <span className={classes}>{content}</span>;
};

export default TrustChip;
