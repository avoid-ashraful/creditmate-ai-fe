import React from 'react';

import './DetailSummary.css';

export interface DetailSummaryFact {
  label: string;
  value: React.ReactNode;
}

export interface DetailSummaryProps {
  identity: {
    bankName: string;
    productName: string;
  };
  /** The decision-driving figure, e.g. a Money amount or a rate. */
  heroValue: React.ReactNode;
  heroLabel: string;
  facts: DetailSummaryFact[];
  trustChip?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * The sticky decision summary for detail pages: identity, the hero figure,
 * the handful of facts that decide the choice, provenance and actions —
 * kept in view while the full detail scrolls. Pages adopt it inside their
 * own sticky container; the block itself carries position: sticky.
 */
const DetailSummary: React.FC<DetailSummaryProps> = ({
  identity,
  heroValue,
  heroLabel,
  facts,
  trustChip,
  actions,
  className,
}) => {
  const classes = ['cm-detail-summary', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <p className="cm-detail-summary-bank">{identity.bankName}</p>
      <h2 className="cm-detail-summary-product">{identity.productName}</h2>

      <div className="cm-detail-summary-hero">
        <div className="cm-detail-summary-hero-value">{heroValue}</div>
        <div className="cm-detail-summary-hero-label">{heroLabel}</div>
      </div>

      <dl className="cm-detail-summary-facts">
        {facts.map(fact => (
          <div key={fact.label} className="cm-detail-summary-fact">
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      {trustChip ? <div className="cm-detail-summary-trust">{trustChip}</div> : null}
      {actions ? <div className="cm-detail-summary-actions">{actions}</div> : null}
    </div>
  );
};

export default DetailSummary;
