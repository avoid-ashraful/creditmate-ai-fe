import React, { useRef, useState } from 'react';

import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';
import { ApiError, authClient } from '../services/auth';
import { describeApiErrors } from '../utils/authErrors';

import { AuthFormField } from './AuthFormField';

interface ResendVerificationProps {
  /** Known address (signed-in user). Without it the component asks for one. */
  email?: string;
}

/**
 * "Resend verification email" action. The server answers 200 whether or not the
 * account exists, so the success message is the same generic localized line.
 */
export const ResendVerification: React.FC<ResendVerificationProps> = ({ email }) => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const [typedEmail, setTypedEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [message, setMessage] = useState<{ text: string; failed: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const target = (email ?? typedEmail).trim();

  const handleClick = async () => {
    if (!target) {
      setFieldError(copy.fieldRequired);
      inputRef.current?.focus();
      return;
    }
    setFieldError(undefined);
    setMessage(null);
    setSending(true);
    try {
      await authClient.resendVerification(target);
      setMessage({ text: copy.resendSent, failed: false });
    } catch (error) {
      const text =
        error instanceof ApiError && error.status === 429
          ? copy.resendRateLimited
          : describeApiErrors(error, copy, []).form ?? copy.genericError;
      setMessage({ text, failed: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-resend">
      {email === undefined && (
        <AuthFormField
          ref={inputRef}
          label={copy.emailLabel}
          type="email"
          name="resend-email"
          autoComplete="email"
          value={typedEmail}
          onChange={event => setTypedEmail(event.target.value)}
          error={fieldError}
        />
      )}
      <button type="button" className="secondary-button" disabled={sending} onClick={handleClick}>
        {sending ? copy.submitting : copy.resendButton}
      </button>
      <p
        className={message?.failed ? 'auth-field-error' : 'auth-hint'}
        role={message?.failed ? 'alert' : 'status'}
      >
        {message?.text}
      </p>
    </div>
  );
};
