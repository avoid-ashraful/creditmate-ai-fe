import React, { ButtonHTMLAttributes, forwardRef } from 'react';

import './Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = ['cm-button', `cm-button--${variant}`, `cm-button--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="cm-button__spinner" aria-hidden="true" /> : null}
      <span className="cm-button__label">{children}</span>
    </button>
  );
});

export default Button;
