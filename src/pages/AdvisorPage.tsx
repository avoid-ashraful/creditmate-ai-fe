import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useShortlist } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import {
  AdvisorResponse,
  AdvisorSuggestedAction,
  askAdvisorStream,
} from '../services/advisor';

import './AdvisorPage.css';

interface ChatEntry {
  role: 'user' | 'advisor';
  text: string;
  response?: AdvisorResponse;
  savedActionKinds?: Set<string>;
}

const STARTERS = [
  'I travel twice a year — which cards give lounge access?',
  'Show me cards with no annual fee',
  'Compare the lowest-fee travel cards',
  'Which deposits have the best published rates?',
];

/** Minimal, safe markdown: paragraphs, "- " bullets and **bold** only. */
const renderMarkdown = (text: string): React.ReactNode[] =>
  text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split('\n').filter(Boolean);
    const renderInline = (line: string): React.ReactNode[] =>
      line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={j}>{part}</React.Fragment>
        )
      );
    if (lines.every(line => line.startsWith('- '))) {
      return (
        <ul key={i}>
          {lines.map((line, j) => (
            <li key={j}>{renderInline(line.slice(2))}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{lines.map((line, j) => <React.Fragment key={j}>{renderInline(line)}{j < lines.length - 1 ? <br /> : null}</React.Fragment>)}</p>;
  });

const AdvisorPage: React.FC = () => {
  useSeoMeta({
    title: 'Ask CreditMate — AI card advisor',
    description:
      'Ask CreditMate about Bangladeshi credit cards, deposits, loans and accounts. Answers are grounded in published catalogue data with citations.',
    canonicalPath: '/ask',
  });
  const { toggle, isInShortlist } = useShortlist();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || busy) return;
      setDraft('');
      setBusy(true);
      setEntries(prev => [...prev, { role: 'user', text: message }]);
      try {
        const response = await askAdvisorStream(message, sessionRef.current, () => undefined);
        sessionRef.current = response.session_id;
        setEntries(prev => [
          ...prev,
          { role: 'advisor', text: response.answer_markdown, response },
        ]);
        if (response.is_fallback) setUnavailable(false);
      } catch {
        // Advisor disabled (ADVISOR_ENABLED off) or unreachable: show the
        // designed fallback state rather than a dead chat box.
        setUnavailable(true);
        setEntries(prev => [
          ...prev,
          {
            role: 'advisor',
            text: 'The advisor is not available right now. You can still search the full catalogue — every card, deposit, loan and account is listed there with its published figures.',
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const runSuggestedAction = (entryIndex: number, action: AdvisorSuggestedAction) => {
    if (action.kind !== 'save_to_shortlist' || action.product_id == null) return;
    // Human confirmation pattern: the model only PROPOSED this. It runs
    // now because the user clicked, through the existing shortlist flow.
    const citation = entries[entryIndex].response?.citations.find(
      c => c.product_id === action.product_id
    );
    toggle({
      vertical: 'cards',
      key: String(action.product_id),
      name: citation?.label ?? action.label,
      bankName: '',
      detailHref: citation?.url_path ?? '/cards',
      cardId: action.product_id,
    });
    setEntries(prev =>
      prev.map((entry, i) => {
        if (i !== entryIndex || !entry.response) return entry;
        const saved = new Set(entry.savedActionKinds ?? []);
        saved.add(`${action.kind}:${action.product_id}`);
        return { ...entry, savedActionKinds: saved };
      })
    );
  };

  return (
    <main className="advisor-page">
      <section className="advisor-hero">
        <h1>Ask CreditMate</h1>
        <p>
          A natural-language advisor over CreditMate&apos;s published catalogue. Every figure it
          quotes comes from a live product page — follow the citations to check. The bank always
          makes the final decision on an application.
        </p>
      </section>

      {unavailable && (
        <div className="advisor-fallback-banner" role="status">
          The advisor is currently unavailable, so please use{' '}
          <Link to="/cards">normal search</Link> — it covers the same published data.
        </div>
      )}

      <section className="advisor-thread" aria-live="polite">
        {entries.length === 0 && (
          <div className="advisor-starters">
            <p>Try asking:</p>
            <div className="advisor-starter-row">
              {STARTERS.map(starter => (
                <button
                  key={starter}
                  type="button"
                  className="advisor-starter"
                  onClick={() => void send(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
        {entries.map((entry, i) => (
          <article key={i} className={`advisor-entry advisor-entry--${entry.role}`}>
            <div className="advisor-entry-body">{renderMarkdown(entry.text)}</div>
            {entry.response?.is_fallback && (
              <p className="advisor-fallback-note">
                Showing normal search results instead — the advisor could not complete this
                answer.
              </p>
            )}
            {entry.response && entry.response.citations.length > 0 && (
              <div className="advisor-citations" aria-label="Sources">
                {entry.response.citations.map((citation, j) => (
                  <Link
                    key={j}
                    className="advisor-citation-chip"
                    to={citation.url_path}
                  >
                    {citation.label}
                    {citation.field ? ` · ${citation.field.replace(/_/g, ' ')}` : ''}
                  </Link>
                ))}
              </div>
            )}
            {entry.response &&
              entry.response.suggested_actions.map((action, j) => {
                const key = `${action.kind}:${action.product_id}`;
                const already =
                  entry.savedActionKinds?.has(key) ||
                  (action.product_id != null && isInShortlist('cards', String(action.product_id)));
                return (
                  <div key={j} className="advisor-action-card">
                    <span>{action.label}</span>
                    <button
                      type="button"
                      disabled={already}
                      onClick={() => runSuggestedAction(i, action)}
                    >
                      {already ? 'Saved to shortlist' : 'Save to shortlist'}
                    </button>
                  </div>
                );
              })}
            {entry.response && entry.response.tool_trace.length > 0 && (
              <p className="advisor-trace">
                Tools used:{' '}
                {entry.response.tool_trace.map(t => t.tool).join(' → ')}
              </p>
            )}
          </article>
        ))}
        {busy && <p className="advisor-working">CreditMate is checking the catalogue…</p>}
      </section>

      <form
        className="advisor-composer"
        onSubmit={event => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <label className="advisor-composer-label" htmlFor="advisor-input">
          Ask about cards, deposits, loans or accounts
        </label>
        <div className="advisor-composer-row">
          <input
            id="advisor-input"
            type="text"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="e.g. I earn Tk 60,000 a month — which cards publish a minimum I meet?"
            maxLength={2000}
            disabled={busy}
          />
          <button type="submit" disabled={busy || !draft.trim()}>
            Ask
          </button>
        </div>
        <p className="advisor-note">
          Eligibility answers use only each product&apos;s published requirements and are
          estimates — never a promise of approval. Anything you type here about income is used
          for this answer only and is not stored.
        </p>
      </form>
    </main>
  );
};

export default AdvisorPage;
