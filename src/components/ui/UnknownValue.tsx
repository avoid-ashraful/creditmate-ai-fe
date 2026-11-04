import React from 'react';

import './UnknownValue.css';

export type UnknownValueKind =
  | 'not-published'
  | 'not-applicable'
  | 'unavailable'
  | 'derived'
  | 'estimated-range';

export interface UnknownValueProps {
  kind: UnknownValueKind;
  /** The actual value, for 'derived' and 'estimated-range' kinds. */
  children?: React.ReactNode;
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
const UnknownValue: React.FC<UnknownValueProps> = ({ kind, children, note, className }) => {
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
    return (
      <span className={classes}>
        {children}
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
