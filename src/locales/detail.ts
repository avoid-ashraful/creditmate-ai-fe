/**
 * UI copy for the shared detail-page grammar (redesign plan Section
 * 4.12): sticky summaries, scenario carry-forward strips, similar
 * products and eligibility signals used by all four detail pages.
 * Bengali strings are drafted and need review by a native speaker
 * before release.
 */

import type { Language } from './types';

export interface DetailCopy {
  // Shortlist actions on detail pages
  addToShortlist: string;
  inShortlist: string;

  // Card summary
  /** Accessible name for the sticky summary aside on detail pages. */
  summaryAsideLabel: string;
  scoreHeroLabel: string;
  scoreHowCalculated: string;
  /** Placeholders: {spend} */
  estNetValueLabel: string;
  estNetValueNote: string;
  estValueNote: string;
  feeHeroLabel: string;
  checkEligibility: string;
  eligibilitySignalLabel: string;
  eligibilityFromSession: string;

  // Verdict strip
  verdictScore: string;
  verdictNetValue: string;
  verdictAnnualFee: string;

  // Card tabs
  tabFees: string;
  // Fee anatomy (Phase 4, addendum B5)
  anatomyHeading: string;
  anatomyIntro: string;
  anatomyRewardsLayer: string;
  anatomyFeeLayer: string;
  anatomyWaiverLayer: string;
  /** Template: {threshold} — spend needed to waive the fee. */
  anatomyWaiverUnmet: string;
  anatomyWaiverMet: string;
  anatomyTotalLabel: string;
  anatomyTotalPartialNote: string;
  anatomyNoTotal: string;
  tabRewards: string;
  tabEligibility: string;
  tabFeatures: string;
  tabReviews: string;
  tabsLabel: string;

  // Similar products
  similarCardsHeading: string;
  similarReasonPrefix: string;
  /** Placeholders: {network} */
  similarReasonSameNetwork: string;
  similarReasonLowerFee: string;
  similarReasonCloseScore: string;
  similarReasonTopScore: string;

  // Scenario carry-forward strips
  loanScenarioHeading: string;
  depositScenarioHeading: string;
  accountScenarioHeading: string;
  loanAmountLabel: string;
  tenureMonthsLabel: string;
  depositAmountLabel: string;
  instalmentLabel: string;
  monthsLabel: string;
  balanceLabel: string;
  scenarioLoading: string;
  scenarioError: string;
  scenarioNotRanked: string;
  /** TrustChip date label when a product has a source but no verification date. */
  trustChipUnverified: string;
  emiAtLowRate: string;
  emiAtHighRate: string;
  totalAtLowRate: string;
  totalAtHighRate: string;
  grossMaturityLabel: string;
  interestEarnedLabel: string;
  taxDeductedLabel: string;
  netMaturityLabel: string;
  effectiveYieldLabel: string;
  netAnnualValueLabel: string;
  interestAtBalanceLabel: string;
  feesPerYearLabel: string;
  /** Placeholders: {balance} */
  accountBreakdownNote: string;

  // Bank hubs
  hubDepositsHeading: string;
  hubLoansHeading: string;
  hubAccountsHeading: string;
  hubCardsHeading: string;
  hubViewDeposits: string;
  hubViewLoans: string;
  hubViewAccounts: string;
  hubBestFdrRate: string;
  hubLoanBandRange: string;
  hubFlagshipCard: string;
  hubLastVerified: string;
  hubProductsCount: string;
  indexLastVerified: string;
  indexDepositsLabel: string;
  indexLoansLabel: string;
  indexAccountsLabel: string;
  indexCountsLabel: string;
}

const DETAIL_COPY: Record<Language, DetailCopy> = {
  en: {
    addToShortlist: 'Add to shortlist',
    inShortlist: 'In shortlist',

    summaryAsideLabel: 'Card summary',
    scoreHeroLabel: 'CreditMate Score',
    scoreHowCalculated: "How it's calculated",
    estNetValueLabel: 'Estimated net value a year at your {spend} monthly spend',
    estNetValueNote:
      "Estimated reward value minus the annual fee, using the bank's published point value and base earn rates. An estimate, not a promise.",
    estValueNote:
      "Estimated reward value at your spend, using the bank's published point value and base earn rates. The annual fee is not deducted here.",
    feeHeroLabel: 'Annual fee',
    checkEligibility: 'Check eligibility',
    eligibilitySignalLabel: 'Your eligibility check this session',
    eligibilityFromSession: 'From your eligibility check this session',

    verdictScore: 'CreditMate Score',
    verdictNetValue: 'Est. net value a year',
    verdictAnnualFee: 'Annual fee',

    tabFees: 'Fees & charges',
    anatomyHeading: 'How the net value is built',
    anatomyIntro:
      'The estimated net value for this card, layer by layer. Every layer is a published figure or your own profile spend — nothing is estimated in place of a missing number.',
    anatomyRewardsLayer: 'Reward value at your spend',
    anatomyFeeLayer: 'Annual fee',
    anatomyWaiverLayer: 'Fee waiver at your spend',
    anatomyWaiverUnmet: 'Spend {threshold} in a year to waive the fee',
    anatomyWaiverMet: 'Your spend meets the waiver threshold',
    anatomyTotalLabel: 'Estimated net value a year',
    anatomyTotalPartialNote: 'The total counts the published layers only.',
    anatomyNoTotal:
      "A net value can't be computed for this card — a layer it needs isn't published, and we don't estimate missing figures.",
    tabRewards: 'Rewards',
    tabEligibility: 'Eligibility',
    tabFeatures: 'Features & limits',
    tabReviews: 'Reviews',
    tabsLabel: 'Card details',

    similarCardsHeading: 'Similar cards at other banks',
    similarReasonPrefix: 'Similar:',
    similarReasonSameNetwork: 'same {network} network',
    similarReasonLowerFee: 'lower annual fee',
    similarReasonCloseScore: 'close CreditMate Score',
    similarReasonTopScore: 'among the highest CreditMate Scores',

    loanScenarioHeading: 'What this loan would cost you',
    depositScenarioHeading: 'What this deposit would return',
    accountScenarioHeading: 'What this account is worth at your balance',
    loanAmountLabel: 'Loan amount',
    tenureMonthsLabel: 'Tenure (months)',
    depositAmountLabel: 'Deposit amount',
    instalmentLabel: 'Monthly instalment',
    monthsLabel: 'Term (months)',
    balanceLabel: 'Average balance',
    scenarioLoading: 'Calculating…',
    scenarioError: 'We could not run this calculation just now. Please try again.',
    scenarioNotRanked:
      'This product has no published rate for this scenario, so no figure is shown — nothing is estimated in its place.',
    trustChipUnverified: 'Not yet verified',
    emiAtLowRate: 'EMI at the lowest band rate',
    emiAtHighRate: 'EMI at the highest band rate',
    totalAtLowRate: 'Total at the lowest rate',
    totalAtHighRate: 'Total at the highest rate',
    grossMaturityLabel: 'Gross maturity',
    interestEarnedLabel: 'Interest / expected profit',
    taxDeductedLabel: 'Tax deducted',
    netMaturityLabel: 'Net maturity',
    effectiveYieldLabel: 'Effective yield',
    netAnnualValueLabel: 'Net annual value',
    interestAtBalanceLabel: 'Interest at your balance',
    feesPerYearLabel: 'Fees a year',
    accountBreakdownNote:
      'Net annual value at an average balance of {balance}: interest earned minus the published annual fees, with waivers applied where the bank states them.',

    hubDepositsHeading: 'Deposits at this bank',
    hubLoansHeading: 'Loans at this bank',
    hubAccountsHeading: 'Accounts at this bank',
    hubCardsHeading: 'Credit cards at this bank',
    hubViewDeposits: 'See all deposits from this bank',
    hubViewLoans: 'See all loans from this bank',
    hubViewAccounts: 'See all accounts from this bank',
    hubBestFdrRate: 'Best published deposit rate',
    hubLoanBandRange: 'Loan bands',
    hubFlagshipCard: 'Highest-scored card',
    hubLastVerified: 'Products last verified',
    hubProductsCount: '{count} products',
    indexLastVerified: 'Last verified',
    indexDepositsLabel: 'deposits',
    indexLoansLabel: 'loans',
    indexAccountsLabel: 'accounts',
    indexCountsLabel: 'Cards · deposits · loans · accounts',
  },
  bn: {
    addToShortlist: 'শর্টলিস্টে যোগ করুন',
    inShortlist: 'শর্টলিস্টে আছে',

    summaryAsideLabel: 'কার্ডের সারাংশ',
    scoreHeroLabel: 'ক্রেডিটমেট স্কোর',
    scoreHowCalculated: 'কীভাবে হিসাব করা হয়',
    estNetValueLabel: 'আপনার {spend} মাসিক খরচে বছরে আনুমানিক নিট মূল্য',
    estNetValueNote:
      'ব্যাংকের প্রকাশিত পয়েন্ট মূল্য ও মূল আয়ের হার ব্যবহার করে আনুমানিক পুরস্কারের মূল্য থেকে বার্ষিক ফি বাদ দেওয়া হয়েছে। এটি একটি হিসাব, প্রতিশ্রুতি নয়।',
    estValueNote:
      'ব্যাংকের প্রকাশিত পয়েন্ট মূল্য ও মূল আয়ের হার ব্যবহার করে আপনার খরচে আনুমানিক পুরস্কারের মূল্য। এখানে বার্ষিক ফি বাদ দেওয়া হয়নি।',
    feeHeroLabel: 'বার্ষিক ফি',
    checkEligibility: 'যোগ্যতা যাচাই করুন',
    eligibilitySignalLabel: 'এই সেশনে আপনার যোগ্যতা যাচাই',
    eligibilityFromSession: 'এই সেশনে আপনার যোগ্যতা যাচাই থেকে',

    verdictScore: 'ক্রেডিটমেট স্কোর',
    verdictNetValue: 'বছরে আনুমানিক নিট মূল্য',
    verdictAnnualFee: 'বার্ষিক ফি',

    tabFees: 'ফি ও চার্জ',
    anatomyHeading: 'নিট মান যেভাবে হিসাব হয়',
    anatomyIntro:
      'এই কার্ডের আনুমানিক নিট মান, স্তরে স্তরে। প্রতিটি স্তর হয় প্রকাশিত একটি সংখ্যা, নয়তো আপনার নিজের প্রোফাইল খরচ — অনুপস্থিত সংখ্যার জায়গায় কিছু অনুমান করা হয় না।',
    anatomyRewardsLayer: 'আপনার খরচ অনুযায়ী রিওয়ার্ডের মান',
    anatomyFeeLayer: 'বার্ষিক ফি',
    anatomyWaiverLayer: 'আপনার খরচে ফি মওকুফ',
    anatomyWaiverUnmet: 'ফি মওকুফের জন্য বছরে {threshold} খরচ করুন',
    anatomyWaiverMet: 'আপনার খরচ মওকুফের শর্ত পূরণ করে',
    anatomyTotalLabel: 'বছরে আনুমানিক নিট মান',
    anatomyTotalPartialNote: 'মোট হিসাবে শুধু প্রকাশিত স্তরগুলোই ধরা হয়েছে।',
    anatomyNoTotal:
      'এই কার্ডের নিট মান হিসাব করা যায় না — প্রয়োজনীয় একটি স্তর প্রকাশিত নয়, এবং আমরা অনুপস্থিত সংখ্যা অনুমান করি না।',
    tabRewards: 'পুরস্কার',
    tabEligibility: 'যোগ্যতা',
    tabFeatures: 'বৈশিষ্ট্য ও সীমা',
    tabReviews: 'রিভিউ',
    tabsLabel: 'কার্ডের বিবরণ',

    similarCardsHeading: 'অন্য ব্যাংকের একই ধরনের কার্ড',
    similarReasonPrefix: 'একই ধরনের:',
    similarReasonSameNetwork: 'একই {network} নেটওয়ার্ক',
    similarReasonLowerFee: 'কম বার্ষিক ফি',
    similarReasonCloseScore: 'কাছাকাছি ক্রেডিটমেট স্কোর',
    similarReasonTopScore: 'সর্বোচ্চ ক্রেডিটমেট স্কোরগুলোর একটি',

    loanScenarioHeading: 'এই ঋণে আপনার খরচ কত হবে',
    depositScenarioHeading: 'এই আমানতে আপনি কত পাবেন',
    accountScenarioHeading: 'আপনার ব্যালেন্সে এই অ্যাকাউন্টের মূল্য কত',
    loanAmountLabel: 'ঋণের পরিমাণ',
    tenureMonthsLabel: 'মেয়াদ (মাস)',
    depositAmountLabel: 'আমানতের পরিমাণ',
    instalmentLabel: 'মাসিক কিস্তি',
    monthsLabel: 'মেয়াদ (মাস)',
    balanceLabel: 'গড় ব্যালেন্স',
    scenarioLoading: 'হিসাব করা হচ্ছে…',
    scenarioError: 'এই মুহূর্তে হিসাবটি চালানো যায়নি। আবার চেষ্টা করুন।',
    scenarioNotRanked:
      'এই হিসাবের জন্য এই পণ্যের কোনো প্রকাশিত হার নেই, তাই কোনো সংখ্যা দেখানো হয়নি — এর বদলে কিছু অনুমান করা হয়নি।',
    trustChipUnverified: 'এখনও যাচাই করা হয়নি',
    emiAtLowRate: 'সর্বনিম্ন ব্যান্ড হারে কিস্তি',
    emiAtHighRate: 'সর্বোচ্চ ব্যান্ড হারে কিস্তি',
    totalAtLowRate: 'সর্বনিম্ন হারে মোট',
    totalAtHighRate: 'সর্বোচ্চ হারে মোট',
    grossMaturityLabel: 'মোট মেয়াদপূর্তি মূল্য',
    interestEarnedLabel: 'সুদ / প্রত্যাশিত মুনাফা',
    taxDeductedLabel: 'কর কর্তন',
    netMaturityLabel: 'নিট মেয়াদপূর্তি মূল্য',
    effectiveYieldLabel: 'কার্যকর আয়',
    netAnnualValueLabel: 'বার্ষিক নিট মূল্য',
    interestAtBalanceLabel: 'আপনার ব্যালেন্সে সুদ',
    feesPerYearLabel: 'বছরে ফি',
    accountBreakdownNote:
      'গড় ব্যালেন্স {balance} ধরে বার্ষিক নিট মূল্য: অর্জিত সুদ থেকে প্রকাশিত বার্ষিক ফি বাদ, ব্যাংক ছাড়ের কথা যেখানে বলেছে সেখানে তা প্রয়োগ করা হয়েছে।',

    hubDepositsHeading: 'এই ব্যাংকের আমানত',
    hubLoansHeading: 'এই ব্যাংকের ঋণ',
    hubAccountsHeading: 'এই ব্যাংকের অ্যাকাউন্ট',
    hubCardsHeading: 'এই ব্যাংকের ক্রেডিট কার্ড',
    hubViewDeposits: 'এই ব্যাংকের সব আমানত দেখুন',
    hubViewLoans: 'এই ব্যাংকের সব ঋণ দেখুন',
    hubViewAccounts: 'এই ব্যাংকের সব অ্যাকাউন্ট দেখুন',
    hubBestFdrRate: 'সেরা প্রকাশিত আমানতের হার',
    hubLoanBandRange: 'ঋণের ব্যান্ড',
    hubFlagshipCard: 'সর্বোচ্চ স্কোরের কার্ড',
    hubLastVerified: 'পণ্য সর্বশেষ যাচাই',
    hubProductsCount: '{count}টি পণ্য',
    indexLastVerified: 'সর্বশেষ যাচাই',
    indexDepositsLabel: 'আমানত',
    indexLoansLabel: 'ঋণ',
    indexAccountsLabel: 'অ্যাকাউন্ট',
    indexCountsLabel: 'কার্ড, আমানত, ঋণ, অ্যাকাউন্ট',
  },
};

export const getDetailCopy = (lang: Language): DetailCopy => DETAIL_COPY[lang] ?? DETAIL_COPY.en;
