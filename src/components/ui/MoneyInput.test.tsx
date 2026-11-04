import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { formatLakh, MoneyInput } from './MoneyInput';

const Harness = ({ onValueChange }: { onValueChange?: (v: number | null) => void }) => {
  const [value, setValue] = useState<number | null>(null);
  return (
    <MoneyInput
      label="Amount"
      value={value}
      onValueChange={next => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
};

describe('formatLakh', () => {
  it('groups digits in lakh style', () => {
    expect(formatLakh(500)).toBe('500');
    expect(formatLakh(5000)).toBe('5,000');
    expect(formatLakh(500000)).toBe('5,00,000');
    expect(formatLakh(12345678)).toBe('1,23,45,678');
  });
});

describe('MoneyInput', () => {
  it('round-trips: typing 500000 displays 5,00,000 after blur', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Amount');
    await user.type(input, '500000');
    expect(input).toHaveValue('500000');
    await user.tab();
    expect(input).toHaveValue('5,00,000');
  });

  it('reports parsed numbers and null when cleared', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Amount');
    await user.type(input, '2500');
    expect(onValueChange).toHaveBeenLastCalledWith(2500);
    await user.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('strips non-digit characters as the user types', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    render(<Harness onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Amount');
    await user.type(input, 'a1b2');
    expect(onValueChange).toHaveBeenLastCalledWith(12);
  });

  it('shows an externally set value formatted', () => {
    render(<MoneyInput label="Salary" value={75000} onValueChange={() => {}} />);
    expect(screen.getByLabelText('Salary')).toHaveValue('75,000');
  });
});
