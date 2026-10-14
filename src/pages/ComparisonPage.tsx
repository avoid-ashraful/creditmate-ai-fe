import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

import CardComparisonTable from '../components/CardComparisonTable';
import Toast from '../components/Toast';
import { useAuth, AUTH_STATUS } from '../hooks/AuthProvider';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { useLanguage, getSavedCopy, getCommonCopy } from '../locales';
import { apiService } from '../services/api';
import { savedService, savedErrorMessage } from '../services/saved';
import { CreditCard } from '../types';
import '../styles/ComparisonPage.css';

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
  const [selectedCards, setSelectedCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comparisonId, setComparisonId] = useState<string>('');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');

  const saveComparison = async () => {
    if (status !== AUTH_STATUS.authenticated) {
      setSaveMessage(savedCopy.signIn);
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    const name = window.prompt(savedCopy.savePrompt);
    if (!name?.trim()) return;
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
      const queryParams = new URLSearchParams(location.search);
      const cardIds = queryParams.get('ids');
      const comparisonIdParam = queryParams.get('cid');

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

  const handleRemoveCard = (cardId: number) => {
    analytics.track(ANALYTICS_EVENTS.cardSelect, {
      cardId,
    });
    setSelectedCards(prev => prev.filter(card => card.id !== cardId));

    const remainingIds = selectedCards
      .filter(card => card.id !== cardId)
      .map(card => card.id)
      .join(',');

    if (remainingIds) {
      window.history.replaceState(null, '', `/compare?ids=${remainingIds}`);
    } else {
      window.history.replaceState(null, '', '/compare');
    }
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

  return (
    <div className="comparison-page">
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
                <button className="share-button" onClick={() => void saveComparison()}>
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

      <div className="comparison-content">
        {isLoading ? (
          <div className="loading-state" role="status" aria-live="polite">
            {common.loading}
          </div>
        ) : selectedCards.length === 0 ? (
          <div className="empty-state">
            <h2>{common.comparisonEmptyTitle}</h2>
            <p>{common.comparisonEmptyDesc}</p>
            <Link to="/" className="footer-button">
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
                      {/* Bank name would come from API - for now use bankId */}
                      <div className="card-chip-bank">Bank ID: {card.bankId}</div>
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

            <CardComparisonTable cards={selectedCards} highlightDifferences={true} />

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
    </div>
  );
};

export default ComparisonPage;
