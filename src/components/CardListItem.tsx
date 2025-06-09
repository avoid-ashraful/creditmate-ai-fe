import React from 'react';
import { CreditCard } from '../types';

interface CardListItemProps {
  card: CreditCard;
  isSelected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

const CardListItem: React.FC<CardListItemProps> = ({
  card,
  isSelected = false,
  onSelect,
  selectable = false,
}) => {
  return (
    <div 
      className={`card-list-item ${isSelected ? 'selected' : ''} ${selectable ? 'selectable' : ''}`}
      onClick={selectable ? onSelect : undefined}
    >
      <div className="card-header">
        <h3 className="card-name">{card.name}</h3>
        <span className="bank-name">Bank ID: {card.bankId}</span>
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
            {(card.loungeAccessInternational === 0 && card.loungeAccessDomestic === 0) ? 'None' : ''}
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
        <div className="selection-indicator">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
          <span>{isSelected ? 'Selected' : 'Select'}</span>
        </div>
      )}
    </div>
  );
};

export default CardListItem;
