import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Gloss from './Gloss';

describe('Gloss', () => {
  it('renders the term as a focusable button', () => {
    render(<Gloss term="CIB" definition="Credit Information Bureau" />);
    const button = screen.getByRole('button', { name: 'CIB' });
    expect(button).toHaveClass('cm-gloss');
  });

  it('shows the definition on focus', () => {
    render(<Gloss term="CIB" definition="Credit Information Bureau" />);
    const button = screen.getByRole('button', { name: 'CIB' });
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Credit Information Bureau');
    expect(button.getAttribute('aria-describedby')).toBe(screen.getByRole('tooltip').id);
  });
});
