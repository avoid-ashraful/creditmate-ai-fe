import { MotionConfig } from 'framer-motion';
import React from 'react';

/**
 * Applies the user's `prefers-reduced-motion` setting to every Framer Motion
 * component below it. With `reducedMotion="user"`, Framer drops transform and
 * layout animations for those users. Components also gate their own entrance
 * and hover motion with `usePrefersReducedMotion`, and `motion.css` stops
 * CSS animations and transitions.
 */
export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
