/**
 * Protected /alerts settings page.
 * Lists subscriptions, allows managing preferences, and deleting subscriptions.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { useLanguage } from '../locales';
import { getAlertsCopy } from '../locales/alerts';
import { alertsClient } from '../services/alerts';
import { AlertSubscription, AlertPreferences, getAlertKindLabel } from '../types/alerts';
import '../styles/AlertsPage.css';

const AlertsPage: React.FC = () => {
  const { status } = useAuth();
  const { lang } = useLanguage();
  const copy = getAlertsCopy(lang);

  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subsRes, prefsRes] = await Promise.all([
        alertsClient.listSubscriptions(),
        alertsClient.getPreferences(),
      ]);
      setSubscriptions(subsRes.results);
      setPreferences(prefsRes);
    } catch (err) {
      console.error('Failed to load alerts data:', err);
      setError('Failed to load alert settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFrequencyChange = (frequency: AlertPreferences['frequency']) => {
    setPreferences(prev => (prev ? { ...prev, frequency } : null));
  };

  const handleEmailToggle = () => {
    setPreferences(prev => (prev ? { ...prev, email_enabled: !prev.email_enabled } : null));
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      await alertsClient.updatePreferences(preferences);
      showToast(copy.preferencesSaved, 'success');
      analytics.track(ANALYTICS_EVENTS.pageView, { referrer: '/alerts' });
    } catch (err) {
      console.error('Failed to save preferences:', err);
      showToast(copy.preferencesUpdateError, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    if (!window.confirm(copy.deleteConfirmation)) return;
    setDeleteId(id);
    try {
      await alertsClient.deleteSubscription(id);
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      showToast(copy.subscriptionDeleted, 'success');
    } catch (err) {
      console.error('Failed to delete subscription:', err);
      showToast(copy.subscriptionDeleteError, 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (status === 'loading') {
    return (
      <div className="alerts-page" role="status" aria-live="polite">
        <div className="loading-state">
          <div className="spinner" aria-hidden="true"></div>
          <p>{copy.sessionLoading}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="alerts-page">
      <div className="alerts-container">
        <header className="alerts-header">
          <h1>{copy.alertsPageTitle}</h1>
          <p className="alerts-description">{copy.alertsPageDescription}</p>
        </header>

        {error && (
          <div className="alert-error" role="alert">
            {error}
          </div>
        )}

        {/* Subscriptions Section */}
        <section
          className="alerts-section subscriptions-section"
          aria-labelledby="subscriptions-heading"
        >
          <h2 id="subscriptions-heading">{copy.subscriptionsHeading}</h2>

          {isLoading && subscriptions.length === 0 ? (
            <div className="loading-state">
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading subscriptions…</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="empty-state">
              <p>{copy.noSubscriptions}</p>
              <p className="empty-description">{copy.noSubscriptionsDescription}</p>
              <Link to="/compare" className="btn btn-primary">
                {lang === 'bn' ? 'কার্ড বড়ুন' : 'Browse Cards'}
              </Link>
            </div>
          ) : (
            <ul className="subscriptions-list">
              {subscriptions.map(sub => (
                <li key={sub.id} className="subscription-card">
                  <div className="subscription-info">
                    <div className="subscription-kind">
                      <span className="kind-label">{copy.subscriptionKindLabel}:</span>
                      <span className="kind-value">{getAlertKindLabel(sub.kind, lang)}</span>
                    </div>
                    {sub.card && (
                      <div className="subscription-card-info">
                        <span className="card-label">{copy.subscriptionCardLabel}:</span>
                        <span className="card-value">
                          {sub.card_name
                            ? `${sub.card_name}${sub.bank_name ? ` (${sub.bank_name})` : ''}`
                            : `Card #${sub.card}`}
                        </span>
                      </div>
                    )}
                    <div className="subscription-date">
                      <span className="date-label">{copy.subscriptionCreatedLabel}:</span>
                      <span className="date-value">{formatDate(sub.created)}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger delete-btn"
                    onClick={() => handleDeleteSubscription(sub.id)}
                    disabled={deleteId === sub.id}
                    aria-label={`${copy.deleteSubscriptionButton} ${getAlertKindLabel(
                      sub.kind,
                      lang
                    )}`}
                  >
                    {deleteId === sub.id ? copy.deleting : copy.deleteSubscriptionButton}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Preferences Section */}
        {preferences && (
          <section
            className="alerts-section preferences-section"
            aria-labelledby="preferences-heading"
          >
            <h2 id="preferences-heading">{copy.preferencesHeading}</h2>

            <div className="preference-group">
              <label htmlFor="frequency" className="preference-label">
                {copy.frequencyLabel}
              </label>
              <select
                id="frequency"
                className="preference-select"
                value={preferences.frequency}
                onChange={e =>
                  handleFrequencyChange(e.target.value as AlertPreferences['frequency'])
                }
              >
                <option value="immediate">{copy.frequencyImmediate}</option>
                <option value="daily">{copy.frequencyDaily}</option>
                <option value="weekly">{copy.frequencyWeekly}</option>
              </select>
            </div>

            <div className="preference-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={handleEmailToggle}
                  className="checkbox-input"
                />
                <span className="checkbox-text">{copy.emailEnabledLabel}</span>
              </label>
              <p className="preference-description">{copy.emailEnabledDescription}</p>
            </div>

            <button
              className="btn btn-primary save-btn"
              onClick={handleSavePreferences}
              disabled={saving}
            >
              {saving ? copy.saving : copy.savePreferencesButton}
            </button>
          </section>
        )}

        {/* Toast */}
        {toast && (
          <div className={`toast toast-${toast.type}`} role="alert" aria-live="polite">
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
