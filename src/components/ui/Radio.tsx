import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

import './Radio.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, disabled, className, ...rest },
  ref
) {
  const classes = ['cm-radio', disabled ? 'cm-radio--disabled' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={classes}>
      <input ref={ref} type="radio" className="cm-radio__input" disabled={disabled} {...rest} />
      {label ? <span className="cm-radio__text">{label}</span> : null}
    </label>
  );
});

export default Radio;
