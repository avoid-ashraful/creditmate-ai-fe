import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Input } from './Input';

describe('Input', () => {
  it('associates the label with the input', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('wires the hint through aria-describedby', () => {
    render(<Input label="Income" hint="Gross, before tax" id="income" />);
    const input = screen.getByLabelText('Income');
    expect(input).toHaveAttribute('aria-describedby', 'income-hint');
    expect(screen.getByText('Gross, before tax')).toHaveAttribute('id', 'income-hint');
  });

  it('marks the input invalid and describes the error', () => {
    render(<Input label="Email" error="Invalid email" id="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain('email-error');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('reports typed values through onChange', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Input label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText('Name'), 'Ash');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('Ash');
  });
});
