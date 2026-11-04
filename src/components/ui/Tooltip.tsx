import React, { useId, useState } from 'react';

import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  /** The single trigger element; it receives aria-describedby. */
  children: React.ReactElement;
  className?: string;
}

/**
 * A simple accessible tooltip shown on hover and keyboard focus.
 *
 * Limitation: the bubble is positioned above and centred on the trigger with
 * plain CSS — there is no viewport collision detection, so avoid tooltips on
 * triggers flush against the top or side edges of the screen.
 */
const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const tooltipId = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [visible, setVisible] = useState(false);

  const trigger = React.cloneElement(children, {
    'aria-describedby': tooltipId,
  } as React.HTMLAttributes<HTMLElement>);

  const classes = ['cm-tooltip-wrap', className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {trigger}
      {visible ? (
        <span role="tooltip" id={tooltipId} className="cm-tooltip-bubble">
          {content}
        </span>
      ) : null}
    </span>
  );
};

export default Tooltip;
