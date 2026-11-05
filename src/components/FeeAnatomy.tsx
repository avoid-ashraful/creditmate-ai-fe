import React from 'react';

import { Money, UnknownValue } from './ui';
import './FeeAnatomy.css';

export interface FeeAnatomyLayer {
  label: string;
  /** Signed BDT amount; null when the figure is not published. */
  value: number | null;
  /** How the layer enters the total, shown as a + / − sign. */
  sign: 'add' | 'subtract';
  /** Optional honest note (e.g. a waiver condition not yet met). */
  note?: string;
}

export interface FeeAnatomyProps {
  heading: string;
  intro: string;
  layers: FeeAnatomyLayer[];
  totalLabel: string;
  /** Null when any layer is unpublished: the total is then not shown. */
  total: number | null;
  noTotalNote: string;
}

/**
 * The fee-anatomy diagram (Phase 4, addendum B3): a product's yearly
 * cost/value as stacked labelled layers that visibly sum to the total.
 *
 * Honesty rules, enforced by construction:
 * - A layer whose figure is not published renders as an empty stratum
 *   labelled "Not published" — never dropped, never estimated.
 * - The total renders only when EVERY layer is known; otherwise the
 *   diagram degrades to the strata plus an explicit note, because a
 *   partial sum presented as a total would be a fabricated number.
 * - Bar widths are proportional to the largest known layer; amounts are
 *   the page's own computed figures, passed in — this component does no
 *   maths beyond the scaling.
 */
const FeeAnatomy: React.FC<FeeAnatomyProps> = ({
  heading,
  intro,
  layers,
  totalLabel,
  total,
  noTotalNote,
}) => {
  const maxAbs = Math.max(
    1,
    ...layers.map(layer => (layer.value === null ? 0 : Math.abs(layer.value)))
  );
  return (
    <section className="cm-fee-anatomy" aria-label={heading}>
      <h3>{heading}</h3>
      <p className="cm-fee-anatomy-intro">{intro}</p>
      <div className="cm-fee-anatomy-layers">
        {layers.map(layer => (
          <div key={layer.label} className="cm-fee-anatomy-layer">
            <span className="cm-fee-anatomy-label">
              {layer.sign === 'subtract' ? '− ' : '+ '}
              {layer.label}
            </span>
            <span className="cm-fee-anatomy-track">
              {layer.value !== null ? (
                <span
                  className={`cm-fee-anatomy-bar cm-fee-anatomy-bar--${layer.sign}`}
                  style={{ width: `${Math.max(2, (Math.abs(layer.value) / maxAbs) * 100)}%` }}
                />
              ) : (
                <span className="cm-fee-anatomy-bar cm-fee-anatomy-bar--unknown" />
              )}
            </span>
            <span className="cm-fee-anatomy-value">
              {layer.value !== null ? (
                <Money value={layer.value} />
              ) : (
                <UnknownValue kind="not-published" />
              )}
            </span>
            {layer.note ? <span className="cm-fee-anatomy-note">{layer.note}</span> : null}
          </div>
        ))}
      </div>
      {total !== null ? (
        <p className="cm-fee-anatomy-total">
          <span>{totalLabel}</span>
          <strong>
            <Money value={total} />
          </strong>
        </p>
      ) : (
        <p className="cm-fee-anatomy-note">{noTotalNote}</p>
      )}
    </section>
  );
};

export default FeeAnatomy;
