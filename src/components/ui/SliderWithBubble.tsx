import React, { useState } from 'react';

import './SliderWithBubble.css';

export interface SliderWithBubbleProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Formats the bubble + aria text, e.g. a Money rendering of the value. */
  formatValue: (value: number) => string;
  ariaLabel: string;
  className?: string;
}

/**
 * A range slider whose value bubble travels with the thumb (addendum
 * B8). The bubble's *value* updates instantly — values never animate;
 * only the bubble's position follows the thumb, and it shows while the
 * slider is dragged, hovered, or focused. The formatted value is also
 * exposed to assistive technology via aria-valuetext, so the bubble is
 * an enhancement, never the only carrier of the value.
 */
const SliderWithBubble: React.FC<SliderWithBubbleProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  ariaLabel,
  className,
}) => {
  const [active, setActive] = useState(false);
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  // Thumb is 16px: correct the bubble's centre from 8px at the start of
  // the track to -8px at the end so it stays over the thumb.
  const correction = 8 - (pct / 100) * 16;
  const classes = ['cm-slider', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      <span
        className={`cm-slider-bubble${active ? ' is-active' : ''}`}
        style={{ left: `calc(${pct}% + ${correction}px)` }}
        aria-hidden="true"
      >
        {formatValue(value)}
      </span>
      <input
        type="range"
        className="cm-slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={formatValue(value)}
        onChange={event => onChange(Number(event.target.value))}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      />
    </span>
  );
};

export default SliderWithBubble;
