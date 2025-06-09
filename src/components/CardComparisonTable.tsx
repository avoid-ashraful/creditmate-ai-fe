import React from 'react';
import { CreditCard } from '../types';

interface CardComparisonTableProps {
  cards: CreditCard[];
  highlightDifferences?: boolean;
}

const CardComparisonTable: React.FC<CardComparisonTableProps> = ({ 
  cards, 
  highlightDifferences = true 
}) => {
  if (!cards || cards.length === 0) {
    return <div className="empty-state">No cards selected for comparison</div>;
  }

  // Helper function to check if values are different among cards
  const hasDifferences = (key: keyof CreditCard): boolean => {
    if (!highlightDifferences || cards.length <= 1) return false;

    const values = cards.map(card => card[key]);
    return new Set(values).size > 1;
  };

  return (
    <div className="comparison-table-container">
      <table className="comparison-table">
        <thead>
          <tr>
            <th className="feature-column">Feature</th>
            {cards.map(card => (
              <th key={card.id} className="card-column">
                <div className="card-header">
                  <h3>{card.name}</h3>
                  <span className="bank-name">by Bank ID: {card.bankId}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className={hasDifferences('annualFee') ? 'highlight-difference' : ''}>
            <td className="feature-name">Annual Fee</td>
            {cards.map(card => (
              <td key={`${card.id}-fee`}>
                BDT {card.annualFee.toLocaleString()}
              </td>
            ))}
          </tr>

          <tr className={hasDifferences('interestRateApr') ? 'highlight-difference' : ''}>
            <td className="feature-name">Interest Rate (APR)</td>
            {cards.map(card => (
              <td key={`${card.id}-apr`}>
                {card.interestRateApr}%
              </td>
            ))}
          </tr>

          <tr className={hasDifferences('loungeAccessInternational') ? 'highlight-difference' : ''}>
            <td className="feature-name">International Lounge Access</td>
            {cards.map(card => (
              <td key={`${card.id}-intl-lounge`}>
                {card.loungeAccessInternational > 0 
                  ? `${card.loungeAccessInternational} visits per year` 
                  : 'Not available'}
              </td>
            ))}
          </tr>

          <tr className={hasDifferences('loungeAccessDomestic') ? 'highlight-difference' : ''}>
            <td className="feature-name">Domestic Lounge Access</td>
            {cards.map(card => (
              <td key={`${card.id}-dom-lounge`}>
                {card.loungeAccessDomestic > 0 
                  ? `${card.loungeAccessDomestic} visits per year` 
                  : 'Not available'}
              </td>
            ))}
          </tr>

          <tr className={hasDifferences('cashAdvanceFee') ? 'highlight-difference' : ''}>
            <td className="feature-name">Cash Advance Fee</td>
            {cards.map(card => (
              <td key={`${card.id}-cash-fee`}>{card.cashAdvanceFee}</td>
            ))}
          </tr>

          <tr className={hasDifferences('latePaymentFee') ? 'highlight-difference' : ''}>
            <td className="feature-name">Late Payment Fee</td>
            {cards.map(card => (
              <td key={`${card.id}-late-fee`}>{card.latePaymentFee}</td>
            ))}
          </tr>

          <tr>
            <td className="feature-name">Annual Fee Waiver</td>
            {cards.map(card => (
              <td key={`${card.id}-waiver`}>
                {card.annualFeeWaiverPolicy 
                  ? card.annualFeeWaiverPolicy.conditions 
                  : 'Not available'}
              </td>
            ))}
          </tr>

          <tr>
            <td className="feature-name">Reward Points</td>
            {cards.map(card => (
              <td key={`${card.id}-rewards`}>{card.rewardPointsPolicy}</td>
            ))}
          </tr>

          <tr>
            <td className="feature-name">Additional Features</td>
            {cards.map(card => (
              <td key={`${card.id}-features`}>
                <ul className="feature-list">
                  {card.additionalFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>

          <tr>
            <td className="feature-name">Last Updated</td>
            {cards.map(card => (
              <td key={`${card.id}-updated`}>
                {card.lastUpdated.toLocaleDateString()}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CardComparisonTable;
