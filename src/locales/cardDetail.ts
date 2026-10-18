/**
 * UI copy for the card detail page.
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Language } from './types';

export interface CardDetailCopy {
  // Page states
  loading: string;
  errorInvalidUrl: string;
  errorNotFound: string;
  errorLoadFailed: string;
  notFoundTitle: string;
  notFoundFallback: string;
  backToHome: string;
  compareCards: string;
  updating: string;

  // SEO
  seoBankFallback: string;
  /** Placeholders: {name}, {bank} */
  seoTitle: string;
  /** Placeholders: {name}, {bank}, {fee}, {apr} */
  seoDescription: string;

  // Header / key metrics
  breadcrumbLabel: string;
  breadcrumbHome: string;
  cardInsight: string;
  annualFee: string;
  apr: string;
  internationalLounge: string;
  domesticLounge: string;
  applyNow: string;
  openingApplication: string;

  // Formatting
  dataNotAvailable: string;
  noAnnualFee: string;
  bdt: string;
  na: string;
  none: string;
  unknown: string;
  yes: string;
  no: string;

  // Pros and cons
  prosConsHeading: string;
  prosConsNote: string;
  pros: string;
  considerations: string;
  /** Placeholder: {value} */
  proInternationalLounge: string;
  /** Placeholder: {value} */
  proDomesticLounge: string;
  proFeeWaiver: string;
  proRewards: string;
  proAdditionalBenefits: string;
  /** Placeholder: {fee} */
  conAnnualFee: string;
  /** Placeholder: {apr} */
  conHighApr: string;
  conCashAdvanceFee: string;
  conNoLounge: string;
  conLoungeUnknown: string;

  // Specs table
  specsHeading: string;
  specCardName: string;
  specBank: string;
  specAnnualFee: string;
  specApr: string;
  specInternationalLounge: string;
  specDomesticLounge: string;
  specCashAdvanceFee: string;
  specLatePaymentFee: string;
  specRewardsPolicy: string;
  specFeeWaiverPolicy: string;
  specAdditionalFeatures: string;
  specCardStatus: string;
  specLastUpdated: string;
  specOfficialSource: string;
  statusActive: string;
  statusInactive: string;
  bankWebsite: string;

  // Fee waiver calculator
  waiverHeading: string;
  /** Placeholders: {fee}, {threshold} */
  waiverSummary: string;
  /** Placeholder: {amount} */
  waiverMonthly: string;

  // Fee waiver policy field labels (known keys; unknown keys are humanized)
  waiverKeyConditions: string;
  waiverKeySpendThreshold: string;
  waiverKeyPeriod: string;
  waiverPeriodYearly: string;
  waiverPeriodMonthly: string;

  // Additional features / similar cards
  additionalFeaturesHeading: string;
  /** Placeholder: {bank} */
  similarCardsHeading: string;
  viewDetails: string;
  /** Placeholder: {name} */
  viewDetailsFor: string;
}

export const CARD_DETAIL_COPY: Record<Language, CardDetailCopy> = {
  en: {
    loading: 'Loading card details...',
    errorInvalidUrl: 'Invalid card URL',
    errorNotFound: 'Card not found',
    errorLoadFailed: 'Failed to load card details. Please try again.',
    notFoundTitle: 'Card Not Found',
    notFoundFallback: 'The card you are looking for does not exist.',
    backToHome: 'Back to Home',
    compareCards: 'Compare Cards',
    updating: 'Updating…',

    seoBankFallback: 'a Bangladeshi bank',
    seoTitle: '{name} from {bank} | CreditMate AI',
    seoDescription: '{name} from {bank}. Annual fee: {fee}. APR: {apr}',

    breadcrumbLabel: 'Breadcrumb',
    breadcrumbHome: 'Home',
    cardInsight: 'Card insight',
    annualFee: 'Annual Fee',
    apr: 'APR',
    internationalLounge: 'International Lounge',
    domesticLounge: 'Domestic Lounge',
    applyNow: 'Apply Now',
    openingApplication: 'Opening application...',

    dataNotAvailable: 'Data not available',
    noAnnualFee: 'No annual fee',
    bdt: 'BDT',
    na: 'N/A',
    none: 'None',
    unknown: 'Unknown',
    yes: 'Yes',
    no: 'No',

    prosConsHeading: 'Pros & Cons',
    prosConsNote:
      'Highlights are generated from published card fields. The APR comparison flag uses a 20% threshold.',
    pros: 'Pros',
    considerations: 'Considerations',
    proInternationalLounge: '{value} international lounge access',
    proDomesticLounge: '{value} domestic lounge access',
    proFeeWaiver: 'Annual fee waiver available',
    proRewards: 'Rewards program available',
    proAdditionalBenefits: 'Multiple additional benefits',
    conAnnualFee: 'Annual fee of {fee}',
    conHighApr: 'Higher interest rate at {apr}% APR',
    conCashAdvanceFee: 'Cash advance fee:',
    conNoLounge: 'No lounge access included',
    conLoungeUnknown: 'Lounge access data not available',

    specsHeading: 'Complete Specifications',
    specCardName: 'Card Name',
    specBank: 'Bank',
    specAnnualFee: 'Annual Fee',
    specApr: 'Interest Rate (APR)',
    specInternationalLounge: 'International Lounge Access',
    specDomesticLounge: 'Domestic Lounge Access',
    specCashAdvanceFee: 'Cash Advance Fee',
    specLatePaymentFee: 'Late Payment Fee',
    specRewardsPolicy: 'Rewards Policy',
    specFeeWaiverPolicy: 'Annual Fee Waiver Policy',
    specAdditionalFeatures: 'Additional Features',
    specCardStatus: 'Card Status',
    specLastUpdated: 'Last Updated',
    specOfficialSource: 'Official Source',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    bankWebsite: 'Bank website',

    waiverHeading: 'Fee Waiver Calculator',
    waiverSummary:
      'You can waive the annual fee of {fee} by spending at least {threshold} per year.',
    waiverMonthly: 'That’s approximately {amount} per month.',

    waiverKeyConditions: 'Conditions',
    waiverKeySpendThreshold: 'Spend threshold',
    waiverKeyPeriod: 'Period',
    waiverPeriodYearly: 'Yearly',
    waiverPeriodMonthly: 'Monthly',

    additionalFeaturesHeading: 'Additional Features',
    similarCardsHeading: 'Similar Cards from {bank}',
    viewDetails: 'View Details',
    viewDetailsFor: 'View details for {name}',
  },
  bn: {
    loading: 'কার্ডের বিবরণ লোড হচ্ছে...',
    errorInvalidUrl: 'কার্ডের লিংকটি সঠিক নয়',
    errorNotFound: 'কার্ড পাওয়া যায়নি',
    errorLoadFailed: 'কার্ডের বিবরণ লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
    notFoundTitle: 'কার্ড পাওয়া যায়নি',
    notFoundFallback: 'আপনি যে কার্ডটি খুঁজছেন তা নেই।',
    backToHome: 'হোমে ফিরে যান',
    compareCards: 'কার্ড তুলনা',
    updating: 'হালনাগাদ হচ্ছে…',

    seoBankFallback: 'একটি বাংলাদেশি ব্যাংক',
    seoTitle: '{bank}-এর {name} | CreditMate AI',
    seoDescription: '{bank}-এর {name}। বার্ষিক ফি: {fee}। এপিআর: {apr}',

    breadcrumbLabel: 'পথনির্দেশ',
    breadcrumbHome: 'হোম',
    cardInsight: 'কার্ডের সারসংক্ষেপ',
    annualFee: 'বার্ষিক ফি',
    apr: 'এপিআর',
    internationalLounge: 'আন্তর্জাতিক লাউঞ্জ',
    domesticLounge: 'অভ্যন্তরীণ লাউঞ্জ',
    applyNow: 'এখনই আবেদন করুন',
    openingApplication: 'আবেদন পেজ খোলা হচ্ছে...',

    dataNotAvailable: 'তথ্য পাওয়া যায়নি',
    noAnnualFee: 'বার্ষিক ফি নেই',
    bdt: '৳',
    na: 'প্রযোজ্য নয়',
    none: 'নেই',
    unknown: 'অজানা',
    yes: 'হ্যাঁ',
    no: 'না',

    prosConsHeading: 'সুবিধা ও বিবেচ্য বিষয়',
    prosConsNote:
      'হাইলাইটগুলো প্রকাশিত কার্ড তথ্য থেকে তৈরি। এপিআর তুলনার চিহ্নে ২০% সীমা ধরা হয়েছে।',
    pros: 'সুবিধা',
    considerations: 'বিবেচ্য বিষয়',
    proInternationalLounge: '{value} আন্তর্জাতিক লাউঞ্জ সুবিধা',
    proDomesticLounge: '{value} অভ্যন্তরীণ লাউঞ্জ সুবিধা',
    proFeeWaiver: 'বার্ষিক ফি মওকুফের সুযোগ আছে',
    proRewards: 'রিওয়ার্ড প্রোগ্রাম আছে',
    proAdditionalBenefits: 'একাধিক অতিরিক্ত সুবিধা',
    conAnnualFee: 'বার্ষিক ফি {fee}',
    conHighApr: 'তুলনামূলক বেশি সুদের হার: {apr}% এপিআর',
    conCashAdvanceFee: 'ক্যাশ অ্যাডভান্স ফি:',
    conNoLounge: 'লাউঞ্জ সুবিধা অন্তর্ভুক্ত নেই',
    conLoungeUnknown: 'লাউঞ্জ সুবিধার তথ্য পাওয়া যায়নি',

    specsHeading: 'সম্পূর্ণ বিবরণ',
    specCardName: 'কার্ডের নাম',
    specBank: 'ব্যাংক',
    specAnnualFee: 'বার্ষিক ফি',
    specApr: 'সুদের হার (এপিআর)',
    specInternationalLounge: 'আন্তর্জাতিক লাউঞ্জ সুবিধা',
    specDomesticLounge: 'অভ্যন্তরীণ লাউঞ্জ সুবিধা',
    specCashAdvanceFee: 'ক্যাশ অ্যাডভান্স ফি',
    specLatePaymentFee: 'বিলম্বে পরিশোধের ফি',
    specRewardsPolicy: 'রিওয়ার্ড নীতি',
    specFeeWaiverPolicy: 'বার্ষিক ফি মওকুফ নীতি',
    specAdditionalFeatures: 'অতিরিক্ত সুবিধা',
    specCardStatus: 'কার্ডের অবস্থা',
    specLastUpdated: 'সর্বশেষ হালনাগাদ',
    specOfficialSource: 'অফিসিয়াল সূত্র',
    statusActive: 'সক্রিয়',
    statusInactive: 'নিষ্ক্রিয়',
    bankWebsite: 'ব্যাংকের ওয়েবসাইট',

    waiverHeading: 'ফি মওকুফ ক্যালকুলেটর',
    waiverSummary: 'বছরে কমপক্ষে {threshold} খরচ করলে আপনি {fee} বার্ষিক ফি মওকুফ করতে পারবেন।',
    waiverMonthly: 'এটি মাসে প্রায় {amount}।',

    waiverKeyConditions: 'শর্ত',
    waiverKeySpendThreshold: 'খরচের সীমা',
    waiverKeyPeriod: 'মেয়াদ',
    waiverPeriodYearly: 'বার্ষিক',
    waiverPeriodMonthly: 'মাসিক',

    additionalFeaturesHeading: 'অতিরিক্ত সুবিধা',
    similarCardsHeading: '{bank}-এর অন্যান্য কার্ড',
    viewDetails: 'বিস্তারিত দেখুন',
    viewDetailsFor: '{name}-এর বিস্তারিত দেখুন',
  },
};

/** Fills `{key}` placeholders in a copy template. */
export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}

export function getCardDetailCopy(lang: Language): CardDetailCopy {
  return CARD_DETAIL_COPY[lang];
}
