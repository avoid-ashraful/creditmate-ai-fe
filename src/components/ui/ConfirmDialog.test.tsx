import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { ConfirmDialog } from './ConfirmDialog';

const baseProps = {
  open: true,
  title: 'Delete review?',
  message: 'This cannot be undone.',
  confirmLabel: 'Delete review',
  onConfirm: () => {},
  onCancel: () => {},
};

describe('ConfirmDialog', () => {
  it('shows the message and fires onConfirm', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete review' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fires onCancel from the cancel button and defaults its label', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses the danger button variant when danger is set', () => {
    render(<ConfirmDialog {...baseProps} danger />);
    expect(screen.getByRole('button', { name: 'Delete review' })).toHaveClass('cm-button--danger');
  });
});
