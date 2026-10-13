import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { AUTH_STATUS, useAuth } from '../hooks/AuthProvider';
import { useLanguage } from '../locales';
import { getAuthCopy } from '../locales/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Renders its children only for a signed-in user. While the stored session is
 * being restored it shows a status line, and it sends anonymous visitors to
 * /login, remembering where they were headed in router state.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useAuth();
  const { lang } = useLanguage();
  const location = useLocation();

  if (status === AUTH_STATUS.loading) {
    return (
      <p className="auth-session-loading" role="status" aria-live="polite">
        {getAuthCopy(lang).sessionLoading}
      </p>
    );
  }

  if (status === AUTH_STATUS.anonymous) {
    return (
      <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
    );
  }

  return <>{children}</>;
};
