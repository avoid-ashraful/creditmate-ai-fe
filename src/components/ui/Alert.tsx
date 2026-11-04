import React, { ReactNode } from 'react';

import './Alert.css';

export type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const role = variant === 'danger' || variant === 'warning' ? 'alert' : 'status';
  const classes = ['cm-alert', `cm-alert--${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role={role}>
      <div className="cm-alert__content">
        {title ? <p className="cm-alert__title">{title}</p> : null}
        {children ? <div className="cm-alert__body">{children}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="cm-alert__close" aria-label="Dismiss" onClick={onClose}>
          ×
        </button>
      ) : null}
    </div>
  );
}

export default Alert;
