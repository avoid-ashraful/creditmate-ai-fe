import { render, screen } from '@testing-library/react';
import React from 'react';

import Money from './Money';

describe('Money', () => {
  it('renders a lakh-grouped taka amount', () => {
    render(<Money value={500000} />);
    expect(screen.getByText('৳5,00,000')).toBeInTheDocument();
  });

  it('renders two decimals when asked', () => {
    render(<Money value={1234.5} decimals={2} />);
    expect(screen.getByText('৳1,234.50')).toBeInTheDocument();
  });

  it('renders Unavailable for null, undefined and NaN', () => {
    const { rerender } = render(<Money value={null} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();

    rerender(<Money value={undefined} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();

    rerender(<Money value={Number.NaN} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('applies the cm-money class and any custom class', () => {
    render(<Money value={100} className="extra" />);
    const money = screen.getByText('৳100');
    expect(money).toHaveClass('cm-money');
    expect(money).toHaveClass('extra');
  });
});
