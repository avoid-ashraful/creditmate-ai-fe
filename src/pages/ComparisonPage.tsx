import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

import CardComparisonTable from '../components/CardComparisonTable';
import { ANALYTICS_EVENTS, analytics } from '../lib/analytics';
import { apiService } from '../services/api';
import { CreditCard } from '../types';
import '../styles/ComparisonPage.css';

const ComparisonPage: React.FC = () => {
  const location = useLocation();
  const [selectedCards, setSelectedCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [comparisonId, setComparisonId] = useState<string>('');

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
        alert('Comparison link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
      });

    return shareableUrl;
  };

  return (
    <div className="comparison-page">
      <div className="comparison-hero">
        <div className="comparison-header">
          <h1>Credit Card Comparison</h1>
          <div className="comparison-actions">
            <Link to="/" className="back-link">
              ← Back to All Cards
            </Link>
            {selectedCards.length > 0 && (
              <button className="share-button" onClick={generateShareableLink}>
                Share Comparison
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="comparison-content">
        {isLoading ? (
          <div className="loading-state">Loading comparison data...</div>
        ) : selectedCards.length === 0 ? (
          <div className="empty-state">
            <h2>No Cards Selected</h2>
            <p>Please select credit cards to compare from the home page.</p>
            <Link to="/" className="footer-button">
              Browse Credit Cards
            </Link>
          </div>
        ) : (
          <>
            <div className="selected-cards-summary">
              <h2>
                Comparing Cards
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
                      title="Remove from comparison"
                      aria-label={`Remove ${card.name} from comparison`}
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
                  Browse More Cards
                </Link>
                <button className="footer-button" onClick={generateShareableLink}>
                  Share This Comparison
                </button>
              </div>
              <div className="disclaimer">
                <strong>Disclaimer:</strong> This information is provided for comparison purposes
                only. Please verify all details with the respective banks before applying for any
                credit card. Terms and conditions may apply.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;
