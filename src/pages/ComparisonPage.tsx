import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

import CardComparisonTable from '../components/CardComparisonTable';
import Toast from '../components/Toast';
import { PromptDialog, VerdictStrip } from '../components/ui';
import { useAuth, AUTH_STATUS } from '../hooks/AuthProvider';
import { useShortlist, type ShortlistItem } from '../hooks/ShortlistProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { compareVerdicts } from '../lib/verdicts';
import { useLanguage, getSavedCopy, getCommonCopy } from '../locales';
import { apiService } from '../services/api';
import { savedService, savedErrorMessage } from '../services/saved';
import { CreditCard } from '../types';
import '../styles/ComparisonPage.css';

const MAX_COMPARE = 4;

const ComparisonPage: React.FC = () => {
  useSeoMeta({
    title: 'Compare credit cards side by side | CreditMate AI',
    description:
      'Compare up to four credit cards side by side on annual fee, interest rate, lounge access and rewards.',
    canonicalPath: '/compare',
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { status } = useAuth();
  const { lang } = useLanguage();
  const savedCopy = getSavedCopy(lang);
  const common = getCommonCopy(lang);
  const shortlist = useShortlist();
  const [selectedCards, setSelectedCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comparisonId, setComparisonId] = useState<string>('');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveOpen, setSaveOpen] = useState<boolean>(false);
  const [differencesOnly, setDifferencesOnly] = useState<boolean>(false);
  const [addQuery, setAddQuery] = useState<string>('');
  const [addResults, setAddResults] = useState<CreditCard[]>([]);
  const [addSearched, setAddSearched] = useState<boolean>(false);

  const queryParams = new URLSearchParams(location.search);
  const hasComparisonParams = queryParams.has('ids') || queryParams.has('cid');

  const openSaveDialog = () => {
    if (status !== AUTH_STATUS.authenticated) {
      setSaveMessage(savedCopy.signIn);
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setSaveOpen(true);
  };

  const saveComparison = async (name: string) => {
    setSaveOpen(false);
    try {
      await savedService.createComparison({
        name: name.trim(),
        card_ids: selectedCards.map(card => card.id),
        is_public: false,
      });
      setSaveMessage(savedCopy.saved);
    } catch (error) {
      setSaveMessage(savedErrorMessage(error, lang));
    }
  };

  useEffect(() => {
    const fetchComparisonData = async () => {
      const params = new URLSearchParams(location.search);
      const cardIds = params.get('ids');
      const comparisonIdParam = params.get('cid');

      if (comparisonIdParam) {
        setComparisonId(comparisonIdParam);
      }

      if (cardIds) {
        setIsLoading(true);
        try {
          const response = await apiService.getCreditCards({
            ids: cardIds,
            page_size: 4,
          });

          const transformedCards = response.results.map(card =>
            apiService.transformCreditCard(card)
          );
          setSelectedCards(transformedCards);
          analytics.track(ANALYTICS_EVENTS.compareStart, {
            cardIds: transformedCards.map(card => card.id),
          });
        } catch (error) {
          console.error('Failed to fetch comparison cards:', error);
          setSelectedCards([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [location.search]);

  // Add-from-within search: the current selection stays in the URL, so
  // adding a card never loses the comparison already on screen.
  useEffect(() => {
    const query = addQuery.trim();
    if (query.length < 2) {
      setAddResults([]);
      setAddSearched(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await apiService.getCreditCards({
            searchTerm: query,
            page_size: 6,
          });
          if (cancelled) return;
          const selected = new Set(selectedCards.map(card => card.id));
          setAddResults(
            response.results
              .map(card => apiService.transformCreditCard(card))
              .filter(card => !selected.has(card.id))
          );
          setAddSearched(true);
        } catch {
          if (!cancelled) {
            setAddResults([]);
            setAddSearched(true);
          }
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [addQuery, selectedCards]);

  const handleRemoveCard = (cardId: number) => {
    analytics.track(ANALYTICS_EVENTS.cardSelect, {
      cardId,
    });
    const remaining = selectedCards.filter(card => card.id !== cardId);
    setSelectedCards(remaining);

    if (remaining.length) {
      navigate(`/compare?ids=${remaining.map(card => card.id).join(',')}`, { replace: true });
    } else {
      navigate('/compare', { replace: true });
    }
  };

  const handleAddCard = (cardId: number) => {
    const ids = [...selectedCards.map(card => card.id), cardId].slice(0, MAX_COMPARE);
    setAddQuery('');
    setAddResults([]);
    navigate(`/compare?ids=${ids.join(',')}`);
  };

  const generateShareableLink = () => {
    const cardIds = selectedCards.map(card => card.id).join(',');
    const currentId = comparisonId || Math.random().toString(36).substring(2, 10);
    analytics.track(ANALYTICS_EVENTS.compareShare, {
      cardIds: selectedCards.map(card => card.id),
    });
    const shareableUrl = `${window.location.origin}/compare?ids=${cardIds}&cid=${currentId}`;

    navigator.clipboard
      .writeText(shareableUrl)
      .then(() => {
        setShareMessage(common.comparisonShareSuccess);
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
        setShareMessage(common.comparisonShareError);
      });

    return shareableUrl;
  };

  // Verdict strip (plan Section 4.7): computed from the loaded cards'
  // published fields only — shared with the public shared pages.
  const verdictItems = compareVerdicts(selectedCards, {
    lowestFee: common.comparisonVerdictLowestFee,
    lowestApr: common.comparisonVerdictLowestApr,
  });

  const renderShortlistGroup = (heading: string, items: ShortlistItem[], discoveryPath: string) => (
    <section key={heading} aria-label={heading} className="workspace-group">
      <h2>{heading}</h2>
      {items.length === 0 ? (
        <p>
          <Link to={discoveryPath}>{common.comparisonAddFromDiscovery}</Link>
        </p>
      ) : (
        <ul className="cm-home-list">
          {items.map(item => (
            <li key={`${item.vertical}-${item.key}`}>
              <Link to={item.detailHref}>
                {item.name} · {item.bankName}
              </Link>{' '}
              <button
                type="button"
                className="workspace-remove"
                aria-label={`${common.comparisonRemoveAriaLabel} ${item.name}`}
                onClick={() => shortlist.remove(item.vertical, item.key)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const renderWorkspace = () => {
    const cards = shortlist.items.filter(item => item.vertical === 'cards');
    const deposits = shortlist.items.filter(item => item.vertical === 'deposits');
    const loans = shortlist.items.filter(item => item.vertical === 'loans');
    const accounts = shortlist.items.filter(item => item.vertical === 'accounts');
    return (
      <div className="comparison-workspace">
        <p className="cm-discovery-note">{common.comparisonWorkspaceIntro}</p>
        {shortlist.items.length === 0 ? (
          <div className="empty-state">
            <h2>{common.comparisonEmptyTitle}</h2>
            <p>{common.comparisonEmptyTeach}</p>
            <p>
              <Link to="/cards" className="workspace-cta">
                {common.comparisonBrowseCards}
              </Link>{' '}
              <Link to="/deposits">{common.comparisonGroupDeposits}</Link> ·{' '}
              <Link to="/loans">{common.comparisonGroupLoans}</Link> ·{' '}
              <Link to="/accounts">{common.comparisonGroupAccounts}</Link>
            </p>
          </div>
        ) : (
          <>
            {renderShortlistGroup(common.comparisonGroupCards, cards, '/cards')}
            {cards.length >= 2 ? (
              <p>
                <Link
                  to={`/compare?ids=${cards.map(item => item.key).join(',')}`}
                  className="workspace-cta"
                >
                  {common.comparisonCompareShortlisted} ({cards.length})
                </Link>
              </p>
            ) : cards.length === 1 ? (
              <p className="cm-discovery-note">{common.comparisonNeedTwoCards}</p>
            ) : null}
            {renderShortlistGroup(common.comparisonGroupDeposits, deposits, '/deposits')}
            {renderShortlistGroup(common.comparisonGroupLoans, loans, '/loans')}
            {renderShortlistGroup(common.comparisonGroupAccounts, accounts, '/accounts')}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="comparison-page">
      {hasComparisonParams ? (
        <div className="comparison-hero">
          <div className="comparison-header">
            <h1>{common.comparisonTitle}</h1>
            <div className="comparison-actions">
              <Link to="/" className="back-link">
                {common.comparisonBackLink}
              </Link>
              {selectedCards.length > 0 && (
                <>
                  <button className="share-button" onClick={generateShareableLink}>
                    {common.comparisonShareButton}
                  </button>
                  <button className="share-button" onClick={openSaveDialog}>
                    {savedCopy.save}
                  </button>
                </>
              )}
            </div>
          </div>
          <Toast className="share-status" message={shareMessage} />
          <p role="status" aria-live="polite">
            {saveMessage}
          </p>
        </div>
      ) : (
        <div className="workspace-header">
          <h1>{common.comparisonWorkspaceTitle}</h1>
          <Link to="/" className="workspace-back-link">
            {common.comparisonBackLink}
          </Link>
        </div>
      )}

      <div className="comparison-content">
        {!hasComparisonParams ? (
          renderWorkspace()
        ) : isLoading ? (
          <div className="loading-state" role="status" aria-live="polite">
            {common.loading}
          </div>
        ) : selectedCards.length === 0 ? (
          <div className="empty-state">
            <h2>{common.comparisonEmptyTitle}</h2>
            <p>{common.comparisonEmptyDesc}</p>
            <Link to="/cards" className="footer-button">
              {common.comparisonBrowseCards}
            </Link>
          </div>
        ) : (
          <>
            <div className="selected-cards-summary">
              <h2>
                {common.comparisonSelectedTitle}
                <span className="summary-count">{selectedCards.length}</span>
              </h2>
              <div className="card-chips">
                {selectedCards.map(card => (
                  <div key={card.id} className="card-chip">
                    <div className="card-chip-content">
                      <div className="card-chip-name">{card.name}</div>
                      <div className="card-chip-bank">{card.bankName || common.unknownBank}</div>
                    </div>
                    <button
                      className="remove-card"
                      onClick={() => handleRemoveCard(card.id)}
                      title={common.comparisonRemoveAriaLabel}
                      aria-label={`${common.comparisonRemoveAriaLabel} ${card.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {verdictItems.length > 0 ? <VerdictStrip items={verdictItems} /> : null}

            <div className="comparison-toolbar">
              <label className="differences-toggle">
                <input
                  type="checkbox"
                  checked={differencesOnly}
                  onChange={event => setDifferencesOnly(event.target.checked)}
                />
                {common.comparisonDifferencesOnlyLabel}
              </label>
              <button className="print-button" onClick={() => window.print()}>
                {common.comparisonPrintButton}
              </button>
            </div>

            <CardComparisonTable
              cards={selectedCards}
              highlightDifferences={true}
              differencesOnly={differencesOnly}
            />

            {selectedCards.length < MAX_COMPARE ? (
              <div className="comparison-add">
                <label htmlFor="compare-add-search">{common.comparisonAddSearchLabel}</label>
                <input
                  id="compare-add-search"
                  type="search"
                  value={addQuery}
                  placeholder={common.comparisonAddSearchPlaceholder}
                  onChange={event => setAddQuery(event.target.value)}
                />
                {addResults.length > 0 ? (
                  <ul className="cm-home-list">
                    {addResults.map(card => (
                      <li key={card.id}>
                        <button type="button" onClick={() => handleAddCard(card.id)}>
                          {card.name} · {card.bankName || common.unknownBank}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : addSearched ? (
                  <p className="cm-discovery-note">{common.comparisonAddNoResults}</p>
                ) : null}
              </div>
            ) : null}

            <div className="comparison-footer">
              <div className="footer-actions">
                <Link to="/" className="footer-button secondary">
                  {common.comparisonFooterBrowse}
                </Link>
                <button className="footer-button" onClick={generateShareableLink}>
                  {common.comparisonFooterShare}
                </button>
              </div>
              <div className="disclaimer">
                <strong>{common.comparisonDisclaimer}</strong>
              </div>
            </div>
          </>
        )}
      </div>

      <PromptDialog
        open={saveOpen}
        title={savedCopy.save}
        label={savedCopy.savePrompt}
        submitLabel={savedCopy.save}
        onSubmit={name => void saveComparison(name)}
        onCancel={() => setSaveOpen(false)}
      />
    </div>
  );
};

export default ComparisonPage;
