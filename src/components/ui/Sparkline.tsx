import React from 'react';

import './Sparkline.css';

export interface SparklinePoint {
  at: string;
  value: number;
}

export interface SparklineProps {
  points: SparklinePoint[];
  /** Accessible summary, e.g. "Rate history (6–12 months): 8.5% to 9.75%". */
  label: string;
  className?: string;
}

/**
 * A miniature trend line over published history (addendum B2).
 *
 * Honesty guards, enforced here rather than left to callers:
 * - Fewer than 3 real points render nothing — a two-point line implies
 *   a trend the data does not support.
 * - The line is a plain polyline through recorded values: no smoothing,
 *   no area fill theatre, no animation on mount.
 * - It never replaces the dated TrustChip; it sits beside the figure it
 *   summarises.
 */
const Sparkline: React.FC<SparklineProps> = ({ points, label, className }) => {
  if (points.length < 3) return null;
  const width = 96;
  const height = 28;
  const pad = 2;
  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = pad + index * stepX;
    const y = pad + (1 - (point.value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const polyline = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lastX, lastY] = coords[coords.length - 1];
  const classes = ['cm-sparkline', className].filter(Boolean).join(' ');
  return (
    <svg
      className={classes}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      data-point-count={points.length}
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" className="cm-sparkline-last" aria-hidden="true" />
    </svg>
  );
};

export default Sparkline;
