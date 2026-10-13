import React from 'react';

import ComparisonBar from './ComparisonBar';

export default {
  title: 'Components/ComparisonBar',
  component: ComparisonBar,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
  argTypes: {
    maxSelections: { control: { type: 'number', min: 1, max: 5 } },
  },
};

/* State: no cards selected */
export const Empty = () => (
  <ComparisonBar selectedCards={[]} onRemoveCard={() => {}} maxSelections={4} />
);

/* State: 1 card selected */
export const OneCard = () => (
  <ComparisonBar
    selectedCards={[
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
    onRemoveCard={() => {}}
    maxSelections={4}
  />
);

/* State: 2 cards selected - compare button enabled */
export const TwoCards = () => (
  <ComparisonBar
    selectedCards={[
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
    ]}
    onRemoveCard={() => {}}
    maxSelections={4}
  />
);

/* State: 4 cards selected - at maximum */
export const FourCards = () => (
  <ComparisonBar
    selectedCards={[
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
    ]}
    onRemoveCard={() => {}}
    maxSelections={4}
  />
);
