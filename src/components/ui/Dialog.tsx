import React, { ReactNode, useEffect, useRef } from 'react';

import { useDialogFocus } from '../../hooks/useDialogFocus';

import './Dialog.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * The inner component mounts only while the dialog is open, so
 * useDialogFocus runs its containment/restore effect on every open.
 */
function DialogInner({ onClose, title, children, footer, size = 'md' }: Omit<DialogProps, 'open'>) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useDialogFocus(dialogRef, closeRef);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="cm-dialog-overlay"
      data-testid="cm-dialog-overlay"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`cm-dialog cm-dialog--${size}`}
      >
        <div className="cm-dialog__header">
          <h2 className="cm-dialog__title">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            className="cm-dialog__close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="cm-dialog__body">{children}</div>
        {footer ? <div className="cm-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Dialog({ open, ...rest }: DialogProps) {
  if (!open) return null;
  return <DialogInner {...rest} />;
}

export default Dialog;
