import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

import { GradientComparisonBar } from '../styles/StyledComponents';
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
    <GradientComparisonBar>
      <motion.div
        className="comparison-bar-content"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="selected-cards">
          <div className="selected-count">
            <span>{selectedCards.length}</span>/{maxSelections}
          </div>

          <div className="card-chips">
            <AnimatePresence>
              {selectedCards.map(card => (
                <motion.div
                  key={card.id}
                  className="card-chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <span className="card-name">{card.name}</span>
                  <motion.button
                    className="remove-card"
                    onClick={() => onRemoveCard(card.id)}
                    title="Remove from comparison"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              ))}

              {Array.from({ length: maxSelections - selectedCards.length }).map((_, index) => (
                <motion.div
                  key={`empty-${index}`}
                  className="card-chip empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <span>Add a card</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="comparison-actions">
          <motion.div whileHover={{ scale: selectedCards.length >= 2 ? 1.05 : 1 }}>
            <Link
              to={`/compare?ids=${selectedCards.map(card => card.id).join(',')}`}
              className={`compare-button ${selectedCards.length < 2 ? 'disabled' : ''}`}
              onClick={e => {
                if (selectedCards.length < 2) {
                  e.preventDefault();
                  alert('Please select at least 2 cards to compare');
                }
              }}
            >
              Compare Cards
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </GradientComparisonBar>
  );
};

export default ComparisonBar;
