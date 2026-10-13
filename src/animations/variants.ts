import type { Variants } from 'framer-motion';

/**
 * Framer Motion needs plain numbers, so these mirror the `--transition-duration-*`
 * and `--transition-easing-*` tokens in styles/tokens.css. Keep them in sync.
 */
export const DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
  slower: 0.5,
} as const;

export const EASE_OUT = [0, 0, 0.2, 1] as const;

/** Entrance for cards and list items: fade and rise slightly. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slower },
  },
};

/** Parent that staggers the entrance of its children. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/** Route-level page transition: fade in while sliding in from the right. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
};

/** Hover and tap feedback for interactive cards. */
export const cardHover = { y: -5 };
export const cardTap = { scale: 0.99 };

/** Modal backdrop fade. */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};

/** Modal panel: a short rise and scale-in on open, a quicker fade on close. */
export const modalPanelVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: DURATION.fast },
  },
};

/** Status and toast messages: slide up into view and fade out. */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
};
