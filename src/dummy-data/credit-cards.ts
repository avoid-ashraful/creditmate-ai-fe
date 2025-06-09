import { Bank, CreditCard } from '../types';

/**
 * Dummy bank data for development
 */
export const dummyBanks: Bank[] = [
  {
    id: 1,
    name: 'Eastern Bank Limited',
    logo: '/assets/logos/ebl.png',
    website: 'https://www.ebl.com.bd',
    isActive: true,
  },
  {
    id: 2,
    name: 'Standard Chartered Bank',
    logo: '/assets/logos/scb.png',
    website: 'https://www.sc.com/bd',
    isActive: true,
  },
  {
    id: 3,
    name: 'BRAC Bank Limited',
    logo: '/assets/logos/brac.png',
    website: 'https://www.bracbank.com',
    isActive: true,
  },
  {
    id: 4,
    name: 'Dutch-Bangla Bank Limited',
    logo: '/assets/logos/dbbl.png',
    website: 'https://www.dutchbanglabank.com',
    isActive: true,
  },
  {
    id: 5,
    name: 'City Bank Limited',
    logo: '/assets/logos/citybank.png',
    website: 'https://www.thecitybank.com',
    isActive: true,
  },
];

/**
 * Dummy credit card data for development
 */
export const dummyCreditCards: CreditCard[] = [
  {
    id: 1,
    bankId: 1, // Eastern Bank Limited
    name: 'EBL Platinum Card',
    annualFee: 5000,
    interestRateApr: 24.5,
    loungeAccessInternational: 6,
    loungeAccessDomestic: 12,
    cashAdvanceFee: '2.5% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: {
      spendThreshold: 300000,
      period: 'yearly',
      conditions: 'Must spend BDT 300,000 within the card anniversary year',
    },
    rewardPointsPolicy: 'Earn 1 point for every BDT 50 spent. Double points on dining and travel.',
    additionalFeatures: [
      'Complimentary airport pickup/drop service twice a year',
      'Buy 1 Get 1 free movie ticket at Star Cineplex',
      'Travel insurance up to USD 500,000',
    ],
    sourceUrl: 'https://www.ebl.com.bd/personal/cards/credit-cards/platinum-card',
    isActive: true,
    lastUpdated: new Date('2025-05-15'),
    images: [
      {
        small: '/assets/cards/ebl-platinum-small-1.png',
        full: '/assets/cards/ebl-platinum-full-1.png',
      },
      {
        small: '/assets/cards/ebl-platinum-small-2.png',
        full: '/assets/cards/ebl-platinum-full-2.png',
      },
    ],
  },
  {
    id: 2,
    bankId: 2, // Standard Chartered Bank
    name: 'SCB Visa Platinum',
    annualFee: 4000,
    interestRateApr: 25.0,
    loungeAccessInternational: 8,
    loungeAccessDomestic: 12,
    cashAdvanceFee: '2% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 1200',
    annualFeeWaiverPolicy: {
      spendThreshold: 250000,
      period: 'yearly',
      conditions: 'Annual fee waived if you spend BDT 250,000 within the card year',
    },
    rewardPointsPolicy: 'Earn 1 reward point for every BDT 40 spent. 5X points on weekend dining.',
    additionalFeatures: [
      '20% discount at partner restaurants',
      'Complimentary health insurance',
      'Visa luxury hotel collection benefits',
    ],
    sourceUrl: 'https://www.sc.com/bd/credit-cards/visa-platinum',
    isActive: true,
    lastUpdated: new Date('2025-05-28'),
    images: [
      {
        small: '/assets/cards/scb-platinum-small-1.png',
        full: '/assets/cards/scb-platinum-full-1.png',
      },
      {
        small: '/assets/cards/scb-platinum-small-2.png',
        full: '/assets/cards/scb-platinum-full-2.png',
      },
    ],
  },
  {
    id: 3,
    bankId: 3, // BRAC Bank Limited
    name: 'BRAC Bank Signature Card',
    annualFee: 6000,
    interestRateApr: 23.5,
    loungeAccessInternational: 10,
    loungeAccessDomestic: 24,
    cashAdvanceFee: '2% or BDT 600, whichever is higher',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: {
      spendThreshold: 400000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 400,000 in a year',
    },
    rewardPointsPolicy:
      'Earn 2 points for every BDT 100 spent locally, 3 points for international spending.',
    additionalFeatures: [
      'Dedicated relationship manager',
      'Complimentary golf access at select courses',
      'Priority banking services',
    ],
    sourceUrl: 'https://www.bracbank.com/credit-cards/signature',
    isActive: true,
    lastUpdated: new Date('2025-06-01'),
    images: [
      {
        small: '/assets/cards/brac-signature-small-1.png',
        full: '/assets/cards/brac-signature-full-1.png',
      },
      {
        small: '/assets/cards/brac-signature-small-2.png',
        full: '/assets/cards/brac-signature-full-2.png',
      },
    ],
  },
  {
    id: 4,
    bankId: 4, // Dutch-Bangla Bank Limited
    name: 'DBBL Titanium Card',
    annualFee: 3000,
    interestRateApr: 22.0,
    loungeAccessInternational: 4,
    loungeAccessDomestic: 8,
    cashAdvanceFee: '2.5% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 800',
    annualFeeWaiverPolicy: {
      spendThreshold: 200000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 200,000 in 12 months',
    },
    rewardPointsPolicy:
      'Earn 1 point for every BDT 75 spent. Points redeemable for cashback or gift vouchers.',
    additionalFeatures: [
      'EMI facilities at 0% interest at partner stores',
      '15% discount at select restaurants',
      'Purchase protection insurance',
    ],
    sourceUrl: 'https://www.dutchbanglabank.com/cards/titanium-card',
    isActive: true,
    lastUpdated: new Date('2025-05-10'),
    images: [
      {
        small: '/assets/cards/dbbl-titanium-small-1.png',
        full: '/assets/cards/dbbl-titanium-full-1.png',
      },
      {
        small: '/assets/cards/dbbl-titanium-small-2.png',
        full: '/assets/cards/dbbl-titanium-full-2.png',
      },
    ],
  },
  {
    id: 5,
    bankId: 5, // City Bank Limited
    name: 'City Bank American Express Gold',
    annualFee: 4500,
    interestRateApr: 24.0,
    loungeAccessInternational: 6,
    loungeAccessDomestic: 12,
    cashAdvanceFee: '2.5% or BDT 550, whichever is higher',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: {
      spendThreshold: 350000,
      period: 'yearly',
      conditions: 'Spend BDT 350,000 within a year to get annual fee waived',
    },
    rewardPointsPolicy: 'Earn Amex Membership Rewards points. 1 point for every BDT 50 spent.',
    additionalFeatures: [
      'American Express Global Assist hotline',
      'Buy 1 Get 1 at Star Cineplex, Premium X and Blockbuster Cinemas',
      'Special dining privileges at premium restaurants',
    ],
    sourceUrl: 'https://www.thecitybank.com/cards/amex-gold',
    isActive: true,
    lastUpdated: new Date('2025-05-20'),
    images: [
      {
        small: '/assets/cards/city-amex-gold-small-1.png',
        full: '/assets/cards/city-amex-gold-full-1.png',
      },
      {
        small: '/assets/cards/city-amex-gold-small-2.png',
        full: '/assets/cards/city-amex-gold-full-2.png',
      },
    ],
  },
  {
    id: 6,
    bankId: 1, // Eastern Bank Limited
    name: 'EBL Classic Card',
    annualFee: 2000,
    interestRateApr: 26.0,
    loungeAccessInternational: 0,
    loungeAccessDomestic: 4,
    cashAdvanceFee: '3% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 800',
    annualFeeWaiverPolicy: {
      spendThreshold: 150000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 150,000 in a year',
    },
    rewardPointsPolicy: 'Earn 1 point for every BDT 100 spent.',
    additionalFeatures: [
      'Up to 10% discount at select restaurants',
      'EMI facilities at partner outlets',
      'SMS transaction alerts',
    ],
    sourceUrl: 'https://www.ebl.com.bd/personal/cards/credit-cards/classic-card',
    isActive: true,
    lastUpdated: new Date('2025-05-12'),
    images: [
      {
        small: '/assets/cards/ebl-classic-small-1.png',
        full: '/assets/cards/ebl-classic-full-1.png',
      },
      {
        small: '/assets/cards/ebl-classic-small-2.png',
        full: '/assets/cards/ebl-classic-full-2.png',
      },
    ],
  },
  {
    id: 7,
    bankId: 3, // BRAC Bank Limited
    name: 'BRAC Bank Platinum Card',
    annualFee: 4000,
    interestRateApr: 24.5,
    loungeAccessInternational: 6,
    loungeAccessDomestic: 12,
    cashAdvanceFee: '2.5% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 1000',
    annualFeeWaiverPolicy: {
      spendThreshold: 300000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 300,000 in a year',
    },
    rewardPointsPolicy: 'Earn 1.5 points for every BDT 100 spent.',
    additionalFeatures: [
      'Airport lounge access',
      'Buy 1 Get 1 movie ticket offers',
      'Dining discounts up to 25% at premium restaurants',
    ],
    sourceUrl: 'https://www.bracbank.com/credit-cards/platinum',
    isActive: true,
    lastUpdated: new Date('2025-05-25'),
    images: [
      {
        small: '/assets/cards/brac-platinum-small-1.png',
        full: '/assets/cards/brac-platinum-full-1.png',
      },
      {
        small: '/assets/cards/brac-platinum-small-2.png',
        full: '/assets/cards/brac-platinum-full-2.png',
      },
    ],
  },
  {
    id: 8,
    bankId: 2, // Standard Chartered Bank
    name: 'SCB Gold Card',
    annualFee: 2500,
    interestRateApr: 26.5,
    loungeAccessInternational: 2,
    loungeAccessDomestic: 6,
    cashAdvanceFee: '2.5% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 900',
    annualFeeWaiverPolicy: {
      spendThreshold: 180000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 180,000 in a year',
    },
    rewardPointsPolicy: 'Earn 1 point for every BDT 60 spent.',
    additionalFeatures: [
      'Weekend dining offers',
      'Fuel surcharge waiver',
      'Movie ticket discounts',
    ],
    sourceUrl: 'https://www.sc.com/bd/credit-cards/gold-card',
    isActive: true,
    lastUpdated: new Date('2025-05-18'),
    images: [
      {
        small: '/assets/cards/scb-gold-small-1.png',
        full: '/assets/cards/scb-gold-full-1.png',
      },
      {
        small: '/assets/cards/scb-gold-small-2.png',
        full: '/assets/cards/scb-gold-full-2.png',
      },
    ],
  },
  {
    id: 9,
    bankId: 5, // City Bank Limited
    name: 'City Visa Classic',
    annualFee: 2000,
    interestRateApr: 27.0,
    loungeAccessInternational: 0,
    loungeAccessDomestic: 3,
    cashAdvanceFee: '3% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 750',
    annualFeeWaiverPolicy: {
      spendThreshold: 120000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 120,000 in a year',
    },
    rewardPointsPolicy: 'Earn 1 point for every BDT 100 spent on retail purchases.',
    additionalFeatures: [
      'Up to 15% discount at select restaurants',
      'EMI facilities at 0% interest at partner stores',
      'Free credit life insurance',
    ],
    sourceUrl: 'https://www.thecitybank.com/cards/visa-classic',
    isActive: true,
    lastUpdated: new Date('2025-05-08'),
    images: [
      {
        small: '/assets/cards/city-visa-classic-small-1.png',
        full: '/assets/cards/city-visa-classic-full-1.png',
      },
      {
        small: '/assets/cards/city-visa-classic-small-2.png',
        full: '/assets/cards/city-visa-classic-full-2.png',
      },
    ],
  },
  {
    id: 10,
    bankId: 4, // Dutch-Bangla Bank Limited
    name: 'DBBL Visa Classic',
    annualFee: 1500,
    interestRateApr: 25.0,
    loungeAccessInternational: 0,
    loungeAccessDomestic: 2,
    cashAdvanceFee: '3% or BDT 500, whichever is higher',
    latePaymentFee: 'BDT 700',
    annualFeeWaiverPolicy: {
      spendThreshold: 100000,
      period: 'yearly',
      conditions: 'Annual fee waived for spending BDT 100,000 in a year',
    },
    rewardPointsPolicy: 'Earn 1 point for every BDT 100 spent on retail purchases.',
    additionalFeatures: [
      'Up to 10% discount at select restaurants',
      'EMI facilities at partner outlets',
      'Free SMS transaction alerts',
    ],
    sourceUrl: 'https://www.dutchbanglabank.com/cards/visa-classic',
    isActive: true,
    lastUpdated: new Date('2025-05-05'),
    images: [
      {
        small: '/assets/cards/dbbl-visa-classic-small-1.png',
        full: '/assets/cards/dbbl-visa-classic-full-1.png',
      },
      {
        small: '/assets/cards/dbbl-visa-classic-small-2.png',
        full: '/assets/cards/dbbl-visa-classic-full-2.png',
      },
    ],
  },
];
