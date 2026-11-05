import { render, screen } from '@testing-library/react';
import React from 'react';

import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('renders the label with the tone glyph (never colour alone)', () => {
    render(<StatusChip tone="positive">Eligible</StatusChip>);
    const chip = screen.getByText(/Eligible/);
    expect(chip).toHaveClass('cm-status-chip--positive');
    expect(chip.textContent).toContain('✓');
  });

  it('supports an icon override for neutral deltas', () => {
    render(
      <StatusChip tone="neutral" icon="↑">
        Increased
      </StatusChip>
    );
    expect(screen.getByText(/Increased/).textContent).toContain('↑');
  });

  it('defaults to the neutral tone', () => {
    render(<StatusChip>Islamic</StatusChip>);
    expect(screen.getByText(/Islamic/)).toHaveClass('cm-status-chip--neutral');
  });
});
