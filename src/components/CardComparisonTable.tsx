import React from 'react';

import { dummyBanks } from '../dummy-data/credit-cards';
import { CreditCard } from '../types';

interface CardComparisonTableProps {
  cards: CreditCard[];
  highlightDifferences?: boolean;
}

interface ComparisonFeature {
  key: string;
  label: string;
  value: (card: CreditCard) => React.ReactNode;
  differenceKey?: keyof CreditCard;
  group: 'Costs' | 'Benefits' | 'Card information';
}

const formatAnnualFee = (fee: number | null): string =>
  fee === null ? 'Data not available' : `BDT ${fee.toLocaleString()}`;

const formatInterestRate = (rate: number | null): string =>
  rate === null ? 'Data not available' : `${rate}%`;

const getBankName = (card: CreditCard): string => {
  if (card.bankName) return card.bankName;
  if (card.bankId === undefined) return 'Data not available';
  const bank = dummyBanks.find(bankItem => bankItem.id === card.bankId);
  return bank?.name || `Bank ID: ${card.bankId}`;
};

const getFeatures = (): ComparisonFeature[] => [
  {
    key: 'annual-fee',
    label: 'Annual Fee',
    value: card => formatAnnualFee(card.annualFee),
    differenceKey: 'annualFee',
    group: 'Costs',
  },
  {
    key: 'apr',
    label: 'Interest Rate (APR)',
    value: card => formatInterestRate(card.interestRateApr),
    differenceKey: 'interestRateApr',
    group: 'Costs',
  },
  {
    key: 'cash-advance-fee',
    label: 'Cash Advance Fee',
    value: card => card.cashAdvanceFee,
    differenceKey: 'cashAdvanceFee',
    group: 'Costs',
  },
  {
    key: 'late-payment-fee',
    label: 'Late Payment Fee',
    value: card => card.latePaymentFee,
    differenceKey: 'latePaymentFee',
    group: 'Costs',
  },
  {
    key: 'fee-waiver',
    label: 'Annual Fee Waiver',
    value: card => card.annualFeeWaiverPolicy?.conditions || 'Not available',
    group: 'Costs',
  },
  {
    key: 'international-lounge',
    label: 'International Lounge Access',
    value: card =>
      card.loungeAccessInternational === null
        ? 'Data not available'
        : card.loungeAccessInternational === ''
        ? 'None'
        : card.loungeAccessInternational,
    differenceKey: 'loungeAccessInternational',
    group: 'Benefits',
  },
  {
    key: 'domestic-lounge',
    label: 'Domestic Lounge Access',
    value: card =>
      card.loungeAccessDomestic === null
        ? 'Data not available'
        : card.loungeAccessDomestic === ''
        ? 'None'
        : card.loungeAccessDomestic,
    differenceKey: 'loungeAccessDomestic',
    group: 'Benefits',
  },
  {
    key: 'reward-points',
    label: 'Reward Points',
    value: card => card.rewardPointsPolicy,
    group: 'Benefits',
  },
  {
    key: 'additional-features',
    label: 'Additional Features',
    value: card =>
      card.additionalFeatures.length ? (
        <ul className="feature-list">
          {card.additionalFeatures.map((feature, index) => (
            <li key={`${card.id}-feature-${index}`}>{feature}</li>
          ))}
        </ul>
      ) : (
        'Data not available'
      ),
    group: 'Benefits',
  },
  {
    key: 'last-updated',
    label: 'Last Updated',
    value: card =>
      card.lastUpdated ? card.lastUpdated.toLocaleDateString() : 'Data not available',
    group: 'Card information',
  },
];

const CardComparisonTable: React.FC<CardComparisonTableProps> = ({
  cards,
  highlightDifferences = true,
}) => {
  if (!cards || cards.length === 0) {
    return <div className="empty-state">No cards selected for comparison</div>;
  }

  const features = getFeatures();
  const hasDifferences = (key: keyof CreditCard): boolean => {
    if (!highlightDifferences || cards.length <= 1) return false;
    return new Set(cards.map(card => card[key])).size > 1;
  };

  const groups = Array.from(new Set(features.map(feature => feature.group)));

  return (
    <div className="comparison-table-container">
      <div className="comparison-mobile-cards" aria-label="Card comparison details">
        {cards.map(card => (
          <article className="comparison-mobile-card" key={card.id}>
            <header className="comparison-mobile-card-header">
              <h3>{card.name}</h3>
              <p>by {getBankName(card)}</p>
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
                        <dd>{feature.value(card)}</dd>
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
                Feature
              </th>
              {cards.map(card => (
                <th key={card.id} className="card-column" scope="col">
                  <div className="card-header">
                    <h3>{card.name}</h3>
                    <span className="bank-name">by {getBankName(card)}</span>
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
                  <td key={`${card.id}-${feature.key}`}>{feature.value(card)}</td>
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
