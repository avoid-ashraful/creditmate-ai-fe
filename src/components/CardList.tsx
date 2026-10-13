import { motion } from 'framer-motion';
import React, { useState } from 'react';

import { staggerContainer, GradientButton } from '../styles/StyledComponents';
import { CreditCard } from '../types';

import CardListItem from './CardListItem';

interface CardListProps {
  cards: CreditCard[];
  onCardSelect?: (card: CreditCard) => void;
  selectedCardIds?: number[];
  maxSelections?: number;
  showSelectionIndicator?: boolean;
  onViewCardDetails?: (card: CreditCard) => void;
  layout?: 'grid' | 'list';
}

const CardList: React.FC<CardListProps> = ({
  cards,
  onCardSelect,
  selectedCardIds = [],
  maxSelections = 4,
  showSelectionIndicator = true,
  onViewCardDetails,
  layout = 'grid',
}) => {
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [selectionMessage, setSelectionMessage] = useState<string>('');

  if (!cards || cards.length === 0) {
    return (
      <motion.div
        className="no-results"
        role="status"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h3>No credit cards found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </motion.div>
    );
  }

  const handleCardSelect = (card: CreditCard) => {
    if (onCardSelect) {
      // If card is already selected, allow deselection
      if (selectedCardIds.includes(card.id)) {
        setSelectionMessage('');
        onCardSelect(card);
        return;
      }

      // Otherwise, check if max selections reached
      if (selectedCardIds.length < maxSelections) {
        setSelectionMessage('');
        onCardSelect(card);
      } else {
        setSelectionMessage(`You can only select up to ${maxSelections} cards for comparison.`);
      }
    }
  };

  const loadMore = () => {
    setDisplayLimit(prev => prev + 10);
  };

  const displayedCards = cards.slice(0, displayLimit);

  return (
    <div className={`card-list ${layout}`}>
      <div className="list-header">
        <h2>Credit Cards ({cards.length})</h2>
        {showSelectionIndicator && maxSelections > 0 && (
          <div className="selection-indicator">
            <span>
              Selected: {selectedCardIds.length} of {maxSelections}
            </span>
          </div>
        )}
      </div>

      <p className="selection-message" role="status" aria-live="polite">
        {selectionMessage}
      </p>

      <motion.div
        className={`cards-container ${layout}`}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {displayedCards.map(card => (
          <CardListItem
            key={card.id}
            card={card}
            isSelected={selectedCardIds.includes(card.id)}
            onSelect={() => handleCardSelect(card)}
            selectable={!!onCardSelect}
            onViewDetails={onViewCardDetails}
          />
        ))}
      </motion.div>

      {displayLimit < cards.length && (
        <motion.div
          className="load-more"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GradientButton
            onClick={loadMore}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Load More ({cards.length - displayLimit} remaining)
          </GradientButton>
        </motion.div>
      )}
    </div>
  );
};

export default CardList;
