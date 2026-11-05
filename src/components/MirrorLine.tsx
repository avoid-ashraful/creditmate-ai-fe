import React from 'react';

import './MirrorLine.css';

/**
 * Mirror-don't-decorate (Phase 4, addendum B8): the planner restates
 * its own inputs in words, updating as the user types. The line is a
 * mirror of state the user just entered — it computes nothing and
 * predicts nothing — so it can never drift from the form it sits above.
 */
const MirrorLine: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="cm-mirror-line">{children}</p>
);

export default MirrorLine;
