import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';

import './Input.css';
import './MoneyInput.css';

/**
 * Formats an integer with lakh (Indian) grouping: 500000 -> "5,00,000".
 */
export function formatLakh(value: number): string {
  const digits = String(Math.trunc(Math.abs(value)));
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const groups: string[] = [];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) groups.unshift(rest);
  return [...groups, lastThree].join(',');
}

export interface MoneyInputProps {
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  value: number | null;
  onValueChange: (value: number | null) => void;
  onBlur?: () => void;
}

/**
 * MoneyInput keeps a local text state. While the field is focused the text is
 * the raw digit string the user typed, so editing never fights comma
 * insertion; non-digits are stripped on every change and the parsed number is
 * reported through onValueChange. On blur (or whenever the value changes from
 * outside while unfocused) the text is reformatted with lakh grouping. The ৳
 * prefix is a visual adornment only and is never part of the editable text.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { label, hint, error, id, name, placeholder, disabled, required, value, onValueChange, onBlur },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const [text, setText] = useState<string>(() => (value == null ? '' : formatLakh(value)));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(value == null ? '' : formatLakh(value));
    }
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/[^0-9]/g, '');
    setText(raw);
    onValueChange(raw === '' ? null : parseInt(raw, 10));
  };

  const handleBlur = () => {
    focusedRef.current = false;
    setText(current => {
      const raw = current.replace(/[^0-9]/g, '');
      return raw === '' ? '' : formatLakh(parseInt(raw, 10));
    });
    onBlur?.();
  };

  return (
    <div className="cm-field">
      {label ? (
        <label className="cm-field__label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="cm-money-input">
        <span className="cm-money-input__prefix" aria-hidden="true">
          ৳
        </span>
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={error ? 'cm-input cm-input--error' : 'cm-input'}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          value={text}
          onChange={handleChange}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
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

export default MoneyInput;
