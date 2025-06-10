import React, { useState, useEffect } from 'react';

import CardDetailsPopup from '../components/CardDetailsPopup';
import CardList from '../components/CardList';
import ComparisonBar from '../components/ComparisonBar';
import FilterPanel from '../components/FilterPanel';
import { dummyBanks, dummyCreditCards } from '../dummy-data/credit-cards';
import { CreditCard, CardFilterOptions } from '../types';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<CreditCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewedCard, setViewedCard] = useState<CreditCard | null>(null);

  useEffect(() => {
    // Simulate API call to fetch cards
    const fetchCards = () => {
      setIsLoading(true);
      setTimeout(() => {
        setCards(dummyCreditCards);
        setFilteredCards(dummyCreditCards);
        setIsLoading(false);
      }, 500); // Simulate network delay
    };

    fetchCards();
  }, []);

  const handleCardSelect = (card: CreditCard) => {
    setSelectedCardIds(prev => {
      if (prev.includes(card.id)) {
        return prev.filter(id => id !== card.id);
      } else {
        // Check if we've reached the maximum number of selections
        if (prev.length >= 4) {
          alert('You can only select up to 4 cards for comparison');
          return prev;
        }
        return [...prev, card.id];
      }
    });
  };

  const handleViewCardDetails = (card: CreditCard) => {
    setViewedCard(card);
  };

  const handleCloseCardDetails = () => {
    setViewedCard(null);
  };

  const handleAddToCompare = (card: CreditCard) => {
    handleCardSelect(card);
    // Don't close the popup so user can see the "Added to Compare" state
  };

  const handleRemoveFromCompare = (cardId: number) => {
    setSelectedCardIds(prev => prev.filter(id => id !== cardId));
  };

  const handleFilterChange = (filters: CardFilterOptions) => {
    let result = [...cards];

    // Apply bank filter
    if (filters.bankIds && filters.bankIds.length > 0) {
      result = result.filter(card => filters.bankIds?.includes(card.bankId));
    }

    // Apply annual fee range
    if (filters.minAnnualFee !== undefined) {
      result = result.filter(card => card.annualFee >= (filters.minAnnualFee || 0));
    }
    if (filters.maxAnnualFee !== undefined) {
      result = result.filter(card => card.annualFee <= (filters.maxAnnualFee || Infinity));
    }

    // Apply interest rate range
    if (filters.minInterestRate !== undefined) {
      result = result.filter(card => card.interestRateApr >= (filters.minInterestRate || 0));
    }
    if (filters.maxInterestRate !== undefined) {
      result = result.filter(card => card.interestRateApr <= (filters.maxInterestRate || Infinity));
    }

    // Apply lounge access filters
    if (filters.hasInternationalLounge) {
      result = result.filter(card => card.loungeAccessInternational > 0);
    }
    if (filters.hasDomesticLounge) {
      result = result.filter(card => card.loungeAccessDomestic > 0);
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(card => {
        const bank = dummyBanks.find(b => b.id === card.bankId);
        const bankName = bank?.name || '';

        return (
          card.name.toLowerCase().includes(term) ||
          bankName.toLowerCase().includes(term) ||
          card.rewardPointsPolicy.toLowerCase().includes(term) ||
          card.additionalFeatures.some(feature => feature.toLowerCase().includes(term))
        );
      });
    }

    setFilteredCards(result);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ searchTerm });
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Find Your Perfect Credit Card</h1>
          <p>
            Compare credit cards from top banks in Bangladesh and make informed financial decisions
          </p>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by card name, bank, or features..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">{dummyBanks.length}</span>
            <span className="stat-label">Partner Banks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{dummyCreditCards.length}+</span>
            <span className="stat-label">Credit Cards</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Expert Support</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Free Service</span>
          </div>
        </div>
      </section>

      <section className="main-content">
        <div className="filter-sidebar">
          <FilterPanel
            banks={dummyBanks}
            onFilterChange={handleFilterChange}
            initialFilters={{ searchTerm }}
          />
        </div>

        <div className="cards-content">
          {isLoading ? (
            <div className="loading-state">Loading credit cards...</div>
          ) : (
            <>
              <CardList
                cards={filteredCards}
                onCardSelect={handleCardSelect}
                selectedCardIds={selectedCardIds}
                maxSelections={4}
                onViewCardDetails={handleViewCardDetails}
              />

              {/* Card Details Popup */}
              {viewedCard && (
                <CardDetailsPopup
                  card={viewedCard}
                  onClose={handleCloseCardDetails}
                  onAddToCompare={handleAddToCompare}
                  isInCompareList={selectedCardIds.includes(viewedCard.id)}
                />
              )}

              {/* Comparison Bar */}
              <ComparisonBar
                selectedCards={cards.filter(card => selectedCardIds.includes(card.id))}
                onRemoveCard={handleRemoveFromCompare}
                maxSelections={4}
              />
            </>
          )}
        </div>
      </section>

      <section className="benefits-section">
        <h2>Why Use CreditMate AI?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">📊</div>
            <h3>Clear Comparisons</h3>
            <p>Side-by-side comparisons of key features, fees, and benefits.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">💰</div>
            <h3>Find the Best Value</h3>
            <p>Easily identify cards with the lowest fees and best rewards for your needs.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">🔍</div>
            <h3>Comprehensive Data</h3>
            <p>Detailed information from all major banks in Bangladesh.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon">📱</div>
            <h3>Mobile Friendly</h3>
            <p>Research and compare credit cards on any device.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
