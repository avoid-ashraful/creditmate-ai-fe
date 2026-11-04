import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('toggles when its label is clicked', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Islamic only" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Islamic only' });
    expect(box).not.toBeChecked();
    await user.click(screen.getByText('Islamic only'));
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalled();
  });

  it('respects the disabled state', () => {
    render(<Checkbox label="Locked" disabled />);
    expect(screen.getByRole('checkbox', { name: 'Locked' })).toBeDisabled();
  });
});
