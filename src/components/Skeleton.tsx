import React from 'react';

import './Skeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
}

/** A single shimmering placeholder block. Decorative, so hidden from assistive tech. */
export const Skeleton: React.FC<SkeletonProps> = ({ width, height }) => (
  <span className="skeleton" aria-hidden="true" style={{ width, height }} data-testid="skeleton" />
);

interface SkeletonCardGridProps {
  /** Announced to screen readers while the grid is loading. */
  label: string;
  count?: number;
}

/**
 * Placeholder that matches the shape of a card grid. The status region carries
 * the same text the loading message used before, so announcements and text
 * queries keep working.
 */
export const SkeletonCardGrid: React.FC<SkeletonCardGridProps> = ({ label, count = 6 }) => (
  <div className="skeleton-card-grid" role="status" aria-live="polite" aria-busy="true">
    <span className="skeleton-label">{label}</span>
    <div className="skeleton-card-grid__items" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" data-testid="skeleton-card" key={index}>
          <Skeleton height="10rem" />
          <Skeleton width="70%" height="1.25rem" />
          <Skeleton width="45%" />
          <Skeleton width="90%" />
        </div>
      ))}
    </div>
  </div>
);
