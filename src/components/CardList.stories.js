import React from 'react';

import CardList from './CardList';

export default {
  title: 'Components/CardList',
  component: CardList,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
};

/* State: cards list with 3 cards */
export const WithSelection = () => {
  return (
    <CardList
      cards={[
        {
          id: 1,
          name: 'EBL Platinum Card',
          annualFee: 5000,
          interestRateApr: 24.5,
          loungeAccessInternational: '6 visits',
          loungeAccessDomestic: '12 visits',
          cashAdvanceFee: '2.5% or BDT 500',
          latePaymentFee: 'BDT 1000',
          annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
          rewardPointsPolicy: '1 point per BDT 50',
          additionalFeatures: ['Feature 1'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 2,
          name: 'SCB Visa Platinum',
          annualFee: 4000,
          interestRateApr: 25.0,
          loungeAccessInternational: '8 visits',
          loungeAccessDomestic: '12 visits',
          cashAdvanceFee: '2% or BDT 500',
          latePaymentFee: 'BDT 1200',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 250,000' },
          rewardPointsPolicy: '1 point per BDT 40',
          additionalFeatures: ['Feature 2'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 3,
          name: 'BRAC Bank Signature',
          annualFee: 6000,
          interestRateApr: 23.5,
          loungeAccessInternational: '10 visits',
          loungeAccessDomestic: '24 visits',
          cashAdvanceFee: '2% or BDT 600',
          latePaymentFee: 'BDT 1000',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 400,000' },
          rewardPointsPolicy: '2 points per BDT 100',
          additionalFeatures: ['Feature 3'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
      ]}
      onCardSelect={() => {}}
      selectedCardIds={[1]}
      maxSelections={4}
      showSelectionIndicator={true}
      onViewCardDetails={() => {}}
    />
  );
};

/* State: no cards - empty state */
export const Empty = () => (
  <CardList
    cards={[]}
    onCardSelect={() => {}}
    selectedCardIds={[]}
    maxSelections={4}
    showSelectionIndicator={true}
    onViewCardDetails={() => {}}
  />
);

/* State: 1 card only */
export const SingleCard = () => {
  return (
    <CardList
      cards={[
        {
          id: 1,
          name: 'EBL Platinum Card',
          annualFee: 5000,
          interestRateApr: 24.5,
          loungeAccessInternational: '6 visits',
          loungeAccessDomestic: '12 visits',
          cashAdvanceFee: '2.5% or BDT 500',
          latePaymentFee: 'BDT 1000',
          annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
          rewardPointsPolicy: '1 point per BDT 50',
          additionalFeatures: ['Feature 1'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
      ]}
      onCardSelect={() => {}}
      selectedCardIds={[]}
      maxSelections={4}
      showSelectionIndicator={true}
      onViewCardDetails={() => {}}
    />
  );
};

/* State: 7 cards with load more indicator */
export const ManyCards = () => {
  return (
    <CardList
      cards={[
        {
          id: 1,
          name: 'EBL Platinum Card',
          annualFee: 5000,
          interestRateApr: 24.5,
          loungeAccessInternational: '6 visits',
          loungeAccessDomestic: '12 visits',
          cashAdvanceFee: '2.5% or BDT 500',
          latePaymentFee: 'BDT 1000',
          annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
          rewardPointsPolicy: '1 point per BDT 50',
          additionalFeatures: ['Feature 1'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 2,
          name: 'SCB Visa Platinum',
          annualFee: 4000,
          interestRateApr: 25.0,
          loungeAccessInternational: '8 visits',
          loungeAccessDomestic: '12 visits',
          cashAdvanceFee: '2% or BDT 500',
          latePaymentFee: 'BDT 1200',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 250,000' },
          rewardPointsPolicy: '1 point per BDT 40',
          additionalFeatures: ['Feature 2'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 3,
          name: 'BRAC Bank Signature',
          annualFee: 6000,
          interestRateApr: 23.5,
          loungeAccessInternational: '10 visits',
          loungeAccessDomestic: '24 visits',
          cashAdvanceFee: '2% or BDT 600',
          latePaymentFee: 'BDT 1000',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 400,000' },
          rewardPointsPolicy: '2 points per BDT 100',
          additionalFeatures: ['Feature 3'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 4,
          name: 'City Bank American Express Gold',
          annualFee: 4500,
          interestRateApr: 24.0,
          loungeAccessInternational: '6 visits',
          loungeAccessDomestic: '12 visits',
          cashAdvanceFee: '2.5% or BDT 550',
          latePaymentFee: 'BDT 1000',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 350,000' },
          rewardPointsPolicy: 'Amex points',
          additionalFeatures: ['Feature 4'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 5,
          name: 'DBBL Titanium Card',
          annualFee: 3000,
          interestRateApr: 22.0,
          loungeAccessInternational: '4 visits',
          loungeAccessDomestic: '8 visits',
          cashAdvanceFee: '2.5% or BDT 500',
          latePaymentFee: 'BDT 800',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 200,000' },
          rewardPointsPolicy: '1 point per BDT 75',
          additionalFeatures: ['Feature 5'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 6,
          name: 'EBL Classic Card',
          annualFee: 2000,
          interestRateApr: 26.0,
          loungeAccessInternational: '0 visits',
          loungeAccessDomestic: '4 visits',
          cashAdvanceFee: '3% or BDT 500',
          latePaymentFee: 'BDT 800',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 150,000' },
          rewardPointsPolicy: '1 point per BDT 100',
          additionalFeatures: ['Feature 6'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
        {
          id: 7,
          name: 'SCB Gold Card',
          annualFee: 2500,
          interestRateApr: 26.5,
          loungeAccessInternational: '2 visits',
          loungeAccessDomestic: '6 visits',
          cashAdvanceFee: '2.5% or BDT 500',
          latePaymentFee: 'BDT 900',
          annualFeeWaiverPolicy: { conditions: 'Spend BDT 180,000' },
          rewardPointsPolicy: '1 point per BDT 60',
          additionalFeatures: ['Feature 7'],
          sourceUrl: 'https://example.com',
          isActive: true,
          images: [{ small: '/img.png', full: '/img-full.png' }],
        },
      ]}
      onCardSelect={() => {}}
      selectedCardIds={[]}
      maxSelections={4}
      showSelectionIndicator={true}
      onViewCardDetails={() => {}}
    />
  );
};
