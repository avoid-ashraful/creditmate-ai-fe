import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, disabled, className, ...rest },
  ref
) {
  const classes = ['cm-checkbox', disabled ? 'cm-checkbox--disabled' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classes}>
      <input
        ref={ref}
        type="checkbox"
        className="cm-checkbox__input"
        disabled={disabled}
        {...rest}
      />
      {label ? <span className="cm-checkbox__text">{label}</span> : null}
    </label>
  );
});

export default Checkbox;
