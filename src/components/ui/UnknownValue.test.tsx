import { render, screen } from '@testing-library/react';
import React from 'react';

import UnknownValue from './UnknownValue';

describe('UnknownValue', () => {
  it('renders the exact label for each absent-data kind', () => {
    const { rerender } = render(<UnknownValue kind="not-published" />);
    expect(screen.getByText('Not published')).toBeInTheDocument();

    rerender(<UnknownValue kind="not-applicable" />);
    expect(screen.getByText('Not applicable')).toBeInTheDocument();

    rerender(<UnknownValue kind="unavailable" />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('renders derived values with a Derived badge', () => {
    render(<UnknownValue kind="derived">6.42%</UnknownValue>);
    expect(screen.getByText('6.42%')).toBeInTheDocument();
    expect(screen.getByText('Derived')).toBeInTheDocument();
  });

  it('renders preformatted estimated-range children with an Estimated range badge', () => {
    render(<UnknownValue kind="estimated-range">৳12,000 – ৳18,500</UnknownValue>);
    expect(screen.getByText('৳12,000 – ৳18,500')).toBeInTheDocument();
    expect(screen.getByText('Estimated range')).toBeInTheDocument();
  });

  it('renders min/max bounds via formatTakaRange, both ends always shown', () => {
    render(<UnknownValue kind="estimated-range" min={100000} max={500000} />);
    expect(screen.getByText('৳1,00,000 – ৳5,00,000')).toBeInTheDocument();
    expect(screen.getByText('Estimated range')).toBeInTheDocument();
  });

  it('honours decimals for min/max ranges', () => {
    render(<UnknownValue kind="estimated-range" min={1200.5} max={1850.75} decimals={2} />);
    expect(screen.getByText('৳1,200.50 – ৳1,850.75')).toBeInTheDocument();
  });

  it('exposes the note to assistive technology only', () => {
    render(<UnknownValue kind="not-applicable" note="Islamic cards charge no interest" />);
    const note = screen.getByText('Islamic cards charge no interest');
    expect(note).toHaveClass('cm-visually-hidden');
  });
});
