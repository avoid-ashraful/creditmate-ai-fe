import React, { forwardRef, InputHTMLAttributes, useId } from 'react';

import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['cm-field', className].filter(Boolean).join(' ')}>
      {label ? (
        <label className="cm-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={error ? 'cm-input cm-input--error' : 'cm-input'}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint ? (
        <p className="cm-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="cm-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
