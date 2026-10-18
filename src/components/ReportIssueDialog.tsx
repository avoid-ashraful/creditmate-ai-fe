import React, { useEffect, useRef, useState } from 'react';

import { useDialogFocus } from '../hooks/useDialogFocus';
import { getCardDetailCopy, useLanguage } from '../locales';
import { ApiError, apiService } from '../services/api';
import { trapTabKey } from '../utils/focus';
import './ReportIssueDialog.css';

interface ReportIssueDialogProps {
  cardId: number;
  cardName: string;
  onClose: () => void;
}

const MAX_LENGTH = 1000;
const ReportIssueDialog: React.FC<ReportIssueDialogProps> = ({ cardId, cardName, onClose }) => {
  const { lang } = useLanguage();
  const copy = getCardDetailCopy(lang);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLSelectElement>(null);
  const successCloseRef = useRef<HTMLButtonElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [field, setField] = useState('');
  const [message, setMessage] = useState('');
  const [suggested, setSuggested] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'throttled' | 'error'>('idle');
  const [missingMessage, setMissingMessage] = useState(false);

  useDialogFocus(dialogRef, fieldRef);
  useEffect(() => {
    if (status === 'sent') successCloseRef.current?.focus();
  }, [status]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (dialogRef.current) trapTabKey(event, dialogRef.current);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setMissingMessage(true);
      messageRef.current?.focus();
      return;
    }
    setMissingMessage(false);
    setStatus('sending');
    try {
      await apiService.reportCardIssue(cardId, {
        message: message.trim(),
        ...(field && { field }),
        ...(suggested.trim() && { suggested_value: suggested.trim() }),
        ...(email.trim() && { contact_email: email.trim() }),
      });
      setStatus('sent');
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 429 ? 'throttled' : 'error');
    }
  };

  const sending = status === 'sending';

  return (
    <div className="report-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        className="report-dialog"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        ref={dialogRef}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2 id="report-dialog-title">{copy.reportTitle}</h2>
        <p className="report-dialog-card">{cardName}</p>
        {status === 'sent' ? (
          <>
            <p role="status">{copy.reportSuccess}</p>
            <div className="report-dialog-actions">
              <button
                ref={successCloseRef}
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                {copy.reportClose}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p>{copy.reportIntro}</p>
            <label htmlFor="report-field">{copy.reportFieldLabel}</label>
            <select
              id="report-field"
              ref={fieldRef}
              value={field}
              onChange={e => setField(e.target.value)}
            >
              <option value="">{copy.reportFieldAny}</option>
              {Object.entries(copy.reportFields).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <label htmlFor="report-message">{copy.reportMessageLabel}</label>
            <textarea
              id="report-message"
              ref={messageRef}
              value={message}
              maxLength={MAX_LENGTH}
              rows={4}
              required
              aria-required="true"
              aria-invalid={missingMessage}
              aria-describedby={missingMessage ? 'report-message-error' : undefined}
              onChange={e => setMessage(e.target.value)}
            />
            {missingMessage && (
              <p id="report-message-error" className="report-dialog-error" role="alert">
                {copy.reportMessageRequired}
              </p>
            )}

            <label htmlFor="report-suggested">{copy.reportSuggestedLabel}</label>
            <input
              id="report-suggested"
              type="text"
              value={suggested}
              maxLength={MAX_LENGTH}
              onChange={e => setSuggested(e.target.value)}
            />

            <label htmlFor="report-email">{copy.reportEmailLabel}</label>
            <input
              id="report-email"
              type="email"
              autoComplete="email"
              value={email}
              aria-describedby="report-email-hint"
              onChange={e => setEmail(e.target.value)}
            />
            <p id="report-email-hint" className="report-dialog-hint">
              {copy.reportEmailHint}
            </p>

            {(status === 'throttled' || status === 'error') && (
              <p className="report-dialog-error" role="alert">
                {status === 'throttled' ? copy.reportThrottled : copy.reportError}
              </p>
            )}

            <div className="report-dialog-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                {copy.reportCancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? copy.reportSubmitting : copy.reportSubmit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportIssueDialog;
