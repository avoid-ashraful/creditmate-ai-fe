import React from 'react';

import CardListItem from './CardListItem';

/* State: selected card */
export const Selected = () => {
  const card = {
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
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card without images */
export const NoImage = () => {
  const card = {
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
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
  };
  return <CardListItem card={card} isSelected={false} selectable={false} />;
};

/* State: card with no additional features */
export const NoFeatures = () => {
  const card = {
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
    additionalFeatures: [],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
  };
  return <CardListItem card={card} isSelected={false} selectable={false} />;
};

/* State: card with single feature */
export const SingleFeature = () => {
  const card = {
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
    additionalFeatures: ['One feature only'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
  };
  return <CardListItem card={card} isSelected={false} selectable={false} />;
};

export default {
  title: 'Components/CardListItem',
  component: CardListItem,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
};
