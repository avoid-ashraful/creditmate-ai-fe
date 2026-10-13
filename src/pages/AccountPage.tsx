import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';

/** Signed-in account summary. Rendered inside a ProtectedRoute. */
const AccountPage: React.FC = () => {
  const { lang } = useLanguage();
  const copy = getAuthCopy(lang);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
    void logout();
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
        <button type="button" className="secondary-button auth-submit" onClick={handleLogout}>
          {copy.headerLogout}
        </button>
      </section>
    </div>
  );
};

export default AccountPage;
