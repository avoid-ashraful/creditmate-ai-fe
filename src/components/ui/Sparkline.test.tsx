import { render, screen } from '@testing-library/react';
import React from 'react';

import Sparkline from './Sparkline';

const points = (values: number[]) =>
  values.map((value, index) => ({ at: `2026-0${index + 1}-01`, value }));

describe('Sparkline', () => {
  it('renders nothing with fewer than 3 real points (no implied trend)', () => {
    render(<Sparkline points={points([9.5, 9.75])} label="history" />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renders a polyline through the recorded values with an accessible label', () => {
    render(<Sparkline points={points([8.5, 9, 9.75])} label="Rate history: 8.5% to 9.75%" />);
    const svg = screen.getByRole('img', { name: 'Rate history: 8.5% to 9.75%' });
    expect(svg).toBeInTheDocument();
    // One polyline point per recorded value — no invented intermediates.
    expect(svg).toHaveAttribute('data-point-count', '3');
  });

  it('handles a flat series without dividing by zero', () => {
    render(<Sparkline points={points([9, 9, 9])} label="flat" />);
    expect(screen.getByRole('img', { name: 'flat' })).toHaveAttribute('data-point-count', '3');
  });
});
