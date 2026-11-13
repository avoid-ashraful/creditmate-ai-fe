import { motion } from 'framer-motion';
import React from 'react';

import { fadeInUp, usePrefersReducedMotion } from '../animations';

import { Logo } from './brand/Logo';
import '../styles/AuthPages.css';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Centered card that fades and rises in; skipped for reduced motion.
 *
 * Midnight Ledger (plan V2, P5): the auth flow is the one full-navy
 * page — the reversed lockup sits above the paper ledger card on an
 * ink-navy ground (`.auth-page--navy` in AuthPages.css). The account
 * page keeps the plain `.auth-page` treatment; only this wrapper
 * carries the modifier.
 */
export const AuthCard: React.FC<AuthCardProps> = ({ title, children }) => {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="auth-page auth-page--navy">
      <div className="auth-brand">
        <Logo variant="onDark" size={40} />
      </div>
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
