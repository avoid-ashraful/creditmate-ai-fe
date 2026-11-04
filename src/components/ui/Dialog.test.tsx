import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="History">
        Body
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a modal dialog labelled by its title', () => {
    render(
      <Dialog open onClose={() => {}} title="History">
        Body text
      </Dialog>
    );
    const dialog = screen.getByRole('dialog', { name: 'History' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Dialog open onClose={onClose} title="History">
        Body
      </Dialog>
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the overlay itself is clicked but not on content clicks', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Dialog open onClose={onClose} title="History">
        Body
      </Dialog>
    );
    await user.click(screen.getByText('Body'));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByTestId('cm-dialog-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the close button', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Dialog open onClose={onClose} title="History">
        Body
      </Dialog>
    );
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders footer actions', () => {
    render(
      <Dialog open onClose={() => {}} title="History" footer={<button type="button">Done</button>}>
        Body
      </Dialog>
    );
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
});
