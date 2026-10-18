import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AuthAlert, AuthCard } from '../components/AuthCard';
import { ResendVerification } from '../components/ResendVerification';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';
import { authClient } from '../services/auth';
import { describeApiErrors, FormErrors, NO_FORM_ERRORS } from '../utils/authErrors';

const INPUT_KEYS = ['token'];

/**
 * Verifies the user's email address using the token from the verification email.
 * The link format is `/verify-email?token=...` (the backend uses a signed token).
 */
const VerifyEmailPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [errors, setErrors] = useState<FormErrors>(NO_FORM_ERRORS);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const alertRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (token) {
      setStatus('loading');
      authClient
        .verifyEmail(token)
        .then(() => {
          setStatus('success');
        })
        .catch(error => {
          const described = describeApiErrors(error, copy, INPUT_KEYS);
          setErrors(described);
          setStatus('error');
        });
    } else {
      setStatus('error');
      setErrors({ fields: {}, form: copy.verifyInvalidLink });
    }
  }, [token, copy]);

  if (status === 'loading') {
    return (
      <AuthCard title={copy.verifyTitle}>
        <p className="auth-status" role="status" tabIndex={-1}>
          {copy.verifyLoading}
        </p>
      </AuthCard>
    );
  }

  if (status === 'success') {
    return (
      <AuthCard title={copy.verifyTitle}>
        <p ref={statusRef} className="auth-status" role="status" tabIndex={-1}>
          {copy.verifySuccess}
        </p>
        <p className="auth-links">
          <Link to="/login">Log in</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={copy.verifyTitle}>
      <AuthAlert ref={alertRef} message={errors.form ?? copy.verifyInvalidLink} />
      <ResendVerification />
      <p className="auth-links">
        <Link to="/login">Log in</Link> or <Link to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
};

export default VerifyEmailPage;
