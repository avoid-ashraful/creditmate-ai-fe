import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { AuthAlert, AuthCard } from '../components/AuthCard';
import { AuthFormField } from '../components/AuthFormField';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';
import { authClient } from '../services/auth';
import {
  describeApiErrors,
  FormErrors,
  NO_FORM_ERRORS,
  requiredFieldErrors,
} from '../utils/authErrors';

const INPUT_KEYS = ['email'];

const ForgotPasswordPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_FORM_ERRORS);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the confirmation once it is on screen, so it is read out.
  useEffect(() => {
    if (sent) statusRef.current?.focus();
  }, [sent]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = requiredFieldErrors({ email }, copy);
    if (Object.keys(fields).length > 0) {
      setErrors({ fields, form: copy.checkFields });
      emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await authClient.requestPasswordReset(email.trim());
      // Same message whether or not the account exists, so the form cannot be used to
      // find out which emails are registered.
      setErrors(NO_FORM_ERRORS);
      setSent(true);
    } catch (error) {
      const described = describeApiErrors(error, copy, INPUT_KEYS);
      setErrors(described);
      if (described.fields.email) emailRef.current?.focus();
      else alertRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title={copy.forgotTitle}>
      {sent ? (
        <p ref={statusRef} className="auth-status" role="status" tabIndex={-1}>
          {copy.forgotSent}
        </p>
      ) : (
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <p className="auth-hint">{copy.forgotHint}</p>
          <AuthAlert ref={alertRef} message={errors.form} />
          <AuthFormField
            ref={emailRef}
            label={copy.emailLabel}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            error={errors.fields.email}
          />
          <button type="submit" className="primary-button auth-submit" disabled={submitting}>
            {submitting ? copy.submitting : copy.forgotSubmit}
          </button>
        </form>
      )}
      <p className="auth-links">
        <Link to="/login">{copy.forgotBackToLogin}</Link>
      </p>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
