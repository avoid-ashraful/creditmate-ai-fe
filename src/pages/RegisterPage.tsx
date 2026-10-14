import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthAlert, AuthCard } from '../components/AuthCard';
import { AuthFormField } from '../components/AuthFormField';
import { useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';
import {
  describeApiErrors,
  FormErrors,
  NO_FORM_ERRORS,
  requiredFieldErrors,
} from '../utils/authErrors';

const INPUT_KEYS = ['email', 'password', 'password_confirm'];

const RegisterPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>(NO_FORM_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = requiredFieldErrors(
      { email, password, password_confirm: passwordConfirm },
      copy
    );
    if (!fields.password_confirm && password !== passwordConfirm) {
      fields.password_confirm = copy.passwordsMismatch;
    }
    if (Object.keys(fields).length > 0) {
      setErrors({ fields, form: copy.checkFields });
      if (fields.email) emailRef.current?.focus();
      else if (fields.password) passwordRef.current?.focus();
      else confirmRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        passwordConfirm,
      });
      navigate('/login', { replace: true });
    } catch (error) {
      const described = describeApiErrors(error, copy, INPUT_KEYS);
      setErrors(described);
      if (described.fields.email) emailRef.current?.focus();
      else if (described.fields.password) passwordRef.current?.focus();
      else if (described.fields.password_confirm) confirmRef.current?.focus();
      else alertRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title={copy.registerTitle}>
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
          autoComplete="new-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          error={errors.fields.password}
        />
        <AuthFormField
          ref={confirmRef}
          label={copy.confirmPasswordLabel}
          type="password"
          name="password_confirm"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={event => setPasswordConfirm(event.target.value)}
          error={errors.fields.password_confirm}
        />
        <button type="submit" className="primary-button auth-submit" disabled={submitting}>
          {submitting ? copy.submitting : copy.registerSubmit}
        </button>
      </form>
      <p className="auth-links">
        {copy.registerHaveAccount} <Link to="/login">{copy.registerLoginLink}</Link>
      </p>
    </AuthCard>
  );
};

export default RegisterPage;
