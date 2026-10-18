import React, { forwardRef, useId } from 'react';

interface AuthCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  /** Label content. May include links; the whole label toggles the box. */
  children: React.ReactNode;
  /** Message for this checkbox. Linked to the input so screen readers announce it. */
  error?: string;
}

/**
 * A labelled checkbox with an optional error, wired up like AuthFormField.
 * Links inside the label stay clickable without toggling the box.
 */
export const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
  ({ children, error, ...inputProps }, ref) => {
    const id = useId();
    const errorId = `${id}-error`;

    return (
      <div className={`auth-checkbox ${error ? 'auth-field--invalid' : ''}`}>
        <div className="auth-checkbox-row">
          <input
            {...inputProps}
            id={id}
            ref={ref}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <label htmlFor={id}>{children}</label>
        </div>
        {error && (
          <p id={errorId} className="auth-field-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthCheckbox.displayName = 'AuthCheckbox';
