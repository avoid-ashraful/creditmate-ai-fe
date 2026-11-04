import React from 'react';

import { formatTakaRange } from '../../lib/format';

import './UnknownValue.css';

export type UnknownValueKind =
  | 'not-published'
  | 'not-applicable'
  | 'unavailable'
  | 'derived'
  | 'estimated-range';

export interface UnknownValueProps {
  kind: UnknownValueKind;
  /** The actual value, for the 'derived' kind (and as a fallback for ranges). */
  children?: React.ReactNode;
  /**
   * Lower bound of an 'estimated-range' value. When both `min` and `max`
   * are given, the range is rendered with formatTakaRange so both ends are
   * always shown, formatted identically (plan Section 3.6).
   */
  min?: number;
  /** Upper bound of an 'estimated-range' value. See `min`. */
  max?: number;
  /** Decimal places for a `min`/`max` range. Defaults to 0. */
  decimals?: 0 | 2;
  /** Extra context, exposed to assistive technology only. */
  note?: string;
  className?: string;
}

const LABELS: Partial<Record<UnknownValueKind, string>> = {
  'not-published': 'Not published',
  'not-applicable': 'Not applicable',
  unavailable: 'Unavailable',
};

/**
 * The shared vocabulary for values CreditMate cannot state plainly.
 * Absent data is labelled, never faked: a bank that does not publish a figure
 * shows "Not published", a figure that does not apply shows "Not applicable",
 * and a figure computed or estimated from published data says so inline.
 */
const UnknownValue: React.FC<UnknownValueProps> = ({
  kind,
  children,
  min,
  max,
  decimals = 0,
  note,
  className,
}) => {
  const classes = ['cm-unknown', className].filter(Boolean).join(' ');
  const noteNode = note ? <span className="cm-visually-hidden">{note}</span> : null;

  if (kind === 'derived') {
    return (
      <span className={classes}>
        {children}
        <span className="cm-unknown-derived-badge">Derived</span>
        {noteNode}
      </span>
    );
  }

  if (kind === 'estimated-range') {
    // A band is shown as a band: both ends, always (plan Section 3.6).
    // Explicit numeric bounds are formatted via formatTakaRange; preformatted
    // children remain supported for callers that already hold a range string.
    const value =
      typeof min === 'number' && typeof max === 'number'
        ? formatTakaRange(min, max, { decimals })
        : children;
    return (
      <span className={classes}>
        {value}
        <span className="cm-unknown-range-badge">Estimated range</span>
        {noteNode}
      </span>
    );
  }

  return (
    <span className={classes}>
      {LABELS[kind]}
      {noteNode}
    </span>
  );
};

export default UnknownValue;
