import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Button } from './Button';

describe('Button', () => {
  it('renders children and defaults to primary md', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('cm-button', 'cm-button--primary', 'cm-button--md');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies ghost and danger variants and sm size', () => {
    render(
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="danger" size="sm">
          Delete
        </Button>
      </>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('cm-button--ghost');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'cm-button--danger',
      'cm-button--sm'
    );
  });

  it('fires onClick when clicked', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and aria-busy while loading, and does not fire clicks', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>
    );
    const button = screen.getByRole('button', { name: /Saving/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>
    );
    await user.click(screen.getByRole('button', { name: 'Nope' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
