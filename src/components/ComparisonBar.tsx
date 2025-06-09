import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from '../types';
import '../styles/ComparisonBar.css';

interface ComparisonBarProps {
  selectedCards: CreditCard[];
  onRemoveCard: (cardId: number) => void;
  maxSelections: number;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({
  selectedCards,
  onRemoveCard,
  maxSelections,
}) => {
  if (selectedCards.length === 0) {
    return null;
  }

  return (
    <div className="comparison-bar">
      <div className="comparison-bar-content">
        <div className="selected-cards">
          <div className="selected-count">
            <span>{selectedCards.length}</span>/{maxSelections}
          </div>
          
          <div className="card-chips">
            {selectedCards.map(card => (
              <div key={card.id} className="card-chip">
                <span className="card-name">{card.name}</span>
                <button 
                  className="remove-card" 
                  onClick={() => onRemoveCard(card.id)}
                  title="Remove from comparison"
                >
                  ×
                </button>
              </div>
            ))}
            
            {Array.from({ length: maxSelections - selectedCards.length }).map((_, index) => (
              <div key={`empty-${index}`} className="card-chip empty">
                <span>Add a card</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="comparison-actions">
          <Link 
            to={`/compare?ids=${selectedCards.map(card => card.id).join(',')}`}
            className={`compare-button ${selectedCards.length < 2 ? 'disabled' : ''}`}
            onClick={(e) => {
              if (selectedCards.length < 2) {
                e.preventDefault();
                alert('Please select at least 2 cards to compare');
              }
            }}
          >
            Compare Cards
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;