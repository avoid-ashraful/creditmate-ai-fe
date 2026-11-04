import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { ToastProvider, useToast } from './Toast';

const Trigger = ({ onAction }: { onAction?: () => void }) => {
  const { toast } = useToast();
  return (
    <>
      <button
        type="button"
        onClick={() => toast({ message: 'Saved!', variant: 'success', duration: 1000 })}
      >
        Show timed
      </button>
      <button
        type="button"
        onClick={() =>
          toast({ message: 'Cleared', action: { label: 'Undo', onClick: onAction ?? (() => {}) } })
        }
      >
        Show action
      </button>
    </>
  );
};

describe('Toast system', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows a toast with role status and dismisses it from the close button', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show timed' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved!');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('auto-dismisses after its duration', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show timed' }));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('runs the action callback and dismisses', () => {
    const onAction = jest.fn();
    render(
      <ToastProvider>
        <Trigger onAction={onAction} />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show action' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText('Cleared')).not.toBeInTheDocument();
  });

  it('throws when useToast is used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Bare = () => {
      useToast();
      return null;
    };
    expect(() => render(<Bare />)).toThrow('useToast must be used within a ToastProvider');
    spy.mockRestore();
  });
});
