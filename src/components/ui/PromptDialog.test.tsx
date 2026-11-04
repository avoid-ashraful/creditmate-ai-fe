import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { PromptDialog } from './PromptDialog';

const baseProps = {
  open: true,
  title: 'Rename list',
  label: 'List name',
  initialValue: 'My cards',
  onSubmit: () => {},
  onCancel: () => {},
};

describe('PromptDialog', () => {
  it('submits the trimmed value on Enter', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<PromptDialog {...baseProps} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('List name');
    await user.clear(input);
    await user.type(input, '  Travel cards  {enter}');
    expect(onSubmit).toHaveBeenCalledWith('Travel cards');
  });

  it('shows an inline error and does not submit when empty', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<PromptDialog {...baseProps} initialValue="" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required.');
    expect(screen.getByLabelText('List name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('fires onCancel from the cancel button', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();
    render(<PromptDialog {...baseProps} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
