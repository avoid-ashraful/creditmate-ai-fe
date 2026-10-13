import React from 'react';

import { dummyBanks } from '../dummy-data/credit-cards';
import { useLanguage, getCommonCopy } from '../locales';
import { CreditCard } from '../types';
import { getComparisonSummary } from '../utils/narratives';

interface CardComparisonTableProps {
  cards: CreditCard[];
  highlightDifferences?: boolean;
}

interface ComparisonFeature {
  key: string;
  label: string;
  value: (card: CreditCard, common: ReturnType<typeof getCommonCopy>) => React.ReactNode;
  differenceKey?: keyof CreditCard;
  group: 'Costs' | 'Benefits' | 'Card information';
}

const formatAnnualFee = (fee: number | null, common: ReturnType<typeof getCommonCopy>): string =>
  fee === null ? common.unknown : `BDT ${fee.toLocaleString()}`;

const formatInterestRate = (
  rate: number | null,
  common: ReturnType<typeof getCommonCopy>
): string => (rate === null ? common.unknown : `${rate}${common.aprSuffix}`);

const getBankName = (card: CreditCard, common: ReturnType<typeof getCommonCopy>): string => {
  if (card.bankName) return card.bankName;
  if (card.bankId === undefined) return common.unknown;
  const bank = dummyBanks.find(bankItem => bankItem.id === card.bankId);
  return bank?.name || common.bankIdLabel.replace('{id}', card.bankId.toString());
};

const getFeatures = (common: ReturnType<typeof getCommonCopy>): ComparisonFeature[] => [
  {
    key: 'annual-fee',
    label: common.calcResultAnnualFee,
    value: card => formatAnnualFee(card.annualFee, common),
    differenceKey: 'annualFee',
    group: 'Costs',
  },
  {
    key: 'apr',
    label: common.filterSectionInterestRate,
    value: card => formatInterestRate(card.interestRateApr, common),
    differenceKey: 'interestRateApr',
    group: 'Costs',
  },
  {
    key: 'cash-advance-fee',
    label: common.cashAdvanceFeeLabel,
    value: card => card.cashAdvanceFee,
    differenceKey: 'cashAdvanceFee',
    group: 'Costs',
  },
  {
    key: 'late-payment-fee',
    label: common.latePaymentFeeLabel,
    value: card => card.latePaymentFee,
    differenceKey: 'latePaymentFee',
    group: 'Costs',
  },
  {
    key: 'fee-waiver',
    label: common.annualFeeWaiverLabel,
    value: card => card.annualFeeWaiverPolicy?.conditions || common.unknown,
    group: 'Costs',
  },
  {
    key: 'international-lounge',
    label: common.filterLabelHasInternationalLounge,
    value: card =>
      card.loungeAccessInternational === null
        ? common.unknown
        : card.loungeAccessInternational === ''
        ? common.calcResultBreakEvenUnknown
        : card.loungeAccessInternational,
    differenceKey: 'loungeAccessInternational',
    group: 'Benefits',
  },
  {
    key: 'domestic-lounge',
    label: common.filterLabelHasDomesticLounge,
    value: card =>
      card.loungeAccessDomestic === null
        ? common.unknown
        : card.loungeAccessDomestic === ''
        ? common.calcResultBreakEvenUnknown
        : card.loungeAccessDomestic,
    differenceKey: 'loungeAccessDomestic',
    group: 'Benefits',
  },
  {
    key: 'reward-points',
    label: common.cardRewards,
    value: card => card.rewardPointsPolicy,
    group: 'Benefits',
  },
  {
    key: 'additional-features',
    label: common.cardAdditionalFeatures,
    value: card =>
      card.additionalFeatures.length ? (
        <ul className="feature-list">
          {card.additionalFeatures.map((feature, index) => (
            <li key={`${card.id}-feature-${index}`}>{feature}</li>
          ))}
        </ul>
      ) : (
        common.unknown
      ),
    group: 'Benefits',
  },
  {
    key: 'last-updated',
    label: common.cardLastUpdated,
    value: card => (card.lastUpdated ? card.lastUpdated.toLocaleDateString() : common.unknown),
    group: 'Card information',
  },
];

const CardComparisonTable: React.FC<CardComparisonTableProps> = ({
  cards,
  highlightDifferences = true,
}) => {
  const { lang } = useLanguage();
  const common = getCommonCopy(lang);

  if (!cards || cards.length === 0) {
    return <div className="empty-state">{common.comparisonEmptyDesc}</div>;
  }

  const features = getFeatures(common);
  const hasDifferences = (key: keyof CreditCard): boolean => {
    if (!highlightDifferences || cards.length <= 1) return false;
    return new Set(cards.map(card => card[key])).size > 1;
  };

  const groups = Array.from(new Set(features.map(feature => feature.group)));
  const comparisonSummary = cards.length > 1 ? getComparisonSummary(cards) : null;

  return (
    <div className="comparison-table-container">
      {comparisonSummary && (
        <section className="comparison-insight" aria-label="Comparison insight">
          <h2>{common.experimentLegendTitle}</h2>
          <p>{comparisonSummary}</p>
        </section>
      )}
      <div className="comparison-mobile-cards" aria-label="Card comparison details">
        {cards.map(card => (
          <article className="comparison-mobile-card" key={card.id}>
            <header className="comparison-mobile-card-header">
              <h3>{card.name}</h3>
              <p>by {getBankName(card, common)}</p>
            </header>
            {groups.map((group, index) => (
              <details
                className="comparison-mobile-group"
                key={`${card.id}-${group}`}
                open={index === 0}
              >
                <summary>{group}</summary>
                <dl>
                  {features
                    .filter(feature => feature.group === group)
                    .map(feature => (
                      <div className="comparison-mobile-feature" key={feature.key}>
                        <dt>{feature.label}</dt>
                        <dd>{feature.value(card, common)}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            ))}
          </article>
        ))}
      </div>

      <div className="comparison-table-scroll" role="region" aria-label="Compare card features">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="feature-column" scope="col">
                {common.featureColumnLabel}
              </th>
              {cards.map(card => (
                <th key={card.id} className="card-column" scope="col">
                  <div className="card-header">
                    <h3>{card.name}</h3>
                    <span className="bank-name">by {getBankName(card, common)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map(feature => (
              <tr
                key={feature.key}
                className={
                  feature.differenceKey && hasDifferences(feature.differenceKey)
                    ? 'highlight-difference'
                    : ''
                }
              >
                <th className="feature-name" scope="row">
                  {feature.label}
                </th>
                {cards.map(card => (
                  <td key={`${card.id}-${feature.key}`}>{feature.value(card, common)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CardComparisonTable;
