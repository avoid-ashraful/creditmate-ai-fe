import React, { useState } from 'react';

import { CreditCard } from '../types';
import '../styles/CardDetailsPopup.css';

interface CardDetailsPopupProps {
  card: CreditCard;
  onClose: () => void;
  onAddToCompare: (card: CreditCard) => void;
  isInCompareList: boolean;
}

const CardDetailsPopup: React.FC<CardDetailsPopupProps> = ({
  card,
  onClose,
  onAddToCompare,
  isInCompareList,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Prevent clicks inside the popup from closing it
  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const nextImage = () => {
    if (card.images && card.images.length > 0) {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % card.images.length);
    }
  };

  const prevImage = () => {
    if (card.images && card.images.length > 0) {
      setCurrentImageIndex(prevIndex => (prevIndex - 1 + card.images.length) % card.images.length);
    }
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="card-details-popup" onClick={handlePopupClick}>
        <button className="close-button" onClick={onClose}>
          ×
        </button>

        {card.images && card.images.length > 0 && (
          <div className="card-image-gallery">
            <img
              src={card.images[currentImageIndex].full}
              alt={`${card.name} - Image ${currentImageIndex + 1}`}
              className="card-full-image"
            />
            {card.images.length > 1 && (
              <div className="image-navigation">
                <button onClick={prevImage} className="nav-button prev">
                  &lt;
                </button>
                <span className="image-counter">
                  {currentImageIndex + 1} / {card.images.length}
                </span>
                <button onClick={nextImage} className="nav-button next">
                  &gt;
                </button>
              </div>
            )}
          </div>
        )}

        <div className="popup-header">
          <h2>{card.name}</h2>
          <span className="bank-name">Bank ID: {card.bankId}</span>
        </div>

        <div className="popup-content">
          <div className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-row">
              <span className="detail-label">Annual Fee:</span>
              <span className="detail-value">BDT {card.annualFee.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Interest Rate:</span>
              <span className="detail-value">{card.interestRateApr}% APR</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Lounge Access</h3>
            <div className="detail-row">
              <span className="detail-label">International:</span>
              <span className="detail-value">
                {card.loungeAccessInternational > 0
                  ? `${card.loungeAccessInternational} visits per year`
                  : 'Not available'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Domestic:</span>
              <span className="detail-value">
                {card.loungeAccessDomestic > 0
                  ? `${card.loungeAccessDomestic} visits per year`
                  : 'Not available'}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Fees</h3>
            <div className="detail-row">
              <span className="detail-label">Cash Advance Fee:</span>
              <span className="detail-value">{card.cashAdvanceFee}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Late Payment Fee:</span>
              <span className="detail-value">{card.latePaymentFee}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Annual Fee Waiver</h3>
            <p>
              {card.annualFeeWaiverPolicy ? card.annualFeeWaiverPolicy.conditions : 'Not available'}
            </p>
          </div>

          <div className="detail-section">
            <h3>Rewards</h3>
            <p>{card.rewardPointsPolicy}</p>
          </div>

          <div className="detail-section">
            <h3>Additional Features</h3>
            <ul className="feature-list">
              {card.additionalFeatures.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h3>More Information</h3>
            <div className="detail-row">
              <span className="detail-label">Source:</span>
              <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
                Official Website
              </a>
            </div>
            <div className="detail-row">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">{card.lastUpdated.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="popup-footer">
          <button
            className={`add-to-compare-btn ${isInCompareList ? 'in-list' : ''}`}
            onClick={() => onAddToCompare(card)}
          >
            {isInCompareList ? 'Remove from Compare' : 'Add to Compare'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsPopup;
