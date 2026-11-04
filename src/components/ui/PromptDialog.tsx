import React, { FormEvent, useState } from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';
import { Input } from './Input';

import './PromptDialog.css';

export interface PromptDialogProps {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

/** Mounts only while open so the field state resets from initialValue. */
function PromptDialogInner({
  title,
  label,
  initialValue = '',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}: Omit<PromptDialogProps, 'open'>) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('This field is required.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Dialog open onClose={onCancel} title={title} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label={label}
          value={value}
          error={error}
          autoFocus
          onChange={event => {
            setValue(event.target.value);
            if (error) setError(undefined);
          }}
        />
        <div className="cm-prompt-dialog__actions">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function PromptDialog({ open, ...rest }: PromptDialogProps) {
  if (!open) return null;
  return <PromptDialogInner {...rest} />;
}

export default PromptDialog;
