import React, { useId, useState } from 'react';

import './ResultCard.css';

export interface ResultCardFact {
  label: string;
  value: React.ReactNode;
}

export interface ResultCardProps {
  bankName: string;
  productName: string;
  /** The product title is a real link to this href. */
  detailHref: string;
  /** The outcome that matters, e.g. a Money amount or a rate. */
  heroValue: React.ReactNode;
  heroLabel: string;
  /** 2–3 supporting facts shown under the hero value. */
  supportingFacts: ResultCardFact[];
  badges?: React.ReactNode;
  trustChip?: React.ReactNode;
  islamic?: boolean;
  inShortlist?: boolean;
  onToggleShortlist?: () => void;
  /** Layer-2 detail, revealed by the "Details" disclosure. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * The shared outcome-first result card. The card itself is never clickable:
 * the title is a real link, the shortlist control is a real button, and any
 * extra detail sits behind an explicit disclosure.
 */
const ResultCard: React.FC<ResultCardProps> = ({
  bankName,
  productName,
  detailHref,
  heroValue,
  heroLabel,
  supportingFacts,
  badges,
  trustChip,
  islamic = false,
  inShortlist = false,
  onToggleShortlist,
  children,
  className,
}) => {
  const regionId = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [expanded, setExpanded] = useState(false);
  const classes = ['cm-result-card', className].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <div className="cm-result-card-top">
        <div>
          <p className="cm-result-card-bank">{bankName}</p>
          <h3 className="cm-result-card-title">
            <a className="cm-result-card-link" href={detailHref}>
              {productName}
            </a>
          </h3>
        </div>
        {onToggleShortlist ? (
          <button
            type="button"
            className="cm-result-card-shortlist"
            aria-pressed={inShortlist}
            onClick={onToggleShortlist}
          >
            {inShortlist ? 'In shortlist' : 'Add to shortlist'}
          </button>
        ) : null}
      </div>

      {islamic || badges ? (
        <div className="cm-result-card-badges">
          {islamic ? <span className="cm-result-card-islamic">Islamic</span> : null}
          {badges}
        </div>
      ) : null}

      <div className="cm-result-card-hero">
        <div className="cm-result-card-hero-value">{heroValue}</div>
        <div className="cm-result-card-hero-label">{heroLabel}</div>
      </div>

      <dl className="cm-result-card-facts">
        {supportingFacts.map(fact => (
          <div key={fact.label} className="cm-result-card-fact">
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      {trustChip ? <div className="cm-result-card-trust">{trustChip}</div> : null}

      {children ? (
        <div className="cm-result-card-details">
          <button
            type="button"
            className="cm-result-card-disclosure"
            aria-expanded={expanded}
            aria-controls={regionId}
            onClick={() => setExpanded(value => !value)}
          >
            Details
          </button>
          {expanded ? (
            <div id={regionId} className="cm-result-card-region">
              {children}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default ResultCard;
