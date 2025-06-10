import React from 'react';

import { dummyBanks } from '../dummy-data/credit-cards';
import { AnimatedCard, GradientButton, fadeInUp } from '../styles/StyledComponents';
import { CreditCard } from '../types';

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
  const getBankName = (bankId: number): string => {
    const bank = dummyBanks.find(b => b.id === bankId);
    return bank?.name || `Bank ID: ${bankId}`;
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
          <span className="detail-value">BDT {card.annualFee.toLocaleString()}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Interest Rate:</span>
          <span className="detail-value">{card.interestRateApr}% APR</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Lounge Access:</span>
          <span className="detail-value">
            {card.loungeAccessInternational > 0 ? `${card.loungeAccessInternational} Int'l` : ''}
            {card.loungeAccessInternational > 0 && card.loungeAccessDomestic > 0 ? ' / ' : ''}
            {card.loungeAccessDomestic > 0 ? `${card.loungeAccessDomestic} Domestic` : ''}
            {card.loungeAccessInternational === 0 && card.loungeAccessDomestic === 0 ? 'None' : ''}
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
          {card.additionalFeatures.slice(0, 2).map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
          {card.additionalFeatures.length > 2 && (
            <li className="more-features">+{card.additionalFeatures.length - 2} more</li>
          )}
        </ul>
      </div>

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
