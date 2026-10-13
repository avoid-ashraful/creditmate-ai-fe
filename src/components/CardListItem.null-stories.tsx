import React from 'react';

import CardListItem from './CardListItem';

export default {
  title: 'Components/CardListItem/Null States',
  component: CardListItem,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'tablet' },
  },
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
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with null interest rate (APR) */
export const NullInterestRate = () => {
  const card = {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: 5000,
    interestRateApr: null,
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
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with both null annual fee and null APR */
export const BothNull = () => {
  const card = {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: null,
    interestRateApr: null,
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
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
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
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with all nullable fields as null */
export const AllNull = () => {
  const card = {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: null,
    interestRateApr: null,
    loungeAccessInternational: null,
    loungeAccessDomestic: null,
    cashAdvanceFee: '2.5% or BDT 500',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
    rewardPointsPolicy: '1 point per BDT 50',
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with zero annual fee (not null) */
export const ZeroAnnualFee = () => {
  const card = {
    id: 1,
    name: 'No Fee Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: 0,
    interestRateApr: 24.5,
    loungeAccessInternational: '0 visits',
    loungeAccessDomestic: '0 visits',
    cashAdvanceFee: '2.5% or BDT 500',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'N/A' },
    rewardPointsPolicy: '1 point per BDT 50',
    additionalFeatures: ['No annual fee'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with empty string lounge access */
export const EmptyStringLounge = () => {
  const card = {
    id: 1,
    name: 'Basic Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: 1000,
    interestRateApr: 26.0,
    loungeAccessInternational: '',
    loungeAccessDomestic: '',
    cashAdvanceFee: '2.5% or BDT 500',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Must spend BDT 100,000' },
    rewardPointsPolicy: '1 point per BDT 100',
    additionalFeatures: ['Basic features'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with missing bankName and bankId */
export const MissingBankInfo = () => {
  const card = {
    id: 1,
    name: 'Mystery Card',
    bankId: undefined,
    bankName: undefined,
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
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with null rewardPointsPolicy */
export const NullRewards = () => {
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
    rewardPointsPolicy: '',
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with empty additionalFeatures array */
export const EmptyFeatures = () => {
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
    additionalFeatures: [],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with null additionalFeatures */
export const NullFeatures = () => {
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
    additionalFeatures: null as any,
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with null annualFeeWaiverPolicy */
export const NullWaiverPolicy = () => {
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
    annualFeeWaiverPolicy: null,
    rewardPointsPolicy: '1 point per BDT 50',
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with null images */
export const NullImages = () => {
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
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: null as any,
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: card with empty images array */
export const EmptyImages = () => {
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
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [],
    lastUpdated: new Date('2025-05-15'),
  };
  return <CardListItem card={card} isSelected={false} selectable={true} />;
};

/* State: selectable card with null fee/APR */
export const SelectableWithNulls = () => {
  const card = {
    id: 1,
    name: 'EBL Platinum Card',
    bankId: 1,
    bankName: 'Eastern Bank Limited',
    annualFee: null,
    interestRateApr: null,
    loungeAccessInternational: null,
    loungeAccessDomestic: null,
    cashAdvanceFee: '2.5% or BDT 500',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: { conditions: 'Must spend BDT 300,000' },
    rewardPointsPolicy: '1 point per BDT 50',
    additionalFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
    sourceUrl: 'https://example.com',
    isActive: true,
    images: [{ small: '/img.png', full: '/img-full.png' }],
    lastUpdated: new Date('2025-05-15'),
  };
  return (
    <CardListItem card={card} isSelected={true} selectable={true} onSelect={() => undefined} />
  );
};
