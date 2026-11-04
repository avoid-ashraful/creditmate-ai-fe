import React from 'react';

import './VerdictStrip.css';

export interface VerdictItem {
  label: string;
  value: React.ReactNode;
}

export interface VerdictStripProps {
  items: VerdictItem[];
  className?: string;
}

/** A one-line summary verdict: "Lowest cost: ৳3,450, best value-back: 2.1%". */
const VerdictStrip: React.FC<VerdictStripProps> = ({ items, className }) => {
  const classes = ['cm-verdict', className].filter(Boolean).join(' ');
  return (
    <div className={classes} aria-label="Summary verdict">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? (
            <span className="cm-verdict-separator" aria-hidden="true">
              ·
            </span>
          ) : null}
          <span className="cm-verdict-item">
            <span className="cm-verdict-label">{item.label}: </span>
            <strong className="cm-verdict-value">{item.value}</strong>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default VerdictStrip;
