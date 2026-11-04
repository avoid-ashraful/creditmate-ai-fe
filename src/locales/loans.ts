/**
 * UI copy for the loan comparison pages.
 * Bengali strings are drafted and need review by a native speaker before release.
 *
 * Copy discipline (same as the eligibility checker): this page must never
 * promise an approval outcome. The words for "pre-approved" / "guaranteed"
 * must not appear here in either language; figures are estimates computed
 * from published bands and criteria — the lender decides.
 *
 * Rate discipline: prices are bands, never points. Islamic products are
 * priced in expected profit, never interest.
 */

import type { Language } from './types';

export interface LoansCopy {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  intro: string;
  estimateBanner: string;
  typePersonal: string;
  typeHome: string;
  typeCar: string;
  typeSecured: string;
  formHeading: string;
  amountLabel: string;
  amountPlaceholder: string;
  tenureLabel: string;
  tenurePlaceholder: string;
  incomeLabel: string;
  incomeOptional: string;
  incomePlaceholder: string;
  islamicOnly: string;
  runScenario: string;
  running: string;
  amountRequired: string;
  tenureRequired: string;
  segmentFilterLabel: string;
  segmentAll: string;
  catalogueHeading: string;
  resultsHeading: string;
  colProduct: string;
  colLender: string;
  colBand: string;
  colEmi: string;
  colTotalCost: string;
  colFee: string;
  colStatus: string;
  statusFits: string;
  statusCheck: string;
  viewDetails: string;
  bandFromChart: string;
  bandFromAnnexure: string;
  bandFromProductPage: string;
  bandFromSoc: string;
  bandFromManual: string;
  bandChartNote: string;
  noBandNote: string;
  simpleInterestBadge: string;
  islamicBadge: string;
  expectedProfit: string;
  interest: string;
  emiRangeNote: string;
  notesHeading: string;
  capsHeading: string;
  capsIntro: string;
  loadingLabel: string;
  errorResults: string;
  retry: string;
  emptyResults: string;
  detailBack: string;
  detailSeoSuffix: string;
  sectionTerms: string;
  sectionFees: string;
  sectionEligibility: string;
  sectionDocuments: string;
  sectionProvenance: string;
  sectionHistory: string;
  historySignInNote: string;
  historyEmpty: string;
  notPublished: string;
  amountRange: string;
  tenureRange: string;
  months: string;
  ltv: string;
  gracePeriod: string;
  processingFee: string;
  earlySettlement: string;
  partialPrepayment: string;
  penalCharge: string;
  supervisionCharge: string;
  minIncomeBySegment: string;
  incomeMetricGross: string;
  incomeMetricNet: string;
  incomeMetricMixed: string;
  ageRange: string;
  guarantor: string;
  guarantorYes: string;
  guarantorNo: string;
  collateral: string;
  dbr: string;
  sourceLabel: string;
  sourceEffective: string;
  lastVerified: string;
  capFlagsHeading: string;
  rateBasis: string;
  calculatorsLinkText: string;
}

const en: LoansCopy = {
  seoTitle: 'Loan Comparison — Personal, Home, Car & Secured Loans in Bangladesh',
  seoDescription:
    'Compare published loan terms from Bangladeshi banks, BHBFC and IDLC: rate bands, EMI and total-cost ranges, fees, LTV and eligibility — from published sources only.',
  heading: 'Compare Loans',
  intro:
    'Loan prices in Bangladesh are published as bands, not single rates — so we show ranges. Enter an amount and tenure to see the monthly payment and total cost at both ends of each product’s published band.',
  estimateBanner:
    'Figures are estimates computed from published bands and criteria. They are not an approval or an offer: the lender makes the final decision after its own checks.',
  typePersonal: 'Personal',
  typeHome: 'Home',
  typeCar: 'Car',
  typeSecured: 'Secured against deposit',
  formHeading: 'Your loan scenario',
  amountLabel: 'Loan amount (BDT)',
  amountPlaceholder: 'e.g. 1000000',
  tenureLabel: 'Tenure (months)',
  tenurePlaceholder: 'e.g. 60',
  incomeLabel: 'Monthly income (BDT)',
  incomeOptional: 'Optional — used only to flag published income minimums',
  incomePlaceholder: 'e.g. 80000',
  islamicOnly: 'Islamic (Shariah-compliant) products only',
  runScenario: 'Compare this scenario',
  running: 'Comparing…',
  amountRequired: 'Enter an amount above 0.',
  tenureRequired: 'Enter a tenure of at least 1 month.',
  segmentFilterLabel: 'Segment',
  segmentAll: 'All segments',
  catalogueHeading: 'Published products',
  resultsHeading: 'Scenario results',
  colProduct: 'Product',
  colLender: 'Lender',
  colBand: 'Published band',
  colEmi: 'Monthly payment range',
  colTotalCost: 'Total cost range',
  colFee: 'Processing fee',
  colStatus: 'Fit',
  statusFits: 'Fits published criteria',
  statusCheck: 'Check the notes',
  viewDetails: 'View details',
  bandFromChart: 'Bangladesh Bank lending chart',
  bandFromAnnexure: 'Bank Annexure-A',
  bandFromProductPage: 'Product page',
  bandFromSoc: 'Schedule of charges',
  bandFromManual: 'Published scheme terms',
  bandChartNote:
    'Band from the Bangladesh Bank lending chart for this bank — the product page publishes no rate.',
  noBandNote: 'This lender publishes no usable rate band, so no payment estimate is shown.',
  simpleInterestBadge: 'Simple interest',
  islamicBadge: 'Islamic',
  expectedProfit: 'Expected profit',
  interest: 'Interest',
  emiRangeNote:
    'Ranges run from the lowest to the highest rate in the published band. Your actual rate is set by the lender within the band.',
  notesHeading: 'How these figures are calculated',
  capsHeading: 'Bangladesh Bank ceilings that apply',
  capsIntro:
    'These dated ceilings come from Bangladesh Bank circulars. Products published above a ceiling are flagged, not silently corrected.',
  loadingLabel: 'Loading loans…',
  errorResults: 'We could not load loans just now. Please try again.',
  retry: 'Try again',
  emptyResults: 'No products matched. Try another segment or loan type.',
  detailBack: 'Back to loans',
  detailSeoSuffix: 'loan terms, band, fees and eligibility',
  sectionTerms: 'Loan terms',
  sectionFees: 'Fees and charges',
  sectionEligibility: 'Eligibility',
  sectionDocuments: 'Documents checklist',
  sectionProvenance: 'Source and verification',
  sectionHistory: 'Rate and term changes',
  historySignInNote: 'Sign in to see the recorded change history for this product.',
  historyEmpty: 'No changes have been recorded for this product yet.',
  notPublished: 'Not published',
  amountRange: 'Amount',
  tenureRange: 'Tenure',
  months: 'months',
  ltv: 'Loan-to-value (LTV)',
  gracePeriod: 'Grace period',
  processingFee: 'Processing fee',
  earlySettlement: 'Early settlement',
  partialPrepayment: 'Partial prepayment',
  penalCharge: 'Penal / late charge',
  supervisionCharge: 'Supervision charge',
  minIncomeBySegment: 'Published minimum monthly income by segment',
  incomeMetricGross: 'gross income',
  incomeMetricNet: 'net (take-home) income',
  incomeMetricMixed: 'mixed gross/net by segment',
  ageRange: 'Age',
  guarantor: 'Guarantor',
  guarantorYes: 'Required',
  guarantorNo: 'Not required',
  collateral: 'Security / collateral',
  dbr: 'Max debt-burden ratio (DBR)',
  sourceLabel: 'Source',
  sourceEffective: 'Source effective date',
  lastVerified: 'Last verified',
  capFlagsHeading: 'Regulatory ceiling notes',
  rateBasis: 'How the rate is set',
  calculatorsLinkText:
    'Comparing real loan products? See live bands and total costs in Loan Comparison.',
};

const bn: LoansCopy = {
  seoTitle: 'ঋণ তুলনা — বাংলাদেশে ব্যক্তিগত, গৃহ, গাড়ি ও জামানত ঋণ',
  seoDescription:
    'বাংলাদেশি ব্যাংক, বিএইচবিএফসি ও আইডিএলসির প্রকাশিত ঋণ শর্ত তুলনা করুন: হার ব্যান্ড, কিস্তি ও মোট খরচের পরিসর, ফি, এলটিভি ও যোগ্যতা — শুধু প্রকাশিত উৎস থেকে।',
  heading: 'ঋণ তুলনা করুন',
  intro:
    'বাংলাদেশে ঋণের মূল্য একক হার নয়, ব্যান্ড আকারে প্রকাশিত হয় — তাই আমরা পরিসর দেখাই। পরিমাণ ও মেয়াদ দিলে প্রতিটি পণ্যের প্রকাশিত ব্যান্ডের দুই প্রান্তে মাসিক কিস্তি ও মোট খরচ দেখতে পাবেন।',
  estimateBanner:
    'এই হিসাব প্রকাশিত ব্যান্ড ও মানদণ্ড থেকে করা অনুমান মাত্র। এটি অনুমোদন বা প্রস্তাব নয়: নিজস্ব যাচাইয়ের পর চূড়ান্ত সিদ্ধান্ত ঋণদাতা প্রতিষ্ঠান নেয়।',
  typePersonal: 'ব্যক্তিগত',
  typeHome: 'গৃহ',
  typeCar: 'গাড়ি',
  typeSecured: 'আমানতের বিপরীতে জামানত ঋণ',
  formHeading: 'আপনার ঋণের হিসাব',
  amountLabel: 'ঋণের পরিমাণ (টাকা)',
  amountPlaceholder: 'যেমন ১০০০০০০',
  tenureLabel: 'মেয়াদ (মাস)',
  tenurePlaceholder: 'যেমন ৬০',
  incomeLabel: 'মাসিক আয় (টাকা)',
  incomeOptional: 'ঐচ্ছিক — শুধু প্রকাশিত ন্যূনতম আয় যাচাইয়ে ব্যবহৃত',
  incomePlaceholder: 'যেমন ৮০০০০',
  islamicOnly: 'শুধু ইসলামি (শরিয়াহ-সম্মত) পণ্য',
  runScenario: 'এই হিসাবে তুলনা করুন',
  running: 'তুলনা করা হচ্ছে…',
  amountRequired: '০-এর বেশি পরিমাণ লিখুন।',
  tenureRequired: 'কমপক্ষে ১ মাসের মেয়াদ লিখুন।',
  segmentFilterLabel: 'বিভাগ',
  segmentAll: 'সব বিভাগ',
  catalogueHeading: 'প্রকাশিত পণ্য',
  resultsHeading: 'হিসাবের ফলাফল',
  colProduct: 'পণ্য',
  colLender: 'ঋণদাতা',
  colBand: 'প্রকাশিত ব্যান্ড',
  colEmi: 'মাসিক কিস্তির পরিসর',
  colTotalCost: 'মোট খরচের পরিসর',
  colFee: 'প্রসেসিং ফি',
  colStatus: 'মিল',
  statusFits: 'প্রকাশিত মানদণ্ডে মেলে',
  statusCheck: 'নোট দেখুন',
  viewDetails: 'বিস্তারিত দেখুন',
  bandFromChart: 'বাংলাদেশ ব্যাংক ঋণ চার্ট',
  bandFromAnnexure: 'ব্যাংক অ্যানেক্সার-এ',
  bandFromProductPage: 'পণ্যের পৃষ্ঠা',
  bandFromSoc: 'চার্জের তালিকা',
  bandFromManual: 'প্রকাশিত স্কিম শর্ত',
  bandChartNote:
    'এই ব্যাংকের জন্য বাংলাদেশ ব্যাংক ঋণ চার্ট থেকে ব্যান্ড — পণ্যের পৃষ্ঠায় হার প্রকাশিত নয়।',
  noBandNote: 'এই ঋণদাতা ব্যবহারযোগ্য হার ব্যান্ড প্রকাশ করে না, তাই কিস্তির অনুমান দেখানো হয়নি।',
  simpleInterestBadge: 'সরল সুদ',
  islamicBadge: 'ইসলামি',
  expectedProfit: 'প্রত্যাশিত মুনাফা',
  interest: 'সুদ',
  emiRangeNote:
    'পরিসর প্রকাশিত ব্যান্ডের সর্বনিম্ন থেকে সর্বোচ্চ হার পর্যন্ত। আপনার প্রকৃত হার ব্যান্ডের মধ্যে ঋণদাতা নির্ধারণ করবে।',
  notesHeading: 'এই হিসাব কীভাবে করা হয়',
  capsHeading: 'প্রযোজ্য বাংলাদেশ ব্যাংক সর্বোচ্চ সীমা',
  capsIntro:
    'এই তারিখযুক্ত সীমাগুলো বাংলাদেশ ব্যাংকের সার্কুলার থেকে নেওয়া। সীমার ঊর্ধ্বে প্রকাশিত পণ্য নীরবে সংশোধন না করে চিহ্নিত করা হয়।',
  loadingLabel: 'ঋণ লোড হচ্ছে…',
  errorResults: 'এই মুহূর্তে ঋণ লোড করা যায়নি। আবার চেষ্টা করুন।',
  retry: 'আবার চেষ্টা করুন',
  emptyResults: 'কোনো পণ্য মেলেনি। অন্য বিভাগ বা ঋণের ধরন চেষ্টা করুন।',
  detailBack: 'ঋণের তালিকায় ফিরুন',
  detailSeoSuffix: 'ঋণের শর্ত, ব্যান্ড, ফি ও যোগ্যতা',
  sectionTerms: 'ঋণের শর্ত',
  sectionFees: 'ফি ও চার্জ',
  sectionEligibility: 'যোগ্যতা',
  sectionDocuments: 'প্রয়োজনীয় নথির তালিকা',
  sectionProvenance: 'উৎস ও যাচাই',
  sectionHistory: 'হার ও শর্তের পরিবর্তন',
  historySignInNote: 'এই পণ্যের রেকর্ডকৃত পরিবর্তনের ইতিহাস দেখতে সাইন ইন করুন।',
  historyEmpty: 'এই পণ্যে এখনো কোনো পরিবর্তন রেকর্ড হয়নি।',
  notPublished: 'প্রকাশিত নয়',
  amountRange: 'পরিমাণ',
  tenureRange: 'মেয়াদ',
  months: 'মাস',
  ltv: 'ঋণ-মূল্য অনুপাত (এলটিভি)',
  gracePeriod: 'গ্রেস পিরিয়ড',
  processingFee: 'প্রসেসিং ফি',
  earlySettlement: 'আগাম পরিশোধ',
  partialPrepayment: 'আংশিক আগাম পরিশোধ',
  penalCharge: 'জরিমানা / বিলম্ব চার্জ',
  supervisionCharge: 'তদারকি চার্জ',
  minIncomeBySegment: 'বিভাগ অনুযায়ী প্রকাশিত ন্যূনতম মাসিক আয়',
  incomeMetricGross: 'মোট আয়',
  incomeMetricNet: 'নিট (হাতে পাওয়া) আয়',
  incomeMetricMixed: 'বিভাগ অনুযায়ী মোট/নিট মিশ্র',
  ageRange: 'বয়স',
  guarantor: 'জামিনদার',
  guarantorYes: 'প্রয়োজন',
  guarantorNo: 'প্রয়োজন নেই',
  collateral: 'জামানত',
  dbr: 'সর্বোচ্চ ঋণ-বোঝা অনুপাত (ডিবিআর)',
  sourceLabel: 'উৎস',
  sourceEffective: 'উৎসের কার্যকর তারিখ',
  lastVerified: 'সর্বশেষ যাচাই',
  capFlagsHeading: 'নিয়ন্ত্রক সীমা সংক্রান্ত নোট',
  rateBasis: 'হার নির্ধারণের পদ্ধতি',
  calculatorsLinkText: 'আসল ঋণ পণ্য তুলনা করছেন? ঋণ তুলনায় লাইভ ব্যান্ড ও মোট খরচ দেখুন।',
};

export const LOANS_COPY: Record<Language, LoansCopy> = { en, bn };

export const getLoansCopy = (lang: Language): LoansCopy => LOANS_COPY[lang];

/** Human labels for the segment tags used across the catalogue. */
export const SEGMENT_LABELS: Record<string, { en: string; bn: string }> = {
  salaried: { en: 'Salaried', bn: 'চাকরিজীবী' },
  professional: { en: 'Professional', bn: 'পেশাজীবী' },
  business: { en: 'Business', bn: 'ব্যবসায়ী' },
  landlord: { en: 'Landlord', bn: 'বাড়িওয়ালা' },
  women: { en: 'Women', bn: 'নারী' },
  nrb: { en: 'NRB', bn: 'প্রবাসী' },
  doctors: { en: 'Doctors', bn: 'চিকিৎসক' },
  education: { en: 'Education', bn: 'শিক্ষা' },
  salary: { en: 'Salary', bn: 'বেতন' },
  ev: { en: 'EV / Hybrid', bn: 'ইভি / হাইব্রিড' },
  self_employed: { en: 'Self-employed', bn: 'স্ব-কর্মসংস্থান' },
};

export const segmentLabel = (tag: string, lang: Language): string =>
  SEGMENT_LABELS[tag]?.[lang] ?? tag.replace(/_/g, ' ');
