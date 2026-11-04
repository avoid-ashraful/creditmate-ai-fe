import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Tooltip from './Tooltip';

describe('Tooltip', () => {
  it('shows the tooltip on hover and links it with aria-describedby', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Published by Bangladesh Bank">
        <button type="button">Source</button>
      </Tooltip>
    );
    const trigger = screen.getByRole('button', { name: 'Source' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await user.hover(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Published by Bangladesh Bank');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    await user.unhover(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on focus and hides it on blur', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Focus help">
        <button type="button">Trigger</button>
      </Tooltip>
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.tab();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus help');

    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
