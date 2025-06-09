import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, CardFilterOptions } from '../types';
import FilterPanel from '../components/FilterPanel';
import CardList from '../components/CardList';
import { dummyBanks, dummyCreditCards } from '../dummy-data/credit-cards';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<CreditCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

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
        return [...prev, card.id];
      }
    });
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
        return (
          card.name.toLowerCase().includes(term) ||
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
          <p>Compare credit cards from top banks in Bangladesh and make informed financial decisions</p>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search for cards by name or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
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
              />

              {selectedCardIds.length > 0 && (
                <div className="comparison-cta">
                  <p>
                    <span className="selected-count">{selectedCardIds.length}</span> cards selected
                  </p>
                  <Link 
                    to={`/compare?ids=${selectedCardIds.join(',')}`}
                    className="compare-button"
                  >
                    Compare Selected Cards
                  </Link>
                </div>
              )}
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
