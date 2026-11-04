import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Tabs from './Tabs';

const tabs = [
  { id: 'one', label: 'One', content: <p>Panel one</p> },
  { id: 'two', label: 'Two', content: <p>Panel two</p> },
  { id: 'three', label: 'Three', content: <p>Panel three</p>, disabled: true },
  { id: 'four', label: 'Four', content: <p>Panel four</p> },
];

describe('Tabs', () => {
  it('renders the first panel and wires aria attributes', () => {
    render(<Tabs ariaLabel="Demo" tabs={tabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByText('Panel one')).toBeInTheDocument();
    const first = screen.getByRole('tab', { name: 'One' });
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(first).toHaveAttribute('tabindex', '0');
    const panel = screen.getByRole('tabpanel');
    expect(first.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id);
  });

  it('activates a tab on click', async () => {
    const user = userEvent.setup();
    render(<Tabs ariaLabel="Demo" tabs={tabs} />);
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Panel two')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves and activates with arrow keys, skipping disabled tabs', async () => {
    const user = userEvent.setup();
    render(<Tabs ariaLabel="Demo" tabs={tabs} />);
    const first = screen.getByRole('tab', { name: 'One' });
    first.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel two')).toBeInTheDocument();

    // Three is disabled, so ArrowRight from Two lands on Four.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveFocus();

    // ArrowRight wraps back to the first tab.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveAttribute('aria-selected', 'true');
  });

  it('jumps with Home and End', async () => {
    const user = userEvent.setup();
    render(<Tabs ariaLabel="Demo" tabs={tabs} defaultTabId="two" />);
    screen.getByRole('tab', { name: 'Two' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Four' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  it('supports controlled mode via activeTabId and onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<Tabs ariaLabel="Demo" tabs={tabs} activeTabId="one" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledWith('two');
    // Parent did not update the prop, so the first tab stays active.
    expect(screen.getByText('Panel one')).toBeInTheDocument();
  });
});
