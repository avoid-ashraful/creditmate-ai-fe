import { motion } from 'framer-motion';
import React from 'react';

import { fadeInUp, usePrefersReducedMotion } from '../animations';
import '../styles/AuthPages.css';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
}

/** Centered card that fades and rises in; skipped for reduced motion. */
export const AuthCard: React.FC<AuthCardProps> = ({ title, children }) => {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="auth-page">
      <motion.section
        className="auth-card"
        variants={fadeInUp}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
      >
        <h1>{title}</h1>
        {children}
      </motion.section>
    </div>
  );
};

interface AuthAlertProps {
  message: string | null;
}

/**
 * Form-level error region. It is always rendered and focusable, so pages can move
 * focus here after a failed submit and screen readers announce the text.
 */
export const AuthAlert = React.forwardRef<HTMLDivElement, AuthAlertProps>(({ message }, ref) => (
  <div ref={ref} className="auth-alert" role="alert" tabIndex={-1}>
    {message}
  </div>
));

AuthAlert.displayName = 'AuthAlert';
