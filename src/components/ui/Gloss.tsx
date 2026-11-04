import React from 'react';

import Tooltip from './Tooltip';

import './Gloss.css';

export interface GlossProps {
  /** The visible term, e.g. "CIB". */
  term: string;
  /** The plain-language definition shown on hover/focus. */
  definition: React.ReactNode;
}

/**
 * An inline glossary term: dotted underline, definition in a tooltip.
 * Rendered as a real button so it is keyboard-focusable.
 */
const Gloss: React.FC<GlossProps> = ({ term, definition }) => (
  <Tooltip content={definition}>
    <button type="button" className="cm-gloss">
      {term}
    </button>
  </Tooltip>
);

export default Gloss;
