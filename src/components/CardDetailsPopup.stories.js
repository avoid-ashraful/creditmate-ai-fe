import React from 'react';

import CardDetailsPopup from './CardDetailsPopup';

export default {
  title: 'Components/CardDetailsPopup',
  component: CardDetailsPopup,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  argTypes: {
    onClose: { action: 'onClose' },
    onAddToCompare: { action: 'onAddToCompare' },
  },
};

/* State: popup with images */
export const WithGallery = () => {
  const card = {
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
    annualFeeWaiverPolicy: {
      spendThreshold: 300000,
      period: 'yearly',
      conditions: 'Must spend BDT 300,000 within the card anniversary year',
    },
    rewardPointsPolicy: '1 point per BDT 50 spent. Double points on dining and travel.',
    additionalFeatures: [
      'Complimentary airport pickup/drop service twice a year',
      'Buy 1 Get 1 free movie ticket at Star Cineplex',
      'Travel insurance up to USD 500,000',
    ],
    sourceUrl: 'https://www.ebl.com.bd/personal/cards/credit-cards/platinum-card',
    isActive: true,
    lastUpdated: new Date('2025-05-15'),
    images: [
      { small: '/cards/ebl-platinum-small-1.png', full: '/cards/ebl-platinum-full-1.png' },
      { small: '/cards/ebl-platinum-small-2.png', full: '/cards/ebl-platinum-full-2.png' },
    ],
  };
  return (
    <CardDetailsPopup
      card={card}
      onClose={() => {}}
      onAddToCompare={() => {}}
      isInCompareList={false}
    />
  );
};

/* State: card without images */
export const WithoutImages = () => {
  const card = {
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
    additionalFeatures: ['Feature 1'],
    sourceUrl: 'https://example.com',
    isActive: true,
    lastUpdated: new Date('2025-05-15'),
  };
  return (
    <CardDetailsPopup
      card={card}
      onClose={() => {}}
      onAddToCompare={() => {}}
      isInCompareList={false}
    />
  );
};

/* State: card with null annual fee */
export const NullAnnualFee = () => {
  const card = {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: null,
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
    lastUpdated: new Date('2025-05-15'),
    images: [{ small: '/img.png', full: '/img-full.png' }],
  };
  return (
    <CardDetailsPopup
      card={card}
      onClose={() => {}}
      onAddToCompare={() => {}}
      isInCompareList={false}
    />
  );
};

/* State: card with null lounge access */
export const NullLoungeAccess = () => {
  const card = {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: 5000,
    interestRateApr: 24.5,
    loungeAccessInternational: null,
    loungeAccessDomestic: null,
    cashAdvanceFee: '2.5% or BDT 500',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
    rewardPointsPolicy: '1 point per BDT 50',
    additionalFeatures: ['Feature 1'],
    sourceUrl: 'https://example.com',
    isActive: true,
    lastUpdated: new Date('2025-05-15'),
    images: [{ small: '/img.png', full: '/img-full.png' }],
  };
  return (
    <CardDetailsPopup
      card={card}
      onClose={() => {}}
      onAddToCompare={() => {}}
      isInCompareList={false}
    />
  );
};
