import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

import { toastVariants, usePrefersReducedMotion } from '../animations';

import './Toast.css';

interface ToastProps {
  /** Empty string hides the message. */
  message: string;
  className?: string;
}

/**
 * Inline status message that fades and slides in when it changes. The outer
 * element is always rendered, so the live region is in place before the text
 * arrives and screen readers announce it.
 */
const Toast: React.FC<ToastProps> = ({ message, className }) => {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <p className={className} role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {message && (
          <motion.span
            key={message}
            className="toast-message"
            variants={toastVariants}
            initial={reduceMotion ? false : 'hidden'}
            animate="visible"
            exit="exit"
          >
            {message}
          </motion.span>
        )}
      </AnimatePresence>
    </p>
  );
};

export default Toast;
