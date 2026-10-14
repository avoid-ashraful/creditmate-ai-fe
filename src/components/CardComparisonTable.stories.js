import React from 'react';

import CardComparisonTable from './CardComparisonTable';

export default {
  title: 'Components/CardComparisonTable',
  component: CardComparisonTable,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
  argTypes: {
    highlightDifferences: { control: 'boolean' },
  },
};

/* State: single card - no difference highlighting possible */
export const SingleCard = () => (
  <CardComparisonTable
    cards={[
      {
        id: 1,
        name: 'EBL Platinum Card',
        bankId: 1,
        bankName: 'Eastern Bank Limited',
        annualFee: 5000,
        interestRateApr: 24.5,
        loungeAccessInternational: '6 visits',
        loungeAccessDomestic: '12 visits',
        cashAdvanceFee: '2.5% or BDT 500',
        latePaymentFee: 'BDT 1000',
        annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
        rewardPointsPolicy: '1 point per BDT 50',
        additionalFeatures: ['Feature 1', 'Feature 2'],
        sourceUrl: 'https://example.com',
        isActive: true,
        lastUpdated: new Date('2025-05-15'),
        images: [{ small: '/img.png', full: '/img-full.png' }],
      },
    ]}
    highlightDifferences={false}
  />
);

/* State: two cards with differences highlighted */
export const TwoCardsDifferences = () => (
  <CardComparisonTable
    cards={[
      {
        id: 1,
        name: 'EBL Platinum Card',
        bankId: 1,
        bankName: 'Eastern Bank Limited',
        annualFee: 5000,
        interestRateApr: 24.5,
        loungeAccessInternational: '6 visits',
        loungeAccessDomestic: '12 visits',
        cashAdvanceFee: '2.5% or BDT 500',
        latePaymentFee: 'BDT 1000',
        annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
        rewardPointsPolicy: '1 point per BDT 50',
        additionalFeatures: ['Feature 1', 'Feature 2'],
        sourceUrl: 'https://example.com',
        isActive: true,
        lastUpdated: new Date('2025-05-15'),
        images: [{ small: '/img.png', full: '/img-full.png' }],
      },
      {
        id: 2,
        name: 'SCB Visa Platinum',
        bankId: 2,
        bankName: 'Standard Chartered Bank',
        annualFee: 4000,
        interestRateApr: 25.0,
        loungeAccessInternational: '8 visits',
        loungeAccessDomestic: '12 visits',
        cashAdvanceFee: '2% or BDT 500',
        latePaymentFee: 'BDT 1200',
        annualFeeWaiverPolicy: { conditions: 'Spend BDT 250,000' },
        rewardPointsPolicy: '1 point per BDT 40',
        additionalFeatures: ['Feature 2', 'Feature 3'],
        sourceUrl: 'https://example.com',
        isActive: true,
        lastUpdated: new Date('2025-05-28'),
        images: [{ small: '/img.png', full: '/img-full.png' }],
      },
    ]}
    highlightDifferences={true}
  />
);

/* State: two cards without differences (same values) */
export const TwoCardsSame = () => (
  <CardComparisonTable
    cards={[
      {
        id: 1,
        name: 'EBL Platinum Card',
        bankId: 1,
        bankName: 'Eastern Bank Limited',
        annualFee: 5000,
        interestRateApr: 24.5,
        loungeAccessInternational: '6 visits',
        loungeAccessDomestic: '12 visits',
        cashAdvanceFee: '2.5% or BDT 500',
        latePaymentFee: 'BDT 1000',
        annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
        rewardPointsPolicy: '1 point per BDT 50',
        additionalFeatures: ['Feature 1', 'Feature 2'],
        sourceUrl: 'https://example.com',
        isActive: true,
        lastUpdated: new Date('2025-05-15'),
        images: [{ small: '/img.png', full: '/img-full.png' }],
      },
      {
        id: 2,
        name: 'Cloned Card',
        bankId: 1,
        bankName: 'Eastern Bank Limited',
        annualFee: 5000,
        interestRateApr: 24.5,
        loungeAccessInternational: '6 visits',
        loungeAccessDomestic: '12 visits',
        cashAdvanceFee: '2.5% or BDT 500',
        latePaymentFee: 'BDT 1000',
        annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
        rewardPointsPolicy: '1 point per BDT 50',
        additionalFeatures: ['Feature 1', 'Feature 2'],
        sourceUrl: 'https://example.com',
        isActive: true,
        lastUpdated: new Date('2025-05-15'),
        images: [{ small: '/img.png', full: '/img-full.png' }],
      },
    ]}
    highlightDifferences={true}
  />
);
