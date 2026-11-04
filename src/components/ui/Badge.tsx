import React, { ReactNode } from 'react';

import './Badge.css';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', dot = false, className, children }: BadgeProps) {
  const classes = ['cm-badge', `cm-badge--${variant}`, className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      {dot ? <span className="cm-badge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default Badge;
