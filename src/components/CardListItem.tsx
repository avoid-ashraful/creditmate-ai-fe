import React from 'react';

import { cardHover, cardTap, fadeInUp, usePrefersReducedMotion } from '../animations';
import { useLanguage, getCommonCopy, getCardDetailCopy, getNetworkLabel } from '../locales';
import { AnimatedCard, GradientButton } from '../styles/StyledComponents';
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
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);
  const detailCopy = getCardDetailCopy(lang);
  const networkLabel = getNetworkLabel(detailCopy, card.cardNetwork);
  const reduceMotion = usePrefersReducedMotion();

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
    if (fee === null) return common.unknown;
    return `BDT ${fee.toLocaleString()}`;
  };

  // Helper to format interest rate with null handling
  const formatInterestRate = (rate: number | null): string => {
    if (rate === null) return card.isIslamic ? common.aprIslamicNoInterest : common.unknown;
    return `${rate}${common.aprSuffix}`;
  };

  const formatLoungeAccess = (): string => {
    const intl = card.loungeAccessInternational;
    const dom = card.loungeAccessDomestic;

    if (intl === null && dom === null) {
      return common.unknown;
    }

    const parts: string[] = [];
    if (intl !== null && intl !== '') {
      parts.push(`${intl} ${common.intlSuffix}`);
    }
    if (dom !== null && dom !== '') {
      parts.push(`${dom} ${common.domesticSuffix}`);
    }

    if (parts.length === 0) {
      return common.loungeNotListed;
    }

    return parts.join(' / ');
  };

  return (
    <AnimatedCard
      className={`card-list-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      variants={fadeInUp}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      whileHover={reduceMotion ? undefined : cardHover}
      whileTap={reduceMotion ? undefined : cardTap}
    >
      {card.images && card.images.length > 0 && (
        <div className="card-image">
          <img src={card.images[0].small} alt={card.name} />
        </div>
      )}

      <div className="card-header">
        <h3 className="card-name">{card.name}</h3>
        <span className="bank-name">{card.bankName || common.unknownBank}</span>
        {(networkLabel || card.isIslamic) && (
          <span className="card-badges">
            {networkLabel && <span className="card-badge card-badge-network">{networkLabel}</span>}
            {card.isIslamic && (
              <span className="card-badge card-badge-islamic">{detailCopy.islamicBadge}</span>
            )}
          </span>
        )}
      </div>

      <div className="card-details">
        <div className="detail-row">
          <span className="detail-label">{common.calcResultAnnualFee}:</span>
          <span className="detail-value">{formatAnnualFee(card.annualFee)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">{common.filterSectionInterestRate}:</span>
          <span className="detail-value">{formatInterestRate(card.interestRateApr)}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">{common.filterSectionLoungeAccess}:</span>
          <span className="detail-value">{formatLoungeAccess()}</span>
        </div>
      </div>

      <div className="card-rewards">
        <h4>{common.cardRewards}</h4>
        <p>{card.rewardPointsPolicy}</p>
      </div>

      <div className="card-features">
        <h4>{common.cardKeyFeatures}</h4>
        <ul className="feature-list">
          {card.additionalFeatures?.slice(0, 2).map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
          {card.additionalFeatures && card.additionalFeatures.length > 2 && (
            <li className="more-features">
              {common.cardMoreFeatures.replace(
                '{count}',
                (card.additionalFeatures.length - 2).toString()
              )}
            </li>
          )}
        </ul>
      </div>

      {onViewDetails && (
        <button
          type="button"
          className="view-details-btn"
          onClick={event => {
            event.stopPropagation();
            onViewDetails(card);
          }}
          aria-haspopup="dialog"
          aria-label={`${common.cardMoreInfo}: ${card.name}`}
        >
          {common.cardMoreInfo}
        </button>
      )}

      {card.bankName && (
        <a
          className="card-detail-link"
          href={`/card/${slugify(card.bankName)}/${slugify(card.name)}`}
          onClick={event => event.stopPropagation()}
        >
          {common.comparisonFooterShare}
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
            {isSelected ? common.comparisonFooterShare : common.comparisonAddCard}
          </GradientButton>
        </div>
      )}
    </AnimatedCard>
  );
};

export default CardListItem;
