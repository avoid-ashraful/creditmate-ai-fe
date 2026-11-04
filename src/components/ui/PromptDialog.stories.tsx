import React, { useState } from 'react';

import { Button } from './Button';
import { PromptDialog } from './PromptDialog';

export default {
  title: 'UI/PromptDialog',
  component: PromptDialog,
  tags: ['autodocs'],
};

export const Default = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Rename list</Button>
      <PromptDialog
        open={open}
        title="Rename shortlist"
        label="List name"
        initialValue="My cards"
        submitLabel="Rename"
        onSubmit={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};
