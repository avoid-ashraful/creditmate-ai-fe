import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import Toast from './Toast';

const FIRST_MESSAGE = 'First';
const SECOND_MESSAGE = 'Second';

describe('Toast', () => {
  it('renders the message inside a polite status region', () => {
    render(<Toast className="share-message" message="Results link copied to clipboard!" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveClass('share-message');
    expect(status).toHaveTextContent('Results link copied to clipboard!');
  });

  it('keeps the status region in the DOM but empty when there is no message', () => {
    render(<Toast className="selection-message" message="" />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('replaces the text when the message changes', async () => {
    const { rerender } = render(<Toast message={FIRST_MESSAGE} />);
    expect(screen.getByText(FIRST_MESSAGE)).toBeInTheDocument();

    rerender(<Toast message={SECOND_MESSAGE} />);
    expect(screen.getByText(SECOND_MESSAGE)).toBeInTheDocument();
    // The old message stays mounted until its exit animation finishes.
    await waitFor(() => expect(screen.queryByText(FIRST_MESSAGE)).not.toBeInTheDocument());
  });
});
