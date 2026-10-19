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

  // Structured rewards section
  rewardsHeading: string;
  rewardsProgram: string;
  rewardsEarnRules: string;
  rewardsCashbackRules: string;
  rewardsPointValue: string;
  rewardsPointValueNone: string;
  rewardsExpiry: string;
  rewardsSourceLabel: string;
  rewardCategoryAll: string;
  rewardCategoryDining: string;
  rewardCategoryTravel: string;
  rewardCategoryGroceries: string;
  rewardCategoryFuel: string;
  rewardCategoryOnline: string;
  rewardCategoryInternational: string;
  rewardCategoryOther: string;
  /** Placeholders: {points}, {unit} */
  rewardsEarnRuleSummary: string;
  /** Placeholder: {percent} */
  rewardsCashbackSummary: string;

  // Additional features / similar cards
  additionalFeaturesHeading: string;
  /** Placeholder: {bank} */
  similarCardsHeading: string;
  viewDetails: string;
  /** Placeholder: {name} */
  viewDetailsFor: string;

  // Trust & data-quality fields
  applyOnBankSite: string;
  /** Secondary link shown instead of the apply CTA when a card has only a source URL */
  viewFeeSchedule: string;
  sourceLabel: string;
  sourceScheduleOfCharges: string;
  /** Placeholder: {date} */
  verifiedOn: string;
  dataDisclaimer: string;
  disclaimerLink: string;
  specNetwork: string;
  specIslamic: string;
  specDualCurrency: string;
  specMinIncome: string;
  specSupplementaryFee: string;
  specForeignTransactionFee: string;
  specProfitFeeShariah: string;
  islamicBadge: string;
  islamicValue: string;
  conventionalValue: string;
  /** Network display names; '' key is unknown */
  networkVisa: string;
  networkMastercard: string;
  networkAmex: string;
  networkUnionpay: string;
  networkJcb: string;
  networkDiners: string;
  networkOther: string;
  /** Placeholder: {amount} (per month) */
  minIncomePerMonth: string;

  // Report incorrect data dialog
  reportButton: string;
  reportTitle: string;
  reportIntro: string;
  reportFieldLabel: string;
  reportFieldAny: string;
  reportMessageLabel: string;
  reportSuggestedLabel: string;
  reportEmailLabel: string;
  reportEmailHint: string;
  reportSubmit: string;
  reportSubmitting: string;
  reportCancel: string;
  reportClose: string;
  reportMessageRequired: string;
  reportSuccess: string;
  reportThrottled: string;
  reportError: string;
  /** Human labels for reportable card fields, keyed by API field name */
  reportFields: Record<string, string>;
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

    // Structured rewards section
    rewardsHeading: 'Rewards',
    rewardsProgram: 'Reward program',
    rewardsEarnRules: 'Points earn rules',
    rewardsCashbackRules: 'Cashback rules',
    rewardsPointValue: 'Point value (stated by the bank)',
    rewardsPointValueNone: 'Not published by the bank',
    rewardsExpiry: 'Points expiry',
    rewardsSourceLabel: 'Reward terms source:',
    rewardCategoryAll: 'All spending',
    rewardCategoryDining: 'Dining',
    rewardCategoryTravel: 'Travel',
    rewardCategoryGroceries: 'Groceries',
    rewardCategoryFuel: 'Fuel',
    rewardCategoryOnline: 'Online',
    rewardCategoryInternational: 'International',
    rewardCategoryOther: 'Other',
    /** Placeholders: {points}, {unit} */
    rewardsEarnRuleSummary: '{points} points per BDT {unit}',
    /** Placeholder: {percent} */
    rewardsCashbackSummary: '{percent}% cashback',

    additionalFeaturesHeading: 'Additional Features',
    similarCardsHeading: 'Similar Cards from {bank}',
    viewDetails: 'View Details',
    viewDetailsFor: 'View details for {name}',

    applyOnBankSite: 'Apply on bank website',
    viewFeeSchedule: 'View fee schedule',
    sourceLabel: 'Source:',
    sourceScheduleOfCharges: 'Bank schedule of charges',
    verifiedOn: 'Verified on {date}',
    dataDisclaimer:
      'Card terms can change without notice. Confirm current terms with the bank before applying.',
    disclaimerLink: 'Read our disclaimer',
    specNetwork: 'Card Network',
    specIslamic: 'Islamic (Shariah-compliant)',
    specDualCurrency: 'Dual Currency',
    specMinIncome: 'Minimum Monthly Income',
    specSupplementaryFee: 'Supplementary Card Fee',
    specForeignTransactionFee: 'Foreign Transaction Fee',
    specProfitFeeShariah: 'Profit/fee (Shariah)',
    islamicBadge: 'Islamic',
    islamicValue: 'Yes, Shariah-compliant',
    conventionalValue: 'No, conventional',
    networkVisa: 'Visa',
    networkMastercard: 'Mastercard',
    networkAmex: 'American Express',
    networkUnionpay: 'UnionPay',
    networkJcb: 'JCB',
    networkDiners: 'Diners Club',
    networkOther: 'Other network',
    minIncomePerMonth: '{amount} per month',

    reportButton: 'Report incorrect data',
    reportTitle: 'Report incorrect data',
    reportIntro:
      'Spotted something wrong on this card? Tell us and our team will review it against the bank’s published terms.',
    reportFieldLabel: 'Which detail is wrong? (optional)',
    reportFieldAny: 'Not sure / something else',
    reportMessageLabel: 'What is incorrect?',
    reportSuggestedLabel: 'Correct value, if you know it (optional)',
    reportEmailLabel: 'Your email (optional)',
    reportEmailHint: 'Only used if we need to follow up. It is not shown publicly.',
    reportSubmit: 'Send report',
    reportSubmitting: 'Sending…',
    reportCancel: 'Cancel',
    reportClose: 'Close',
    reportMessageRequired: 'Please describe what is incorrect.',
    reportSuccess: 'Thank you. Your report was received and will be reviewed.',
    reportThrottled: 'Too many reports from your network. Please try again later.',
    reportError: 'Could not send your report. Please check your details and try again.',
    reportFields: {
      name: 'Card name',
      annual_fee: 'Annual fee',
      interest_rate_apr: 'Interest rate (APR)',
      lounge_access_international: 'International lounge access',
      lounge_access_domestic: 'Domestic lounge access',
      lounge_access_condition: 'Lounge access condition',
      cash_advance_fee: 'Cash advance fee',
      late_payment_fee: 'Late payment fee',
      annual_fee_waiver_policy: 'Annual fee waiver policy',
      reward_points_policy: 'Rewards policy',
      additional_features: 'Additional features',
      source_url: 'Source link',
      apply_url: 'Apply link',
      card_network: 'Card network',
      is_islamic: 'Islamic (Shariah-compliant)',
      is_dual_currency: 'Dual currency',
      min_monthly_income: 'Minimum monthly income',
      supplementary_card_fee: 'Supplementary card fee',
      foreign_transaction_fee: 'Foreign transaction fee',
    },
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

    // Structured rewards section
    rewardsHeading: 'রিওয়ার্ড',
    rewardsProgram: 'রিওয়ার্ড প্রোগ্রাম',
    rewardsEarnRules: 'পয়েন্ট আর্ন নিয়ম',
    rewardsCashbackRules: 'ক্যাশব্যাক নিয়ম',
    rewardsPointValue: 'পয়েন্ট মূল্য (ব্যাংক-ঘোষিত)',
    rewardsPointValueNone: 'ব্যাংক পয়েন্টের মূল্য প্রকাশ করেনি',
    rewardsExpiry: 'পয়েন্টের মেয়াদোত্তীর্ণ',
    rewardsSourceLabel: 'রিওয়ার্ড শর্তের উৎস:',
    rewardCategoryAll: 'সব খরচ',
    rewardCategoryDining: 'খাবার',
    rewardCategoryTravel: 'ভ্রমণ',
    rewardCategoryGroceries: 'কিরানা',
    rewardCategoryFuel: 'ইঞ্জিন তেল',
    rewardCategoryOnline: 'অনলাইন',
    rewardCategoryInternational: 'আন্তর্জাতিক',
    rewardCategoryOther: 'অন্যান্য',
    /** Placeholders: {points}, {unit} */
    rewardsEarnRuleSummary: 'প্রতি বিডিটি {unit} খরচে {points} পয়েন্ট',
    /** Placeholder: {percent} */
    rewardsCashbackSummary: '{percent}% ক্যাশব্যাক',

    additionalFeaturesHeading: 'অতিরিক্ত সুবিধা',
    similarCardsHeading: '{bank}-এর অন্যান্য কার্ড',
    viewDetails: 'বিস্তারিত দেখুন',
    viewDetailsFor: '{name}-এর বিস্তারিত দেখুন',

    applyOnBankSite: 'ব্যাংকের ওয়েবসাইটে আবেদন করুন',
    viewFeeSchedule: 'ফি তালিকা দেখুন',
    sourceLabel: 'সূত্র:',
    sourceScheduleOfCharges: 'ব্যাংকের চার্জ তালিকা',
    verifiedOn: '{date} তারিখে যাচাই করা হয়েছে',
    dataDisclaimer:
      'কার্ডের শর্ত আগাম নোটিশ ছাড়াই বদলাতে পারে। আবেদনের আগে ব্যাংকের কাছ থেকে বর্তমান শর্ত নিশ্চিত করুন।',
    disclaimerLink: 'দাবিত্যাগ পড়ুন',
    specNetwork: 'কার্ড নেটওয়ার্ক',
    specIslamic: 'ইসলামিক (শরিয়াহ-সম্মত)',
    specDualCurrency: 'ডুয়াল কারেন্সি',
    specMinIncome: 'ন্যূনতম মাসিক আয়',
    specSupplementaryFee: 'সম্পূরক কার্ডের ফি',
    specForeignTransactionFee: 'বৈদেশিক লেনদেন ফি',
    specProfitFeeShariah: 'মুনাফা/ফি (শরিয়াহ)',
    islamicBadge: 'ইসলামিক',
    islamicValue: 'হ্যাঁ, শরিয়াহ-সম্মত',
    conventionalValue: 'না, প্রচলিত',
    networkVisa: 'ভিসা',
    networkMastercard: 'মাস্টারকার্ড',
    networkAmex: 'আমেরিকান এক্সপ্রেস',
    networkUnionpay: 'ইউনিয়নপে',
    networkJcb: 'জেসিবি',
    networkDiners: 'ডাইনার্স ক্লাব',
    networkOther: 'অন্য নেটওয়ার্ক',
    minIncomePerMonth: 'মাসে {amount}',

    reportButton: 'ভুল তথ্য জানান',
    reportTitle: 'ভুল তথ্য জানান',
    reportIntro:
      'এই কার্ডে কোনো ভুল চোখে পড়েছে? আমাদের জানান, ব্যাংকের প্রকাশিত শর্তের সাথে মিলিয়ে আমাদের দল বিষয়টি দেখবে।',
    reportFieldLabel: 'কোন তথ্যটি ভুল? (ঐচ্ছিক)',
    reportFieldAny: 'নিশ্চিত নই / অন্য কিছু',
    reportMessageLabel: 'কী ভুল আছে?',
    reportSuggestedLabel: 'সঠিক মান জানা থাকলে লিখুন (ঐচ্ছিক)',
    reportEmailLabel: 'আপনার ইমেইল (ঐচ্ছিক)',
    reportEmailHint: 'যোগাযোগের প্রয়োজন হলেই ব্যবহার করা হবে। এটি প্রকাশ্যে দেখানো হয় না।',
    reportSubmit: 'রিপোর্ট পাঠান',
    reportSubmitting: 'পাঠানো হচ্ছে…',
    reportCancel: 'বাতিল',
    reportClose: 'বন্ধ করুন',
    reportMessageRequired: 'অনুগ্রহ করে কী ভুল আছে তা লিখুন।',
    reportSuccess: 'ধন্যবাদ। আপনার রিপোর্ট পেয়েছি, এটি পর্যালোচনা করা হবে।',
    reportThrottled:
      'আপনার নেটওয়ার্ক থেকে অনেক বেশি রিপোর্ট পাঠানো হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।',
    reportError: 'রিপোর্ট পাঠানো যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।',
    reportFields: {
      name: 'কার্ডের নাম',
      annual_fee: 'বার্ষিক ফি',
      interest_rate_apr: 'সুদের হার (এপিআর)',
      lounge_access_international: 'আন্তর্জাতিক লাউঞ্জ সুবিধা',
      lounge_access_domestic: 'অভ্যন্তরীণ লাউঞ্জ সুবিধা',
      lounge_access_condition: 'লাউঞ্জ সুবিধার শর্ত',
      cash_advance_fee: 'ক্যাশ অ্যাডভান্স ফি',
      late_payment_fee: 'বিলম্বে পরিশোধের ফি',
      annual_fee_waiver_policy: 'বার্ষিক ফি মওকুফ নীতি',
      reward_points_policy: 'রিওয়ার্ড নীতি',
      additional_features: 'অতিরিক্ত সুবিধা',
      source_url: 'সূত্রের লিংক',
      apply_url: 'আবেদনের লিংক',
      card_network: 'কার্ড নেটওয়ার্ক',
      is_islamic: 'ইসলামিক (শরিয়াহ-সম্মত)',
      is_dual_currency: 'ডুয়াল কারেন্সি',
      min_monthly_income: 'ন্যূনতম মাসিক আয়',
      supplementary_card_fee: 'সম্পূরক কার্ডের ফি',
      foreign_transaction_fee: 'বৈদেশিক লেনদেন ফি',
    },
  },
};

/** Fills `{key}` placeholders in a copy template. */
export function fillCopy(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}

/** Display name for a card network; '' / undefined (unknown) returns null. */
export function getNetworkLabel(copy: CardDetailCopy, network?: string): string | null {
  const labels: Record<string, string> = {
    visa: copy.networkVisa,
    mastercard: copy.networkMastercard,
    amex: copy.networkAmex,
    unionpay: copy.networkUnionpay,
    jcb: copy.networkJcb,
    diners: copy.networkDiners,
    other: copy.networkOther,
  };
  return network ? labels[network] ?? null : null;
}

export function getCardDetailCopy(lang: Language): CardDetailCopy {
  return CARD_DETAIL_COPY[lang];
}
