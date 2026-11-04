import React from 'react';

import { Button } from './Button';
import { ToastProvider, useToast } from './Toast';

export default {
  title: 'UI/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
};

const Triggers = () => {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button onClick={() => toast({ message: 'Card added to comparison.', variant: 'success' })}>
        Success toast
      </Button>
      <Button
        variant="danger"
        onClick={() => toast({ message: 'Failed to save. Try again.', variant: 'error' })}
      >
        Error toast
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast({
            message: 'Shortlist cleared.',
            variant: 'info',
            action: { label: 'Undo', onClick: () => {} },
          })
        }
      >
        Toast with action
      </Button>
    </div>
  );
};

export const Default = () => (
  <ToastProvider>
    <Triggers />
  </ToastProvider>
);
