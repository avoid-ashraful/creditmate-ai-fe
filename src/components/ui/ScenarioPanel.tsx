import React from 'react';

import './ScenarioPanel.css';

export interface ScenarioPanelProps {
  title?: string;
  /** The scenario inputs. */
  children: React.ReactNode;
  /** The computed outcome; announced politely as it changes. */
  result?: React.ReactNode;
  /** Link to the assumptions & methodology page. */
  assumptionsHref?: string;
  onReset?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Layout shell for calculators and what-if scenarios: inputs on one side,
 * a live result region on the other, assumptions one click away.
 * It contains no calculation logic — callers own the maths.
 */
const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  title,
  children,
  result,
  assumptionsHref,
  onReset,
  footer,
  className,
}) => {
  const classes = ['cm-scenario', className].filter(Boolean).join(' ');
  return (
    <section className={classes}>
      {title || assumptionsHref ? (
        <div className="cm-scenario-header">
          {title ? <h2 className="cm-scenario-title">{title}</h2> : <span />}
          {assumptionsHref ? (
            <a className="cm-scenario-assumptions" href={assumptionsHref}>
              Assumptions &amp; methodology
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="cm-scenario-body">
        <div className="cm-scenario-inputs">{children}</div>
        {result !== undefined && result !== null ? (
          <div className="cm-scenario-result" role="status" aria-live="polite">
            {result}
          </div>
        ) : null}
      </div>

      {footer || onReset ? (
        <div className="cm-scenario-footer">
          {footer}
          {onReset ? (
            <button type="button" className="cm-scenario-reset" onClick={onReset}>
              Reset
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default ScenarioPanel;
