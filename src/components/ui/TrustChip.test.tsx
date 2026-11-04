import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import TrustChip from './TrustChip';

describe('TrustChip', () => {
  it('renders source and date as a plain chip by default', () => {
    render(<TrustChip source="BB chart" dateLabel="Oct 2026 edition" />);
    expect(screen.getByText('BB chart · Oct 2026 edition')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders as a button when onClick is provided and fires it', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<TrustChip source="BB chart" dateLabel="Oct 2026 edition" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('labels derived and changed markers in text', () => {
    const { rerender } = render(
      <TrustChip source="Bank table" dateLabel="verified 28 Oct" marker="derived" />
    );
    expect(screen.getByText('Derived')).toBeInTheDocument();

    rerender(<TrustChip source="BB chart" dateLabel="Nov 2026 edition" marker="changed" />);
    expect(screen.getByText('Changed')).toBeInTheDocument();
  });
});
