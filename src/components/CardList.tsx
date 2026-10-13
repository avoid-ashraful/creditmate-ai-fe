import { motion } from 'framer-motion';
import React, { useState } from 'react';

import { staggerContainer, usePrefersReducedMotion } from '../animations';
import { GradientButton } from '../styles/StyledComponents';
import { CreditCard } from '../types';

import CardListItem from './CardListItem';
import Toast from './Toast';

interface CardListProps {
  cards: CreditCard[];
  onCardSelect?: (card: CreditCard) => void;
  selectedCardIds?: number[];
  maxSelections?: number;
  showSelectionIndicator?: boolean;
  onViewCardDetails?: (card: CreditCard) => void;
}

const CardList: React.FC<CardListProps> = ({
  cards,
  onCardSelect,
  selectedCardIds = [],
  maxSelections = 4,
  showSelectionIndicator = true,
  onViewCardDetails,
}) => {
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [selectionMessage, setSelectionMessage] = useState<string>('');
  const reduceMotion = usePrefersReducedMotion();

  if (!cards || cards.length === 0) {
    return (
      <motion.div
        className="no-results"
        role="status"
        initial={{ opacity: reduceMotion ? 1 : 0 }}
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
    <div className="card-list">
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

      <Toast className="selection-message" message={selectionMessage} />

      <motion.div
        className="cards-container"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
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
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GradientButton
            onClick={loadMore}
            whileHover={reduceMotion ? undefined : { scale: 1.05 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          >
            Load More ({cards.length - displayLimit} remaining)
          </GradientButton>
        </motion.div>
      )}
    </div>
  );
};

export default CardList;
