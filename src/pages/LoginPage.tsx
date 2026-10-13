import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthAlert, AuthCard } from '../components/AuthCard';
import { AuthFormField } from '../components/AuthFormField';
import { useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';
import { ApiError } from '../services/auth';
import {
  describeApiErrors,
  FormErrors,
  NO_FORM_ERRORS,
  requiredFieldErrors,
  safeReturnPath,
} from '../utils/authErrors';

const INPUT_KEYS = ['email', 'password'];

const LoginPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_FORM_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = requiredFieldErrors({ email, password }, copy);
    if (Object.keys(fields).length > 0) {
      setErrors({ fields, form: copy.checkFields });
      (fields.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const from = safeReturnPath((location.state as { from?: unknown } | null)?.from);
      navigate(from ?? '/account', { replace: true });
    } catch (error) {
      const described =
        error instanceof ApiError && error.status === 401
          ? { fields: {}, form: copy.loginInvalidCredentials }
          : describeApiErrors(error, copy, INPUT_KEYS);
      setErrors(described);
      if (described.fields.email) emailRef.current?.focus();
      else if (described.fields.password) passwordRef.current?.focus();
      else alertRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title={copy.loginTitle}>
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
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
        <AuthFormField
          ref={passwordRef}
          label={copy.passwordLabel}
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          error={errors.fields.password}
        />
        <button type="submit" className="primary-button auth-submit" disabled={submitting}>
          {submitting ? copy.submitting : copy.loginSubmit}
        </button>
      </form>
      <p className="auth-links">
        <Link to="/forgot-password">{copy.loginForgotLink}</Link>
      </p>
      <p className="auth-links">
        {copy.loginNoAccount} <Link to="/register">{copy.loginCreateLink}</Link>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
