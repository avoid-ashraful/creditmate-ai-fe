import { motion, AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { usePrefersReducedMotion } from '../animations';
import { useLanguage, getCommonCopy } from '../locales';
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
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const [compareMessage, setCompareMessage] = useState('');
  const reduceMotion = usePrefersReducedMotion();

  if (selectedCards.length === 0) {
    return null;
  }

  return (
    <GradientComparisonBar>
      <motion.div
        className="comparison-bar-content"
        initial={reduceMotion ? false : { y: 50, opacity: 0 }}
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
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <span className="card-name">{card.name}</span>
                  <motion.button
                    className="remove-card"
                    type="button"
                    onClick={() => onRemoveCard(card.id)}
                    title={common.comparisonRemoveAriaLabel}
                    aria-label={`${common.comparisonRemoveAriaLabel} ${card.name}`}
                    whileHover={reduceMotion ? undefined : { scale: 1.2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              ))}

              {Array.from({ length: maxSelections - selectedCards.length }).map((_, index) => (
                <motion.div
                  key={`empty-${index}`}
                  className="card-chip empty"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.1 }}
                  layout
                >
                  <span>{common.comparisonAddCard}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="comparison-actions">
          <motion.div
            whileHover={reduceMotion ? undefined : { scale: selectedCards.length >= 2 ? 1.05 : 1 }}
          >
            <Link
              to={`/compare?ids=${selectedCards.map(card => card.id).join(',')}`}
              className={`compare-button ${selectedCards.length < 2 ? 'disabled' : ''}`}
              aria-disabled={selectedCards.length < 2}
              onClick={e => {
                if (selectedCards.length < 2) {
                  e.preventDefault();
                  setCompareMessage(common.comparisonEmptyDesc);
                }
              }}
            >
              {common.comparisonFooterShare}
            </Link>
          </motion.div>
          <p className="compare-message" role="status" aria-live="polite">
            {compareMessage}
          </p>
        </div>
      </motion.div>
    </GradientComparisonBar>
  );
};

export default ComparisonBar;
