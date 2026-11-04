import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { Switch } from './Switch';

const Harness = () => {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onCheckedChange={setChecked} label="Alerts" />;
};

describe('Switch', () => {
  it('exposes switch semantics and toggles on click', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const control = screen.getByRole('switch', { name: 'Alerts' });
    expect(control).toHaveAttribute('aria-checked', 'false');
    await user.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles with the Space key', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Alerts" />);
    screen.getByRole('switch', { name: 'Alerts' }).focus();
    await user.keyboard(' ');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();
    render(<Switch checked onCheckedChange={onCheckedChange} aria-label="Alerts" disabled />);
    await user.click(screen.getByRole('switch', { name: 'Alerts' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
