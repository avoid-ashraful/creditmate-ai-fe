import { useReducedMotion } from 'framer-motion';

/**
 * True when the user has asked for reduced motion. Components use this to skip
 * entrance animations and hover or tap transforms entirely, rather than only
 * shortening them.
 */
export const usePrefersReducedMotion = (): boolean => useReducedMotion() === true;
