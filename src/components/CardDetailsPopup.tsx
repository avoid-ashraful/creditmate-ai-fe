import { motion } from 'framer-motion';
import React, { useRef, useState } from 'react';

import { backdropVariants, modalPanelVariants, usePrefersReducedMotion } from '../animations';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useLanguage, getCommonCopy } from '../locales';
import { CreditCard } from '../types';
import { trapTabKey } from '../utils/focus';
import { slugify } from '../utils/slugify';
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
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const reduceMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useDialogFocus(dialogRef, closeButtonRef);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (dialogRef.current) {
      trapTabKey(event, dialogRef.current);
    }
  };

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

  // Helper to format annual fee with null handling
  const formatAnnualFee = (fee: number | null): string => {
    if (fee === null) return common.unknown;
    return `BDT ${fee.toLocaleString()}`;
  };

  // Helper to format interest rate with null handling
  const formatInterestRate = (rate: number | null): string => {
    if (rate === null) return common.unknown;
    return `${rate}${common.aprSuffix}`;
  };

  const detailUrl = card.bankName ? `/card/${slugify(card.bankName)}/${slugify(card.name)}` : null;

  return (
    <motion.div
      className="popup-overlay"
      onClick={onClose}
      data-testid="popup-overlay"
      variants={backdropVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="card-details-popup"
        onClick={handlePopupClick}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="card-details-title"
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        variants={modalPanelVariants}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        exit="exit"
      >
        <button
          className="close-button"
          onClick={onClose}
          type="button"
          aria-label={common.closeCardDetailsAriaLabel}
          ref={closeButtonRef}
        >
          ×
        </button>

        {card.images && card.images.length > 0 && (
          <div className="card-image-gallery">
            <img
              src={card.images[currentImageIndex].full}
              alt={`${card.name} card ${currentImageIndex + 1} of ${card.images.length}`}
              className="card-full-image"
            />
            {card.images.length > 1 && (
              <div className="image-navigation">
                <button
                  onClick={prevImage}
                  className="nav-button prev"
                  type="button"
                  aria-label={common.prevImageAriaLabel}
                >
                  {'<'}
                </button>
                <span className="image-counter" aria-live="polite">
                  {currentImageIndex + 1} / {card.images.length}
                </span>
                <button
                  onClick={nextImage}
                  className="nav-button next"
                  type="button"
                  aria-label={common.nextImageAriaLabel}
                >
                  {'>'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="popup-header">
          <h2 id="card-details-title">{card.name}</h2>
          <span className="bank-name">{card.bankName || common.unknownBank}</span>
        </div>

        <div className="popup-content">
          <div className="detail-section">
            <h3>{common.calcFormTitle}</h3>
            <div className="detail-row">
              <span className="detail-label">{common.calcResultAnnualFee}:</span>
              <span className="detail-value">{formatAnnualFee(card.annualFee)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{common.filterSectionInterestRate}:</span>
              <span className="detail-value">{formatInterestRate(card.interestRateApr)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>{common.filterSectionLoungeAccess}</h3>
            <div className="detail-row">
              <span className="detail-label">{common.filterLabelHasInternationalLounge}:</span>
              <span className="detail-value">
                {card.loungeAccessInternational === null
                  ? common.unknown
                  : card.loungeAccessInternational === ''
                  ? common.calcResultBreakEvenUnknown
                  : card.loungeAccessInternational}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{common.filterLabelHasDomesticLounge}:</span>
              <span className="detail-value">
                {card.loungeAccessDomestic === null
                  ? common.unknown
                  : card.loungeAccessDomestic === ''
                  ? common.calcResultBreakEvenUnknown
                  : card.loungeAccessDomestic}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <h3>{common.feesSectionTitle}</h3>
            <div className="detail-row">
              <span className="detail-label">{common.cashAdvanceFeeLabel}:</span>
              <span className="detail-value">{card.cashAdvanceFee}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{common.latePaymentFeeLabel}:</span>
              <span className="detail-value">{card.latePaymentFee}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>{common.annualFeeWaiverSectionTitle}</h3>
            <p>
              {card.annualFeeWaiverPolicy ? card.annualFeeWaiverPolicy.conditions : common.unknown}
            </p>
          </div>

          <div className="detail-section">
            <h3>{common.cardRewards}</h3>
            <p>{card.rewardPointsPolicy}</p>
          </div>

          <div className="detail-section">
            <h3>{common.cardAdditionalFeatures}</h3>
            <ul className="feature-list">
              {card.additionalFeatures?.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h3>{common.cardMoreInfo}</h3>
            <div className="detail-row">
              <span className="detail-label">{common.cardSource}</span>
              {card.sourceUrl ? (
                <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {common.cardOfficialWebsite}
                </a>
              ) : (
                <span className="detail-value">{common.unknown}</span>
              )}
            </div>
            <div className="detail-row">
              <span className="detail-label">{common.cardLastUpdated}</span>
              <span className="detail-value">
                {card.lastUpdated ? card.lastUpdated.toLocaleDateString() : common.unknown}
              </span>
            </div>
          </div>
        </div>

        <div className="popup-footer">
          {detailUrl && (
            <a className="full-details-link" href={detailUrl}>
              {common.comparisonFooterShare}
            </a>
          )}
          <button
            className={`add-to-compare-btn ${isInCompareList ? 'in-list' : ''}`}
            onClick={() => onAddToCompare(card)}
          >
            {isInCompareList ? common.comparisonFooterShare : common.comparisonAddCard}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CardDetailsPopup;
