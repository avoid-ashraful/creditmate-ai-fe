import React from 'react';

import { dummyBanks } from '../dummy-data/credit-cards';
import { AnimatedCard, GradientButton, fadeInUp } from '../styles/StyledComponents';
import { CreditCard } from '../types';
import { slugify } from '../utils/slugify';

interface CardListItemProps {
  card: CreditCard;
  isSelected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
  onViewDetails?: (card: CreditCard) => void;
}

const CardListItem: React.FC<CardListItemProps> = ({
  card,
  isSelected = false,
  onSelect,
  selectable = false,
  onViewDetails,
}) => {
  const getBankName = (bankId: number | undefined): string => {
    if (card.bankName) return card.bankName;
    if (bankId !== undefined) {
      const bank = dummyBanks.find(b => b.id === bankId);
      return bank?.name || `Bank ID: ${bankId}`;
    }
    return 'Bank: Data not available';
  };

  const handleClick = () => {
    if (onViewDetails) {
      onViewDetails(card);
    }
  };

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect();
    }
  };

  // Helper to format annual fee with null handling
  const formatAnnualFee = (fee: number | null): string => {
    if (fee === null) return 'Data not available';
    return `BDT ${fee.toLocaleString()}`;
  };

  // Helper to format interest rate with null handling
  const formatInterestRate = (rate: number | null): string => {
    if (rate === null) return 'Data not available';
    return `${rate}% APR`;
  };

  return (
    <AnimatedCard
      className={`card-list-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5 }}
    >
      {card.images && card.images.length > 0 && (
        <div className="card-image">
          <img src={card.images[0].small} alt={card.name} />
        </div>
      )}

      <div className="card-header">
        <h3 className="card-name">{card.name}</h3>
        <span className="bank-name">{getBankName(card.bankId)}</span>
      </div>

      <div className="card-details">
        <div className="detail-row">
          <span className="detail-label">Annual Fee:</span>
          <span className="detail-value">{formatAnnualFee(card.annualFee)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Interest Rate:</span>
          <span className="detail-value">{formatInterestRate(card.interestRateApr)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Lounge Access:</span>
          <span className="detail-value">
            {card.loungeAccessInternational === null && card.loungeAccessDomestic === null
              ? 'Data not available'
              : ''}
            {card.loungeAccessInternational !== null && card.loungeAccessInternational !== ''
              ? `${card.loungeAccessInternational} (Int'l)`
              : ''}
            {card.loungeAccessInternational && card.loungeAccessDomestic ? ' / ' : ''}
            {card.loungeAccessDomestic !== null && card.loungeAccessDomestic !== ''
              ? `${card.loungeAccessDomestic} (Domestic)`
              : ''}
            {card.loungeAccessInternational === '' &&
            (card.loungeAccessDomestic === '' || card.loungeAccessDomestic === null)
              ? 'None'
              : ''}
            {card.loungeAccessDomestic === '' && card.loungeAccessInternational === null
              ? 'None'
              : ''}
          </span>
        </div>
      </div>

      <div className="card-rewards">
        <h4>Rewards</h4>
        <p>{card.rewardPointsPolicy}</p>
      </div>

      <div className="card-features">
        <h4>Key Features</h4>
        <ul className="feature-list">
          {card.additionalFeatures?.slice(0, 2).map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
          {card.additionalFeatures && card.additionalFeatures.length > 2 && (
            <li className="more-features">+{card.additionalFeatures.length - 2} more</li>
          )}
        </ul>
      </div>

      {card.bankName && (
        <a
          className="card-detail-link"
          href={`/card/${slugify(card.bankName)}/${slugify(card.name)}`}
          onClick={event => event.stopPropagation()}
        >
          Full card details
        </a>
      )}

      {selectable && (
        <div className="compare-button-container">
          <GradientButton
            className={`add-to-compare-btn ${isSelected ? 'in-list' : ''}`}
            onClick={handleAddToCompare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSelected ? 'Remove from Compare' : 'Add to Compare'}
          </GradientButton>
        </div>
      )}
    </AnimatedCard>
  );
};

export default CardListItem;
