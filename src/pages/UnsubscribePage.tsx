/**
 * Public /unsubscribe?token= page.
 * Allows users to unsubscribe from all alert emails via a token link.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

import { useLanguage } from '../locales';
import { getAlertsCopy } from '../locales/alerts';
import { alertsClient } from '../services/alerts';
import { ALERT_KIND_LABELS, UnsubscribePreview } from '../types/alerts';
import '../styles/UnsubscribePage.css';

const UnsubscribePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const copy = getAlertsCopy(lang);

  const token = searchParams.get('token');
  type Status = 'loading' | 'ready' | 'submitting' | 'success' | 'error';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [preview, setPreview] = useState<UnsubscribePreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : copy.unsubscribeInvalidToken
  );

  const fail = (err: unknown) => {
    console.error('Unsubscribe failed:', err);
    setStatus('error');
    const httpStatus = (err as { status?: number } | null)?.status;
    setErrorMessage(
      httpStatus === 400 || httpStatus === 404
        ? copy.unsubscribeInvalidToken
        : copy.unsubscribeError
    );
  };

  // GET only describes the subscription, so link scanners and prefetch cannot unsubscribe anyone.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    alertsClient
      .getUnsubscribePreview(token)
      .then(data => {
        if (cancelled) return;
        setPreview(data);
        setStatus('ready');
      })
      .catch(err => {
        if (!cancelled) fail(err);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setStatus('submitting');
    try {
      await alertsClient.unsubscribe(token);
      setStatus('success');
    } catch (err) {
      fail(err);
    }
  };

  if (status === 'loading' || status === 'submitting') {
    return (
      <div className="unsubscribe-page" role="status" aria-live="polite">
        <div className="unsubscribe-container">
          <div className="loading-state">
            <div className="spinner" aria-hidden="true"></div>
            <p>{status === 'loading' ? copy.unsubscribeLoading : copy.unsubscribing}</p>
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
          ) : status === 'ready' && preview ? (
            <div className="confirm-state">
              <h1>{copy.unsubscribeTitle}</h1>
              <p>{copy.unsubscribeConfirmIntro}</p>
              <p>
                {copy.unsubscribeCardLine
                  .replace('{kind}', ALERT_KIND_LABELS[preview.kind]?.[lang] ?? preview.kind)
                  .replace('{card}', preview.card_name ?? copy.unsubscribeAnyCard)}
              </p>
              {!preview.is_active && <p>{copy.unsubscribeAlreadyOff}</p>}
              <button className="btn btn-primary" onClick={confirm}>
                {copy.unsubscribeButton}
              </button>
              <Link to="/" className="btn btn-secondary">
                {lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}
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
              {token && errorMessage !== copy.unsubscribeInvalidToken && (
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                  {copy.unsubscribeRetry}
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
