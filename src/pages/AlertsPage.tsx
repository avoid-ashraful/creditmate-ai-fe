/**
 * Protected /alerts settings page.
 * Lists subscriptions, allows managing preferences, and deleting subscriptions.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ChangeCard from '../components/ChangeCard';
import { Alert, Button, ConfirmDialog } from '../components/ui';
import { useAuth } from '../hooks/AuthProvider';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { useLanguage } from '../locales';
import { getAlertsCopy } from '../locales/alerts';
import { alertsClient } from '../services/alerts';
import { bankPath } from '../services/banks';
import {
  AlertSubscription,
  AlertPreferences,
  BankFollow,
  BankFollowFeedEntry,
  getAlertKindLabel,
} from '../types/alerts';
import '../styles/AlertsPage.css';

const AlertsPage: React.FC = () => {
  const { status } = useAuth();
  const { lang } = useLanguage();
  const copy = getAlertsCopy(lang);

  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [bankFollows, setBankFollows] = useState<BankFollow[]>([]);
  const [bankFollowsError, setBankFollowsError] = useState(false);
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [pendingSubscriptionDelete, setPendingSubscriptionDelete] =
    useState<AlertSubscription | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Bank-follow change feed (Phase 3): real field-history events for the
  // banks this user follows, paged by the API's has_more flag. Phase 4
  // adds the per-user seen watermark: entries arrive flagged is_new
  // against it, and displaying page 1 advances it (see loadFeed).
  const [feedEntries, setFeedEntries] = useState<BankFollowFeedEntry[]>([]);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState(false);
  const [feedSeenAt, setFeedSeenAt] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  // Followed banks (D4) load independently: a failure here must not take
  // the whole alerts page down, and must never masquerade as the honest
  // "you follow nothing" empty state — it gets its own error + retry.
  const loadBankFollows = async () => {
    try {
      const followsRes = await alertsClient.listBankFollows();
      setBankFollows(followsRes.results);
      setBankFollowsError(false);
    } catch (err) {
      console.error('Failed to load followed banks:', err);
      setBankFollowsError(true);
    }
  };

  const loadFeed = async (page: number) => {
    setFeedLoading(true);
    try {
      const res = await alertsClient.getBankFollowFeed(page);
      setFeedEntries(prev => (page === 1 ? res.results : [...prev, ...res.results]));
      setFeedPage(page);
      setFeedHasMore(res.has_more);
      setFeedError(false);
      if (page === 1) {
        setFeedSeenAt(res.seen_at);
        // The entries have been displayed: advance the watermark to the
        // newest change shown (the feed is newest-first, so that is the
        // first entry). Fire-and-forget — a failed mark only re-flags
        // the same items next visit; it must never break the feed.
        const newest = res.results[0]?.changed_at;
        void alertsClient.markBankFollowFeedSeen(newest).catch(() => undefined);
      }
    } catch (err) {
      console.error('Failed to load the bank-follow feed:', err);
      setFeedError(true);
    } finally {
      setFeedLoading(false);
    }
  };

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
      await loadBankFollows();
      await loadFeed(1);
    } catch (err) {
      console.error('Failed to load alerts data:', err);
      setError('Failed to load alert settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollowBank = async (bankId: number, bankName: string) => {
    try {
      await alertsClient.unfollowBank(bankId);
      setBankFollows(prev => prev.filter(follow => follow.bank !== bankId));
      // The feed is scoped to followed banks — refresh it so the
      // unfollowed bank's changes leave the list immediately.
      void loadFeed(1);
    } catch (err) {
      console.error(`Failed to unfollow ${bankName}:`, err);
      showToast(copy.followBankError, 'error');
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

  // One feed group: an optional heading + the delta-poster change cards.
  const renderFeedGroup = (
    entries: BankFollowFeedEntry[],
    heading: string | null,
    headingId: string
  ) =>
    entries.length === 0 ? null : (
      <div key={headingId}>
        {heading ? <h3 id={headingId}>{heading}</h3> : null}
        <div className="feed-cards">
          {entries.map(entry => (
            <ChangeCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    );

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
                    onClick={() => setPendingSubscriptionDelete(sub)}
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

        {/* Followed Banks Section (redesign Phase 2, D4 groundwork) */}
        <section
          className="alerts-section followed-banks-section"
          aria-labelledby="followed-banks-heading"
        >
          <h2 id="followed-banks-heading">{copy.followedBanksHeading}</h2>
          {bankFollowsError ? (
            <Alert variant="danger">
              <p>{copy.followedBanksLoadError}</p>
              <Button variant="ghost" onClick={() => void loadBankFollows()}>
                {copy.retry}
              </Button>
            </Alert>
          ) : bankFollows.length === 0 ? (
            <div className="empty-state">
              <p>{copy.noFollowedBanks}</p>
            </div>
          ) : (
            <ul className="subscriptions-list">
              {bankFollows.map(follow => (
                <li key={follow.id} className="subscription-item">
                  <div className="subscription-info">
                    <Link to={bankPath({ name: follow.bank_name })}>{follow.bank_name}</Link>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    aria-label={`${copy.unfollowBank}: ${follow.bank_name}`}
                    onClick={() => handleUnfollowBank(follow.bank, follow.bank_name)}
                  >
                    {copy.unfollowBank}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bank-follow change feed (Phase 3) */}
        <section className="alerts-section feed-section" aria-labelledby="follow-feed-heading">
          <h2 id="follow-feed-heading">{copy.feedHeading}</h2>
          <p className="empty-description">{copy.feedIntro}</p>
          {feedError && !bankFollowsError ? (
            <Alert variant="danger">
              <p>{copy.feedLoadError}</p>
              <Button variant="ghost" onClick={() => void loadFeed(1)}>
                {copy.retry}
              </Button>
            </Alert>
          ) : bankFollowsError ? null : bankFollows.length === 0 ? (
            <div className="empty-state">
              <p>{copy.feedNoFollows}</p>
            </div>
          ) : feedEntries.length === 0 && !feedLoading ? (
            <div className="empty-state">
              <p>{copy.feedNoChanges}</p>
            </div>
          ) : (
            <>
              {renderFeedGroup(
                feedSeenAt !== null ? feedEntries.filter(entry => entry.is_new) : [],
                copy.feedNewHeading,
                'feed-new-heading'
              )}
              {renderFeedGroup(
                feedSeenAt !== null ? feedEntries.filter(entry => !entry.is_new) : feedEntries,
                feedSeenAt !== null && feedEntries.some(entry => entry.is_new)
                  ? copy.feedEarlierHeading
                  : null,
                'feed-earlier-heading'
              )}
              {feedHasMore ? (
                <Button
                  variant="ghost"
                  disabled={feedLoading}
                  onClick={() => void loadFeed(feedPage + 1)}
                >
                  {copy.feedLoadMore}
                </Button>
              ) : null}
            </>
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

        <ConfirmDialog
          open={pendingSubscriptionDelete !== null}
          title={copy.deleteSubscriptionButton}
          message={copy.deleteConfirmation}
          confirmLabel={copy.deleteSubscriptionButton}
          onConfirm={() => {
            if (pendingSubscriptionDelete) {
              void handleDeleteSubscription(pendingSubscriptionDelete.id);
            }
            setPendingSubscriptionDelete(null);
          }}
          onCancel={() => setPendingSubscriptionDelete(null)}
        />
      </div>
    </div>
  );
};

export default AlertsPage;
