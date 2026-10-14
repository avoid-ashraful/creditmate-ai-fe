/**
 * Public /unsubscribe?token= page.
 * Allows users to unsubscribe from all alert emails via a token link.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

import { useLanguage } from '../locales';
import { getAlertsCopy } from '../locales/alerts';
import { alertsClient } from '../services/alerts';
import '../styles/UnsubscribePage.css';

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const copy = getAlertsCopy(lang);

  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage(copy.unsubscribeInvalidToken);
      return;
    }

    const unsubscribe = async () => {
      setStatus('loading');
      try {
        await alertsClient.unsubscribe(token);
        setStatus('success');
      } catch (err) {
        console.error('Unsubscribe failed:', err);
        setStatus('error');
        // Check if it's a 400/404 (invalid token) or other error
        if (err instanceof Error && 'status' in err) {
          const apiError = err as { status: number };
          if (apiError.status === 400 || apiError.status === 404) {
            setErrorMessage(copy.unsubscribeInvalidToken);
          } else {
            setErrorMessage(copy.unsubscribeError);
          }
        } else {
          setErrorMessage(copy.unsubscribeError);
        }
      }
    };

    unsubscribe();
  }, [token, lang, copy]);

  if (status === 'loading') {
    return (
      <div className="unsubscribe-page" role="status" aria-live="polite">
        <div className="unsubscribe-container">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true"></div>
            <p>{copy.unsubscribing}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unsubscribe-page">
      <div className="unsubscribe-container">
        <div className="unsubscribe-card">
          {status === 'success' ? (
            <div className="success-state">
              <div className="success-icon" aria-hidden="true">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1>{copy.unsubscribeSuccess}</h1>
              <p>{copy.unsubscribeDescription}</p>
              <Link to="/alerts" className="btn btn-primary">
                {copy.backToSettings}
              </Link>
            </div>
          ) : (
            <div className="error-state">
              <div className="error-icon" aria-hidden="true">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h1>{copy.unsubscribeTitle}</h1>
              <p>{errorMessage || copy.unsubscribeError}</p>
              {token && (
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                  {copy.unsubscribeButton}
                </button>
              )}
              <Link to="/" className="btn btn-secondary">
                {lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;
