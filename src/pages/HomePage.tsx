import { AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

import CardDetailsPopup from '../components/CardDetailsPopup';
import CardList from '../components/CardList';
import CategoryCard from '../components/CategoryCard';
import ComparisonBar from '../components/ComparisonBar';
import FilterPanel from '../components/FilterPanel';
import SearchAutocomplete from '../components/SearchAutocomplete';
import { SkeletonCardGrid } from '../components/Skeleton';
import Toast from '../components/Toast';
import { CATEGORIES } from '../config/categories';
import { apiService } from '../services/api';
import { CreditCard, Bank, CardFilterOptions } from '../types';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredCards, setFilteredCards] = useState<CreditCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewedCard, setViewedCard] = useState<CreditCard | null>(null);
  const [selectionMessage, setSelectionMessage] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch banks and credit cards in parallel
        const [banksResponse, cardsResponse] = await Promise.all([
          apiService.getBanks(),
          apiService.getCreditCards({ page_size: 100 }),
        ]);

        // Transform API responses to frontend types
        const transformedBanks = banksResponse.results.map(bank => apiService.transformBank(bank));
        const transformedCards = cardsResponse.results.map(card =>
          apiService.transformCreditCard(card)
        );

        setBanks(transformedBanks);
        setCards(transformedCards);
        setFilteredCards(transformedCards);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Keep empty arrays as fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCardSelect = (card: CreditCard) => {
    if (selectedCardIds.includes(card.id)) {
      setSelectionMessage('');
      setSelectedCardIds(prev => prev.filter(id => id !== card.id));
      return;
    }
    if (selectedCardIds.length >= 4) {
      setSelectionMessage('You can only select up to 4 cards for comparison.');
      return;
    }
    setSelectionMessage('');
    setSelectedCardIds(prev => [...prev, card.id]);
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

  const handleFilterChange = async (filters: CardFilterOptions) => {
    try {
      setIsLoading(true);

      // Use API filtering instead of client-side filtering
      const response = await apiService.getCreditCards({
        ...filters,
        page_size: 100,
      });

      const transformedCards = response.results.map(card => apiService.transformCreditCard(card));
      setFilteredCards(transformedCards);
    } catch (error) {
      console.error('Failed to filter cards:', error);
      // Fallback to showing all cards
      setFilteredCards(cards);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange({ searchTerm });
  };

  // Map a category facet slug to the appropriate filter options; falls back to
  // setting the search term so the existing filter logic picks it up.
  const applyCategoryFilter = (slug: string) => {
    const category = CATEGORIES.find(c => c.slug === slug);
    if (category) {
      setSearchTerm(category.filters.searchTerm ?? '');
      handleFilterChange({ ...category.filters });
    } else {
      // Unknown slug – treat as a plain text search
      setSearchTerm('');
      handleFilterChange({ searchTerm: '' });
    }
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Find Your Perfect Credit Card</h1>
          <p>
            Compare credit cards from top banks in Bangladesh and make informed financial decisions
          </p>

          <form className="search-form" onSubmit={handleSearchSubmit} role="search">
            <SearchAutocomplete
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={query => handleFilterChange({ searchTerm: query })}
              onSelectCard={card => {
                setSearchTerm(card.name);
                handleFilterChange({ searchTerm: card.name });
              }}
              onSelectBank={bank => {
                setSearchTerm(bank.name);
                handleFilterChange({ searchTerm: bank.name });
              }}
              onSelectCategory={category => applyCategoryFilter(category.slug)}
              onSelectFacet={facet => applyCategoryFilter(facet.slug)}
              placeholder="Search by card name, bank, or features..."
              ariaLabel="Search credit cards by name, bank, or features"
            />
            <button type="submit">Search</button>
          </form>

          <div className="category-grid">
            {CATEGORIES.map(category => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">{banks.length}</span>
            <span className="stat-label">Partner Banks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{cards.length}+</span>
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
            banks={banks}
            onFilterChange={handleFilterChange}
            initialFilters={{ searchTerm }}
          />
        </div>

        <div className="cards-content">
          {isLoading ? (
            <SkeletonCardGrid label="Loading credit cards..." />
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
              <AnimatePresence>
                {viewedCard && (
                  <CardDetailsPopup
                    key={viewedCard.id}
                    card={viewedCard}
                    onClose={handleCloseCardDetails}
                    onAddToCompare={handleAddToCompare}
                    isInCompareList={selectedCardIds.includes(viewedCard.id)}
                  />
                )}
              </AnimatePresence>

              {/* Comparison Bar */}
              <ComparisonBar
                selectedCards={cards.filter(card => selectedCardIds.includes(card.id))}
                onRemoveCard={handleRemoveFromCompare}
                maxSelections={4}
              />

              <Toast className="selection-message" message={selectionMessage} />
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
