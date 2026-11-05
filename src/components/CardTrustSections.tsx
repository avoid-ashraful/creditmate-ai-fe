/**
 * Trust sections for the card detail page:
 *
 * - `CardProvenance` — where this card's data comes from, its
 *   verification status and when it was last verified. Missing data is
 *   stated honestly (never invented).
 * - `CardHistoryTimeline` — the "What changed" timeline fed by the
 *   backend field-history endpoint. The endpoint is public (redesign
 *   decision D1), so every visitor sees the full dated history.
 */

import React, { useEffect, useState } from 'react';

import {
  useLanguage,
  getCardDetailCopy,
  getFieldHistoryLabel,
  getNetworkLabel,
  formatLocalizedDate,
  CardDetailCopy,
} from '../locales';
import {
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
  if (value === null || value === undefined) return copy.notPublished;
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

/** Only http(s) source URLs are safe to render as clickable links. */
const LINKABLE_SOURCE_URL = /^https?:\/\//i;

export const CardProvenance: React.FC<{ card: CreditCard }> = ({ card }) => {
  const { lang } = useLanguage();
  const copy = getCardDetailCopy(lang);
  const sourceUrl = card.sourceUrl;
  const linkableSource = !!sourceUrl && LINKABLE_SOURCE_URL.test(sourceUrl);

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
            {sourceUrl ? (
              linkableSource ? (
                <a
                  className="provenance-source-link"
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {sourceUrl}
                </a>
              ) : (
                sourceUrl
              )
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
  const { lang } = useLanguage();
  const copy = getCardDetailCopy(lang);
  const [state, setState] = useState<HistoryState>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    cardHistoryClient
      .getFieldHistory(cardId)
      .then(response => {
        if (cancelled) return;
        setState({ kind: 'ready', entries: response.results.map(transformFieldHistoryEntry) });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to load field history:', err);
        setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  return (
    <section className="history-section" aria-labelledby="history-heading">
      <h2 id="history-heading">{copy.historyHeading}</h2>
      <p className="history-intro">{copy.historyIntro}</p>

      {state.kind === 'loading' && (
        <p className="history-loading" role="status" aria-live="polite">
          {copy.historyLoading}
        </p>
      )}

      {state.kind === 'error' && (
        <p className="history-error" role="alert">
          {copy.historyError}
        </p>
      )}

      {state.kind === 'ready' && state.entries.length === 0 && (
        <p className="history-empty">{copy.historyEmpty}</p>
      )}

      {state.kind === 'ready' && state.entries.length > 0 && (
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
