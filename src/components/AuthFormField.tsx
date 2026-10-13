import React, { forwardRef, useId } from 'react';

interface AuthFormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Message for this field. Linked to the input so screen readers announce it. */
  error?: string;
  hint?: string;
}

/**
 * A labelled text input with an optional error. The error is wired up with
 * aria-describedby and aria-invalid, so it is read out when the field is focused.
 */
export const AuthFormField = forwardRef<HTMLInputElement, AuthFormFieldProps>(
  ({ label, error, hint, className, ...inputProps }, ref) => {
    const id = useId();
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

    return (
      <div className={`auth-field ${error ? 'auth-field--invalid' : ''}`}>
        <label htmlFor={id}>{label}</label>
        {hint && (
          <p id={hintId} className="auth-field-hint">
            {hint}
          </p>
        )}
        <input
          {...inputProps}
          id={id}
          ref={ref}
          className={className}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          required
        />
        {error && (
          <p id={errorId} className="auth-field-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthFormField.displayName = 'AuthFormField';
