import React, { useState } from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';

export default {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

const Demo = ({ size }: { size?: 'sm' | 'md' | 'lg' }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Fee change history"
        size={size}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </>
        }
      >
        <p>
          The annual fee for this card changed from ৳1,500 to ৳2,000 on 1 June 2026, based on the
          bank&apos;s published schedule of charges.
        </p>
      </Dialog>
    </>
  );
};

export const Default = () => <Demo />;
export const Small = () => <Demo size="sm" />;
export const Large = () => <Demo size="lg" />;
