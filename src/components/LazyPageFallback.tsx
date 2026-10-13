import React from 'react';

import { Skeleton, SkeletonCardGrid } from './Skeleton';

/**
 * Accessible Suspense fallback for lazy-loaded pages.
 * Uses the existing Skeleton component for consistent loading UI.
 */
export const LazyPageFallback: React.FC<{ label?: string }> = ({ label = 'Loading page...' }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="lazy-page-fallback">
    <SkeletonCardGrid label={label} count={4} />
  </div>
);

/**
 * Minimal fallback for pages that don't need the full card grid skeleton.
 */
export const LazyPageMinimalFallback: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="lazy-page-fallback minimal">
    <Skeleton width="40%" height="2rem" />
    <Skeleton width="60%" height="1rem" />
    <span className="visually-hidden">{label}</span>
  </div>
);

/**
 * Auth page fallback - simpler layout.
 */
export const LazyAuthFallback: React.FC = () => (
  <div role="status" aria-live="polite" aria-busy="true" className="lazy-page-fallback auth">
    <Skeleton width="100%" height="3rem" />
    <Skeleton width="80%" height="1.5rem" />
    <Skeleton width="80%" height="1.5rem" />
    <Skeleton width="60%" height="2.5rem" />
  </div>
);
