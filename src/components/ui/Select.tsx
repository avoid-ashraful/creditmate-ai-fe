import React, { forwardRef, SelectHTMLAttributes, useId } from 'react';

import './Input.css';
import './Select.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, children, ...rest },
  ref
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['cm-field', className].filter(Boolean).join(' ')}>
      {label ? (
        <label className="cm-field__label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <div className="cm-select-wrap">
        <select
          ref={ref}
          id={selectId}
          className={error ? 'cm-select cm-select--error' : 'cm-select'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
      </div>
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

export default Select;
