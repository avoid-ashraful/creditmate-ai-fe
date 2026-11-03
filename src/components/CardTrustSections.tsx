/**
 * Trust sections for the card detail page:
 *
 * - `CardProvenance` — where this card's data comes from, its
 *   verification status and when it was last verified. Missing data is
 *   stated honestly (never invented).
 * - `CardHistoryTimeline` — the "What changed" timeline fed by the
 *   backend field-history endpoint. That endpoint requires
 *   authentication, so signed-out visitors get a login prompt instead.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/AuthProvider';
import {
  useLanguage,
  getCardDetailCopy,
  getFieldHistoryLabel,
  getNetworkLabel,
  formatLocalizedDate,
  CardDetailCopy,
} from '../locales';
import {
  ApiError,
  cardHistoryClient,
  transformFieldHistoryEntry,
  FieldHistoryEntry,
} from '../services/cardHistory';
import { CreditCard } from '../types';

import './CardTrustSections.css';

/** Tracked fields whose values are BDT amounts (formatted as currency). */
const MONEY_FIELDS = new Set(['annual_fee', 'min_monthly_income', 'reward_point_value_bdt']);

/** Display label for a card's verification status value. */
export function verificationStatusLabel(copy: CardDetailCopy, status?: string): string {
  switch ((status ?? '').toLowerCase()) {
    case 'verified':
      return copy.provenanceStatusVerified;
    case 'needs_review':
      return copy.provenanceStatusNeedsReview;
    case 'draft':
      return copy.provenanceStatusDraft;
    case '':
      return copy.provenanceStatusUnknown;
    default:
      return status as string;
  }
}

/** Format one history value (old or new) for display. */
export function formatHistoryValue(
  copy: CardDetailCopy,
  fieldName: string,
  value: unknown
): string {
  if (value === null || value === undefined) return copy.unknown;
  if (value === '') return copy.none;
  if (typeof value === 'boolean') {
    if (fieldName === 'is_active') return value ? copy.statusActive : copy.statusInactive;
    return value ? copy.yes : copy.no;
  }
  if (Array.isArray(value)) {
    if (!value.length) return copy.none;
    return value.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  if (fieldName === 'verification_status') {
    return verificationStatusLabel(copy, String(value));
  }
  if (fieldName === 'card_network') {
    return getNetworkLabel(copy, String(value)) ?? String(value);
  }
  if (MONEY_FIELDS.has(fieldName)) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `${copy.bdt} ${amount.toLocaleString()}` : String(value);
  }
  if (fieldName === 'interest_rate_apr') {
    const apr = Number(value);
    return Number.isFinite(apr) ? `${apr}%` : String(value);
  }
  return String(value);
}

export const CardProvenance: React.FC<{ card: CreditCard }> = ({ card }) => {
  const { lang } = useLanguage();
  const copy = getCardDetailCopy(lang);

  return (
    <section className="provenance-section" aria-labelledby="provenance-heading">
      <h2 id="provenance-heading">{copy.provenanceHeading}</h2>
      <p className="provenance-intro">{copy.provenanceIntro}</p>
      <dl className="provenance-list">
        <div className="provenance-row">
          <dt>{copy.provenanceStatusLabel}</dt>
          <dd>{verificationStatusLabel(copy, card.verificationStatus)}</dd>
        </div>
        <div className="provenance-row">
          <dt>{copy.provenanceSourceLabel}</dt>
          <dd>
            {card.sourceUrl ? (
              <a
                className="provenance-source-link"
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {card.sourceUrl}
              </a>
            ) : (
              copy.provenanceSourceMissing
            )}
          </dd>
        </div>
        <div className="provenance-row">
          <dt>{copy.provenanceLastVerifiedLabel}</dt>
          <dd>
            {card.verifiedAt
              ? formatLocalizedDate(card.verifiedAt, lang)
              : copy.provenanceNotVerifiedYet}
          </dd>
        </div>
      </dl>
    </section>
  );
};

/** Both trust sections together; default export for React.lazy splitting. */
const CardTrustSections: React.FC<{ card: CreditCard }> = ({ card }) => (
  <>
    <CardProvenance card={card} />
    <CardHistoryTimeline cardId={card.id} />
  </>
);

export default CardTrustSections;

type HistoryState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; entries: FieldHistoryEntry[] }
  | { kind: 'error' };

export const CardHistoryTimeline: React.FC<{ cardId: number }> = ({ cardId }) => {
  const { status: authStatus } = useAuth();
  const { lang } = useLanguage();
  const copy = getCardDetailCopy(lang);
  const [state, setState] = useState<HistoryState>({ kind: 'idle' });
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    let cancelled = false;
    setState({ kind: 'loading' });
    setNeedsLogin(false);
    cardHistoryClient
      .getFieldHistory(cardId)
      .then(response => {
        if (cancelled) return;
        setState({ kind: 'ready', entries: response.results.map(transformFieldHistoryEntry) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setNeedsLogin(true);
          setState({ kind: 'idle' });
          return;
        }
        console.error('Failed to load field history:', err);
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus, cardId]);

  const showLoginPrompt = authStatus !== 'authenticated' || needsLogin;

  return (
    <section className="history-section" aria-labelledby="history-heading">
      <h2 id="history-heading">{copy.historyHeading}</h2>
      <p className="history-intro">{copy.historyIntro}</p>

      {showLoginPrompt && (
        <p className="history-login-prompt">
          {copy.historyLoginPrompt}{' '}
          <Link to="/login" className="history-login-link">
            {copy.historyLoginLink}
          </Link>
        </p>
      )}

      {!showLoginPrompt && state.kind === 'loading' && (
        <p className="history-loading" role="status" aria-live="polite">
          {copy.historyLoading}
        </p>
      )}

      {!showLoginPrompt && state.kind === 'error' && (
        <p className="history-error" role="alert">
          {copy.historyError}
        </p>
      )}

      {!showLoginPrompt && state.kind === 'ready' && state.entries.length === 0 && (
        <p className="history-empty">{copy.historyEmpty}</p>
      )}

      {!showLoginPrompt && state.kind === 'ready' && state.entries.length > 0 && (
        <ol className="history-timeline">
          {state.entries.map(entry => (
            <li key={entry.id} className="history-item">
              <p className="history-field">{getFieldHistoryLabel(lang, entry.fieldName)}</p>
              <p className="history-change">
                <span className="history-old">
                  {formatHistoryValue(copy, entry.fieldName, entry.oldValue)}
                </span>{' '}
                <span aria-hidden="true">→</span>{' '}
                <span className="history-new">
                  {formatHistoryValue(copy, entry.fieldName, entry.newValue)}
                </span>
              </p>
              <time className="history-date" dateTime={entry.changedAt.toISOString()}>
                {formatLocalizedDate(entry.changedAt, lang)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
