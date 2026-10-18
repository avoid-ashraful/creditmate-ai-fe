import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthAlert } from '../components/AuthCard';
import { AuthCheckbox } from '../components/AuthCheckbox';
import { AuthFormField } from '../components/AuthFormField';
import { ResendVerification } from '../components/ResendVerification';
import { useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';
import { ApiError, authClient } from '../services/auth';
import { describeApiErrors } from '../utils/authErrors';

const EXPORT_FILENAME = 'creditmate-data.json';

/** Save JSON as a file through a temporary object URL. */
const downloadJson = (data: unknown) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = EXPORT_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** Signed-in account summary. Rendered inside a ProtectedRoute. */
const AccountPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [marketing, setMarketing] = useState(user?.profile?.marketing_opt_in ?? false);
  const [marketingBusy, setMarketingBusy] = useState(false);
  const [marketingNote, setMarketingNote] = useState<{ text: string; failed: boolean } | null>(
    null
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [deleteFieldErrors, setDeleteFieldErrors] = useState<Record<string, string>>({});
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const understoodRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    navigate('/');
    void logout();
  };

  const handleMarketingChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    setMarketingBusy(true);
    setMarketingNote(null);
    try {
      const updated = await authClient.updateMe({ profile: { marketing_opt_in: next } });
      setMarketing(updated.profile?.marketing_opt_in ?? next);
      setMarketingNote({ text: copy.accountMarketingSaved, failed: false });
    } catch (error) {
      setMarketingNote({
        text: describeApiErrors(error, copy, []).form ?? copy.genericError,
        failed: true,
      });
    } finally {
      setMarketingBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      downloadJson(await authClient.exportData());
    } catch (error) {
      setExportError(describeApiErrors(error, copy, []).form ?? copy.genericError);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields: Record<string, string> = {};
    if (!password) fields.password = copy.fieldRequired;
    if (!understood) fields.understood = copy.accountDeleteConfirmRequired;
    setDeleteError(null);
    setDeleteFieldErrors(fields);
    if (fields.password) return passwordRef.current?.focus();
    if (fields.understood) return understoodRef.current?.focus();

    setDeleting(true);
    try {
      await authClient.deleteAccount(password);
      // Navigate first: clearing the session would otherwise bounce this protected page to /login.
      navigate('/', { replace: true, state: { notice: copy.accountDeleted } });
      authClient.clearLocalSession();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && error.fieldErrors.password) {
        setDeleteFieldErrors({ password: copy.accountDeleteWrongPassword });
        passwordRef.current?.focus();
      } else {
        setDeleteError(describeApiErrors(error, copy, []).form);
        alertRef.current?.focus();
      }
      setDeleting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>{copy.accountTitle}</h1>
        {user && (
          <p className="auth-account-email">
            <span className="auth-hint">{copy.accountEmailLabel}</span>{' '}
            <strong>{user.email}</strong>
          </p>
        )}
        {user && user.profile?.email_verified === false && (
          <div className="auth-section">
            <p className="auth-hint">{copy.accountUnverified}</p>
            <ResendVerification email={user.email} />
          </div>
        )}

        <div className="auth-section">
          <AuthCheckbox
            checked={marketing}
            disabled={marketingBusy}
            onChange={handleMarketingChange}
          >
            {copy.accountMarketingLabel}
          </AuthCheckbox>
          <p
            className={marketingNote?.failed ? 'auth-field-error' : 'auth-hint'}
            role={marketingNote?.failed ? 'alert' : 'status'}
          >
            {marketingNote?.text}
          </p>
        </div>

        <section className="auth-section" aria-labelledby="account-export-heading">
          <h2 id="account-export-heading">{copy.accountExportHeading}</h2>
          <p className="auth-hint">{copy.accountExportHint}</p>
          <button
            type="button"
            className="secondary-button"
            disabled={exporting}
            onClick={handleExport}
          >
            {exporting ? copy.submitting : copy.accountExportButton}
          </button>
          <p className="auth-field-error" role="alert">
            {exportError}
          </p>
        </section>

        <button type="button" className="secondary-button auth-submit" onClick={handleLogout}>
          {copy.headerLogout}
        </button>

        <section
          className="auth-section auth-section--danger"
          aria-labelledby="account-delete-heading"
        >
          <h2 id="account-delete-heading">{copy.accountDeleteHeading}</h2>
          <p className="auth-hint">{copy.accountDeleteWarning}</p>
          <form className="auth-form" noValidate onSubmit={handleDelete}>
            <AuthAlert ref={alertRef} message={deleteError} />
            <AuthFormField
              ref={passwordRef}
              label={copy.passwordLabel}
              type="password"
              name="delete-password"
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              error={deleteFieldErrors.password}
            />
            <AuthCheckbox
              ref={understoodRef}
              checked={understood}
              onChange={event => setUnderstood(event.target.checked)}
              error={deleteFieldErrors.understood}
              required
            >
              {copy.accountDeleteConfirmLabel}
            </AuthCheckbox>
            <button
              type="submit"
              className="secondary-button auth-danger-button"
              disabled={deleting}
            >
              {deleting ? copy.submitting : copy.accountDeleteSubmit}
            </button>
          </form>
        </section>
      </section>
    </div>
  );
};

export default AccountPage;
