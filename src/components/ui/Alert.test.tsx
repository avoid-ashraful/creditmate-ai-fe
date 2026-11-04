import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Alert } from './Alert';

describe('Alert', () => {
  it('uses role alert for danger and warning', () => {
    render(
      <>
        <Alert variant="danger" title="Failed" />
        <Alert variant="warning" title="Careful" />
      </>
    );
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent('Failed');
  });

  it('uses role status for info and success', () => {
    render(
      <>
        <Alert variant="info" title="FYI" />
        <Alert variant="success" title="Saved" />
      </>
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it('renders body content and calls onClose from the dismiss button', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(
      <Alert variant="info" title="Heads up" onClose={onClose}>
        Details here
      </Alert>
    );
    expect(screen.getByText('Details here')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
