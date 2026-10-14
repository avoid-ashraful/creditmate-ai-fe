import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

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

const INPUT_KEYS = ['new_password', 'new_password_confirm'];

/**
 * Sets a new password from the link in the reset email (`?uid=...&token=...`).
 * The backend requires both uid and token from the URL, and expects
 * new_password and new_password_confirm in the request body.
 */
const ResetPasswordPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') ?? '';
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_FORM_ERRORS);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the confirmation once it is on screen, so it is read out.
  useEffect(() => {
    if (done) statusRef.current?.focus();
  }, [done]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = requiredFieldErrors(
      { new_password: newPassword, new_password_confirm: confirmPassword },
      copy
    );
    if (!fields.new_password_confirm && newPassword !== confirmPassword) {
      fields.new_password_confirm = copy.passwordsMismatch;
    }
    if (Object.keys(fields).length > 0) {
      setErrors({ fields, form: copy.checkFields });
      if (fields.new_password) passwordRef.current?.focus();
      else confirmRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await authClient.confirmPasswordReset({
        uid,
        token,
        newPassword,
        newPasswordConfirm: confirmPassword,
      });
      setErrors(NO_FORM_ERRORS);
      setDone(true);
    } catch (error) {
      const described = describeApiErrors(error, copy, INPUT_KEYS);
      setErrors(described);
      if (described.fields.new_password) passwordRef.current?.focus();
      else if (described.fields.new_password_confirm) confirmRef.current?.focus();
      else alertRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  if (!uid || !token) {
    return (
      <AuthCard title={copy.resetTitle}>
        <p className="auth-alert" role="alert">
          {copy.resetInvalidLink}
        </p>
        <p className="auth-links">
          <Link to="/forgot-password">{copy.resetRequestNewLink}</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={copy.resetTitle}>
      {done ? (
        <p ref={statusRef} className="auth-status" role="status" tabIndex={-1}>
          {copy.resetSuccess}
        </p>
      ) : (
        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <AuthAlert ref={alertRef} message={errors.form} />
          <AuthFormField
            ref={passwordRef}
            label={copy.newPasswordLabel}
            type="password"
            name="new_password"
            autoComplete="new-password"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            error={errors.fields.new_password}
          />
          <AuthFormField
            ref={confirmRef}
            label={copy.confirmPasswordLabel}
            type="password"
            name="new_password_confirm"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            error={errors.fields.new_password_confirm}
          />
          <button type="submit" className="primary-button auth-submit" disabled={submitting}>
            {submitting ? copy.submitting : copy.resetSubmit}
          </button>
        </form>
      )}
      <p className="auth-links">
        <Link to="/login">{copy.forgotBackToLogin}</Link>
      </p>
    </AuthCard>
  );
};

export default ResetPasswordPage;
