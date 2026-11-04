import React from 'react';

import './Switch.css';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  const toggle = () => {
    if (!disabled) onCheckedChange(!checked);
  };

  return (
    <span className={['cm-switch-field', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        className={checked ? 'cm-switch cm-switch--checked' : 'cm-switch'}
        onClick={toggle}
      >
        <span className="cm-switch__thumb" aria-hidden="true" />
      </button>
      {label ? (
        <span
          className="cm-switch__text"
          onClick={toggle}
          aria-hidden={ariaLabel ? undefined : true}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

export default Switch;
