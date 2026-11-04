import React, { useState } from 'react';

import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';

export default {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
};

export const Default = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Clear shortlist</Button>
      <ConfirmDialog
        open={open}
        title="Clear your shortlist?"
        message="All saved cards, deposits and loans will be removed from this device."
        confirmLabel="Clear shortlist"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

export const Danger = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete review
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete this review?"
        message="This cannot be undone. Your rating will be removed immediately."
        confirmLabel="Delete review"
        danger
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
