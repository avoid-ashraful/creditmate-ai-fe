/**
 * UI copy for the bank-account comparison pages (Phase 2, Vertical 3).
 * Bengali strings are drafted and need review by a native speaker before release.
 *
 * Copy discipline (do not break):
 * - The savings maintenance fee is fixed by Bangladesh Bank on ONE slab
 *   for every bank. Copy must NEVER imply the maintenance fee differs
 *   by bank — differentiation is card/SMS/cheque fees, waivers and the
 *   interest actually earned at the user's slab.
 * - Islamic products are labelled "expected profit", never "interest".
 * - An unpublished figure is shown as "not published", never as zero.
 * - Rates are always shown with their balance slab, never as a bare
 *   headline rate.
 */

import type { Language } from './types';

export interface AccountsCopy {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  intro: string;
  explainerHeading: string;
  explainerBody: string;
  tabSavings: string;
  tabCurrent: string;
  balanceLabel: string;
  balancePresetsLabel: string;
  islamicOnlyLabel: string;
  bankLabel: string;
  allBanksOption: string;
  segmentLabel: string;
  allSegmentsOption: string;
  runScenario: string;
  loading: string;
  loadError: string;
  scenarioError: string;
  resultsHeading: string;
  colBank: string;
  colProduct: string;
  colRate: string;
  colInterest: string;
  colMaintenance: string;
  colCard: string;
  colSms: string;
  colOnline: string;
  colNet: string;
  viewDetails: string;
  islamicBadge: string;
  expectedProfitLabel: string;
  interestLabel: string;
  rateRangeNote: string;
  partialFeesBadge: string;
  notPublished: string;
  waivedNote: string;
  /** Placeholders: {amount} */
  minBalanceInterestNote: string;
  /** Placeholders: {rate}, {amount} */
  atMaxRateNote: string;
  /** Placeholders: {name} */
  variantOfNote: string;
  noResults: string;
  /** Placeholders: {count} */
  excludedNote: string;
  segmentExcludedHeading: string;
  segmentExcludedNote: string;
  unrankedHeading: string;
  unrankedNote: string;
  methodologyHeading: string;
  errorBalance: string;
  // Detail page
  backToAccounts: string;
  detailLoadError: string;
  detailSlabsHeading: string;
  detailSlabCol: string;
  detailRateCol: string;
  andAboveSuffix: string;
  detailMaintenanceHeading: string;
  detailMaintenanceCol: string;
  feesHeading: string;
  rankedByNetValue: string;
  feeCardLabel: string;
  noDebitCardLabel: string;
  feeCardFirstYearLabel: string;
  feeCardReplacementLabel: string;
  feeSmsLabel: string;
  feeOnlineLabel: string;
  feeChequeLabel: string;
  feeChequeFirstBookFree: string;
  feeClosureLabel: string;
  feeStatementDuplicateLabel: string;
  feeBalanceConfirmationLabel: string;
  perLeafSuffix: string;
  basisLabel: string;
  payoutLabel: string;
  minBalanceToEarnLabel: string;
  minBalanceRequiredLabel: string;
  openingDepositLabel: string;
  withdrawalLimitLabel: string;
  /** Placeholders: {count} */
  withdrawalLimitValue: string;
  maintenanceFreeNote: string;
  conditionsHeading: string;
  dormancyHeading: string;
  eligibilityHeading: string;
  variantsHeading: string;
  variantOfLabel: string;
  provenanceHeading: string;
  sourceSocLabel: string;
  sourceRateLabel: string;
  socEffectiveLabel: string;
  rateEffectiveLabel: string;
  verifiedLabel: string;
  historyHeading: string;
  historyIntro: string;
  historyLoginPrompt: string;
  historyLoginLink: string;
  historyEmpty: string;
  historyError: string;
  // Segment option labels
  segmentGeneral: string;
  segmentWomen: string;
  segmentStudent: string;
  segmentSenior: string;
  segmentSalary: string;
  segmentNrb: string;
  segmentDigital: string;
  segmentMinor: string;
  segmentInclusion: string;
  segmentPremium: string;
  // Interest basis / payout labels
  basisDailyBalance: string;
  basisDayEndBalance: string;
  basisLowestMonthly: string;
  basisMonthlyMinimum: string;
  basisMonthlyAverage: string;
  basisDailyProduct: string;
  basisUnknown: string;
  payoutMonthly: string;
  payoutQuarterly: string;
  payoutHalfYearly: string;
  payoutAnnual: string;
  payoutAtMaturity: string;
  payoutUnknown: string;
}

const en: AccountsCopy = {
  seoTitle: 'Compare Savings & Current Accounts in Bangladesh | CreditMate AI',
  seoDescription:
    'Compare savings and current accounts from Bangladeshi banks by net annual value at your average balance: interest earned at your slab minus the fees you actually pay.',
  heading: 'Savings & current accounts',
  intro:
    'Enter the average balance you keep, and we rank every account by its net annual value: the interest or expected profit you earn at your balance slab, minus a full year of the fees that account charges at that balance.',
  explainerHeading: 'One honest note about the maintenance fee',
  explainerBody:
    'The savings account maintenance fee is fixed by Bangladesh Bank on a single slab for every bank in the country — free up to an average balance of BDT 10,000, then BDT 100 / 200 / 250 / 300 per half-year as the balance grows (current accounts are capped at BDT 300 per half-year). It is identical everywhere, so it never decides this ranking. What actually differs between banks is the debit-card fee, the SMS fee, cheque charges, fee waivers, and the interest your balance slab really earns — that is what we compare. All fees are shown excluding VAT and excise duty, which apply equally at every bank.',
  tabSavings: 'Savings',
  tabCurrent: 'Current',
  balanceLabel: 'Your average balance (BDT)',
  balancePresetsLabel: 'Try:',
  islamicOnlyLabel: 'Islamic accounts only (expected profit, no interest)',
  bankLabel: 'Bank',
  allBanksOption: 'All banks',
  segmentLabel: 'Account type / segment',
  allSegmentsOption: 'All segments',
  runScenario: 'Compare accounts',
  loading: 'Loading accounts…',
  loadError: 'Failed to load accounts. Please try again later.',
  scenarioError: 'Failed to run the comparison. Please check your balance and try again.',
  resultsHeading: 'Ranked by net annual value at your balance',
  colBank: 'Bank',
  colProduct: 'Account',
  colRate: 'Rate at your slab',
  colInterest: 'Interest / profit (1 yr)',
  colMaintenance: 'Maintenance (1 yr)',
  colCard: 'Debit card',
  colSms: 'SMS',
  colOnline: 'Online banking',
  colNet: 'Net annual value',
  viewDetails: 'Details',
  islamicBadge: 'Islamic',
  expectedProfitLabel: 'Expected profit rate',
  interestLabel: 'Interest rate',
  rateRangeNote: 'Range — ranked at the lower bound',
  partialFeesBadge: 'Partial fees — some charges not published',
  notPublished: 'Not published',
  waivedNote: 'Waiver applied at this balance',
  minBalanceInterestNote: 'No interest or profit below the published minimum balance of {amount}',
  atMaxRateNote: 'At {rate}%: {amount}',
  variantOfNote: 'Variant of {name}',
  noResults: 'No account publishes a rate covering this balance yet. Try a different balance.',
  excludedNote:
    '{count} account(s) publish no rate covering this balance and are not ranked — we never invent a rate.',
  segmentExcludedHeading: 'Salary & employer-agreement accounts',
  segmentExcludedNote:
    'Salary and payroll accounts are priced under each employer’s agreement with the bank, so they are evaluated separately and never ranked against walk-in accounts.',
  unrankedHeading: 'Interest known, fees not published',
  unrankedNote:
    'These banks publish a rate but none of the fee lines we hold, so a fair net value cannot be computed. They are listed for completeness, not ranked.',
  methodologyHeading: 'How the ranking works',
  errorBalance: 'Enter an average balance of zero or more.',
  backToAccounts: 'Back to accounts',
  detailLoadError: 'Failed to load this account product.',
  detailSlabsHeading: 'Published rate slabs',
  detailSlabCol: 'Balance slab (BDT)',
  detailRateCol: 'Rate (% per year)',
  andAboveSuffix: ' and above',
  detailMaintenanceHeading: 'Maintenance fee by balance (half-yearly)',
  detailMaintenanceCol: 'Charge per half-year',
  feesHeading: 'Fees & charges (excluding VAT)',
  rankedByNetValue: 'Net annual value at your balance, highest first',
  feeCardLabel: 'Debit card (annual)',
  noDebitCardLabel: 'No debit card included',
  feeCardFirstYearLabel: 'Debit card (first year)',
  feeCardReplacementLabel: 'Debit card replacement',
  feeSmsLabel: 'SMS / transaction alerts (annual)',
  feeOnlineLabel: 'Online banking (annual)',
  feeChequeLabel: 'Cheque book',
  feeChequeFirstBookFree: 'First cheque book free',
  feeClosureLabel: 'Account closing',
  feeStatementDuplicateLabel: 'Duplicate statement',
  feeBalanceConfirmationLabel: 'Balance confirmation (extra copy)',
  perLeafSuffix: ' / leaf',
  basisLabel: 'Interest calculated on',
  payoutLabel: 'Interest / profit paid',
  minBalanceToEarnLabel: 'Minimum balance to earn',
  minBalanceRequiredLabel: 'Minimum balance required',
  openingDepositLabel: 'Opening deposit',
  withdrawalLimitLabel: 'Profit withdrawal condition',
  withdrawalLimitValue: 'No profit in a month with {count} or more withdrawals',
  maintenanceFreeNote: 'No maintenance fee at any balance, as published by the bank.',
  conditionsHeading: 'Waivers & conditions',
  dormancyHeading: 'Dormancy',
  eligibilityHeading: 'Who can open it / notes',
  variantsHeading: 'Also available as',
  variantOfLabel: 'Variant of',
  provenanceHeading: 'Source & verification',
  sourceSocLabel: 'Schedule of charges',
  sourceRateLabel: 'Rate source',
  socEffectiveLabel: 'Charges effective',
  rateEffectiveLabel: 'Rates effective',
  verifiedLabel: 'Verified',
  historyHeading: 'Fee & rate-change history',
  historyIntro: 'Recorded changes to this account’s published rates and fees.',
  historyLoginPrompt: 'Sign in to see this account’s change history.',
  historyLoginLink: 'Sign in',
  historyEmpty: 'No changes recorded yet — the current edition is the first we captured.',
  historyError: 'Could not load the change history.',
  segmentGeneral: 'General',
  segmentWomen: 'Women',
  segmentStudent: 'Student',
  segmentSenior: 'Senior citizens',
  segmentSalary: 'Salary / payroll',
  segmentNrb: 'NRB / expatriate',
  segmentDigital: 'Digital',
  segmentMinor: 'Minor / school',
  segmentInclusion: 'Financial inclusion',
  segmentPremium: 'Premium',
  basisDailyBalance: 'Daily balance',
  basisDayEndBalance: 'Day-end balance',
  basisLowestMonthly: 'Lowest monthly balance',
  basisMonthlyMinimum: 'Monthly minimum balance',
  basisMonthlyAverage: 'Monthly average balance',
  basisDailyProduct: 'Daily product (sum of daily balances)',
  basisUnknown: 'Not published by the bank',
  payoutMonthly: 'Monthly',
  payoutQuarterly: 'Quarterly',
  payoutHalfYearly: 'Half-yearly',
  payoutAnnual: 'Yearly',
  payoutAtMaturity: 'At maturity',
  payoutUnknown: 'Not published',
};

const bn: AccountsCopy = {
  seoTitle: 'বাংলাদেশে সঞ্চয়ী ও চলতি অ্যাকাউন্ট তুলনা | CreditMate AI',
  seoDescription:
    'আপনার গড় ব্যালেন্সে নিট বার্ষিক মূল্য অনুযায়ী বাংলাদেশি ব্যাংকের সঞ্চয়ী ও চলতি অ্যাকাউন্ট তুলনা করুন: আপনার ধাপে অর্জিত সুদ থেকে প্রকৃত ফি বাদ দিয়ে।',
  heading: 'সঞ্চয়ী ও চলতি অ্যাকাউন্ট',
  intro:
    'আপনি যে গড় ব্যালেন্স রাখেন তা লিখুন — প্রতিটি অ্যাকাউন্টকে তার নিট বার্ষিক মূল্য অনুযায়ী সাজাই: আপনার ব্যালেন্স ধাপে অর্জিত সুদ বা প্রত্যাশিত মুনাফা, বিয়োগ ওই ব্যালেন্সে অ্যাকাউন্টটির পুরো এক বছরের ফি।',
  explainerHeading: 'রক্ষণাবেক্ষণ ফি নিয়ে একটি সৎ নোট',
  explainerBody:
    'সঞ্চয়ী অ্যাকাউন্টের রক্ষণাবেক্ষণ ফি বাংলাদেশ ব্যাংক দেশের প্রতিটি ব্যাংকের জন্য একটি মাত্র ধাপে নির্ধারণ করে দিয়েছে — গড় ব্যালেন্স ১০,০০০ টাকা পর্যন্ত বিনামূল্যে, এরপর ব্যালেন্স বাড়লে প্রতি অর্ধবছরে ১০০ / ২০০ / ২৫০ / ৩০০ টাকা (চলতি অ্যাকাউন্টে প্রতি অর্ধবছরে সর্বোচ্চ ৩০০ টাকা)। এটি সব জায়গায় একই, তাই এই র‌্যাংকিংয়ে এটি কখনো নির্ণায়ক নয়। ব্যাংকভেদে যা সত্যিই আলাদা তা হলো ডেবিট কার্ডের ফি, এসএমএস ফি, চেকের চার্জ, ফি মওকুফ এবং আপনার ব্যালেন্স ধাপে প্রকৃত সুদ — আমরা সেটাই তুলনা করি। সব ফি ভ্যাট ও আবগারি শুল্ক ছাড়া দেখানো হয়েছে, যেগুলো প্রতিটি ব্যাংকে সমানভাবে প্রযোজ্য।',
  tabSavings: 'সঞ্চয়ী',
  tabCurrent: 'চলতি',
  balanceLabel: 'আপনার গড় ব্যালেন্স (টাকা)',
  balancePresetsLabel: 'চেষ্টা করুন:',
  islamicOnlyLabel: 'শুধু ইসলামি অ্যাকাউন্ট (প্রত্যাশিত মুনাফা, সুদ নয়)',
  bankLabel: 'ব্যাংক',
  allBanksOption: 'সব ব্যাংক',
  segmentLabel: 'অ্যাকাউন্টের ধরন / বিভাগ',
  allSegmentsOption: 'সব বিভাগ',
  runScenario: 'অ্যাকাউন্ট তুলনা করুন',
  loading: 'অ্যাকাউন্ট লোড হচ্ছে…',
  loadError: 'অ্যাকাউন্ট লোড করা যায়নি। পরে আবার চেষ্টা করুন।',
  scenarioError: 'তুলনা চালানো যায়নি। আপনার ব্যালেন্স যাচাই করে আবার চেষ্টা করুন।',
  resultsHeading: 'আপনার ব্যালেন্সে নিট বার্ষিক মূল্য অনুযায়ী সাজানো',
  colBank: 'ব্যাংক',
  colProduct: 'অ্যাকাউন্ট',
  colRate: 'আপনার ধাপে হার',
  colInterest: 'সুদ / মুনাফা (১ বছর)',
  colMaintenance: 'রক্ষণাবেক্ষণ (১ বছর)',
  colCard: 'ডেবিট কার্ড',
  colSms: 'এসএমএস',
  colOnline: 'অনলাইন ব্যাংকিং',
  colNet: 'নিট বার্ষিক মূল্য',
  viewDetails: 'বিস্তারিত',
  islamicBadge: 'ইসলামি',
  expectedProfitLabel: 'প্রত্যাশিত মুনাফা হার',
  interestLabel: 'সুদ হার',
  rateRangeNote: 'পরিসর — নিম্ন সীমা অনুযায়ী সাজানো',
  partialFeesBadge: 'আংশিক ফি — কিছু চার্জ প্রকাশিত নয়',
  notPublished: 'প্রকাশিত নয়',
  waivedNote: 'এই ব্যালেন্সে মওকুফ প্রযোজ্য',
  minBalanceInterestNote:
    'প্রকাশিত সর্বনিম্ন ব্যালেন্স {amount}-এর নিচে সুদ বা মুনাফা প্রযোজ্য নয়',
  atMaxRateNote: '{rate}% হারে: {amount}',
  variantOfNote: '{name}-এর রূপভেদ',
  noResults:
    'এই ব্যালেন্সের জন্য কোনো অ্যাকাউন্ট এখনো হার প্রকাশ করেনি। অন্য ব্যালেন্স চেষ্টা করুন।',
  excludedNote:
    '{count}টি অ্যাকাউন্ট এই ব্যালেন্সের জন্য কোনো হার প্রকাশ করে না, তাই র‌্যাংক করা হয়নি — আমরা কখনো হার অনুমান করি না।',
  segmentExcludedHeading: 'বেতন ও নিয়োগকর্তা-চুক্তির অ্যাকাউন্ট',
  segmentExcludedNote:
    'বেতন ও পে-রোল অ্যাকাউন্টের মূল্য প্রতিটি নিয়োগকর্তার সাথে ব্যাংকের চুক্তি অনুযায়ী নির্ধারিত হয়, তাই এগুলো আলাদাভাবে মূল্যায়ন করা হয় এবং সাধারণ অ্যাকাউন্টের সাথে কখনো র‌্যাংক করা হয় না।',
  unrankedHeading: 'সুদ জানা আছে, ফি প্রকাশিত নয়',
  unrankedNote:
    'এই ব্যাংকগুলো হার প্রকাশ করে, কিন্তু আমাদের কাছে তাদের কোনো ফি-লাইন নেই, তাই ন্যায্য নিট মূল্য হিসাব করা যায় না। এগুলো পূর্ণতার জন্য তালিকাভুক্ত, র‌্যাংক করা নয়।',
  methodologyHeading: 'র‌্যাংকিং যেভাবে কাজ করে',
  errorBalance: 'শূন্য বা তার বেশি গড় ব্যালেন্স লিখুন।',
  backToAccounts: 'অ্যাকাউন্টে ফিরুন',
  detailLoadError: 'এই অ্যাকাউন্ট পণ্যটি লোড করা যায়নি।',
  detailSlabsHeading: 'প্রকাশিত হারের ধাপসমূহ',
  detailSlabCol: 'ব্যালেন্সের ধাপ (টাকা)',
  detailRateCol: 'হার (বার্ষিক %)',
  andAboveSuffix: ' ও তার বেশি',
  detailMaintenanceHeading: 'ব্যালেন্স অনুযায়ী রক্ষণাবেক্ষণ ফি (অর্ধবার্ষিক)',
  detailMaintenanceCol: 'প্রতি অর্ধবছরে চার্জ',
  feesHeading: 'ফি ও চার্জ (ভ্যাট ছাড়া)',
  rankedByNetValue: 'আপনার ব্যালেন্সে নিট বার্ষিক মূল্য অনুযায়ী, সর্বোচ্চ প্রথমে',
  feeCardLabel: 'ডেবিট কার্ড (বার্ষিক)',
  noDebitCardLabel: 'ডেবিট কার্ড অন্তর্ভুক্ত নয়',
  feeCardFirstYearLabel: 'ডেবিট কার্ড (প্রথম বছর)',
  feeCardReplacementLabel: 'ডেবিট কার্ড প্রতিস্থাপন',
  feeSmsLabel: 'এসএমএস / লেনদেন সতর্কতা (বার্ষিক)',
  feeOnlineLabel: 'অনলাইন ব্যাংকিং (বার্ষিক)',
  feeChequeLabel: 'চেক বই',
  feeChequeFirstBookFree: 'প্রথম চেক বই বিনামূল্যে',
  feeClosureLabel: 'অ্যাকাউন্ট বন্ধ',
  feeStatementDuplicateLabel: 'ডুপ্লিকেট স্টেটমেন্ট',
  feeBalanceConfirmationLabel: 'ব্যালেন্স নিশ্চিতকরণ (অতিরিক্ত কপি)',
  perLeafSuffix: ' / পাতা',
  basisLabel: 'সুদ হিসাব হয়',
  payoutLabel: 'সুদ / মুনাফা দেওয়া হয়',
  minBalanceToEarnLabel: 'সুদ পাওয়ার সর্বনিম্ন ব্যালেন্স',
  minBalanceRequiredLabel: 'প্রয়োজনীয় সর্বনিম্ন ব্যালেন্স',
  openingDepositLabel: 'প্রারম্ভিক জমা',
  withdrawalLimitLabel: 'মুনাফার উত্তোলন শর্ত',
  withdrawalLimitValue: 'কোনো মাসে {count} বা তার বেশি উত্তোলন থাকলে সেই মাসে মুনাফা নেই',
  maintenanceFreeNote: 'ব্যাংকের প্রকাশনা অনুযায়ী, কোনো ব্যালেন্সেই রক্ষণাবেক্ষণ ফি নেই।',
  conditionsHeading: 'মওকুফ ও শর্তাবলি',
  dormancyHeading: 'সুপ্ত অবস্থা',
  eligibilityHeading: 'কারা খুলতে পারবেন / নোট',
  variantsHeading: 'এছাড়াও পাওয়া যায়',
  variantOfLabel: 'এর রূপভেদ',
  provenanceHeading: 'উৎস ও যাচাই',
  sourceSocLabel: 'চার্জের তালিকা (SOC)',
  sourceRateLabel: 'হারের উৎস',
  socEffectiveLabel: 'চার্জ কার্যকর',
  rateEffectiveLabel: 'হার কার্যকর',
  verifiedLabel: 'যাচাইকৃত',
  historyHeading: 'ফি ও হার পরিবর্তনের ইতিহাস',
  historyIntro: 'এই অ্যাকাউন্টের প্রকাশিত হার ও ফি-র রেকর্ডকৃত পরিবর্তন।',
  historyLoginPrompt: 'এই অ্যাকাউন্টের পরিবর্তনের ইতিহাস দেখতে সাইন ইন করুন।',
  historyLoginLink: 'সাইন ইন',
  historyEmpty: 'এখনো কোনো পরিবর্তন রেকর্ড হয়নি — বর্তমান সংস্করণই আমাদের প্রথম সংগ্রহ।',
  historyError: 'পরিবর্তনের ইতিহাস লোড করা যায়নি।',
  segmentGeneral: 'সাধারণ',
  segmentWomen: 'নারী',
  segmentStudent: 'শিক্ষার্থী',
  segmentSenior: 'প্রবীণ নাগরিক',
  segmentSalary: 'বেতন / পে-রোল',
  segmentNrb: 'প্রবাসী (NRB)',
  segmentDigital: 'ডিজিটাল',
  segmentMinor: 'অপ্রাপ্তবয়স্ক / স্কুল',
  segmentInclusion: 'আর্থিক অন্তর্ভুক্তি',
  segmentPremium: 'প্রিমিয়াম',
  basisDailyBalance: 'দৈনিক ব্যালেন্স',
  basisDayEndBalance: 'দিন-শেষ ব্যালেন্স',
  basisLowestMonthly: 'মাসের সর্বনিম্ন ব্যালেন্স',
  basisMonthlyMinimum: 'মাসিক সর্বনিম্ন ব্যালেন্স',
  basisMonthlyAverage: 'মাসিক গড় ব্যালেন্স',
  basisDailyProduct: 'ডেইলি প্রোডাক্ট (দৈনিক ব্যালেন্সের যোগফল)',
  basisUnknown: 'ব্যাংক প্রকাশ করেনি',
  payoutMonthly: 'মাসিক',
  payoutQuarterly: 'ত্রৈমাসিক',
  payoutHalfYearly: 'অর্ধবার্ষিক',
  payoutAnnual: 'বার্ষিক',
  payoutAtMaturity: 'মেয়াদপূর্তিতে',
  payoutUnknown: 'প্রকাশিত নয়',
};

export const ACCOUNTS_COPY: Record<Language, AccountsCopy> = { en, bn };

export const getAccountsCopy = (lang: Language): AccountsCopy => ACCOUNTS_COPY[lang];

export const segmentLabel = (copy: AccountsCopy, segment: string): string => {
  switch (segment) {
    case 'women':
      return copy.segmentWomen;
    case 'student':
      return copy.segmentStudent;
    case 'senior':
      return copy.segmentSenior;
    case 'salary':
      return copy.segmentSalary;
    case 'nrb':
      return copy.segmentNrb;
    case 'digital':
      return copy.segmentDigital;
    case 'minor':
      return copy.segmentMinor;
    case 'inclusion':
      return copy.segmentInclusion;
    case 'premium':
      return copy.segmentPremium;
    default:
      return copy.segmentGeneral;
  }
};

export const basisLabel = (copy: AccountsCopy, basis: string): string => {
  switch (basis) {
    case 'daily_balance':
      return copy.basisDailyBalance;
    case 'day_end_balance':
      return copy.basisDayEndBalance;
    case 'lowest_monthly_balance':
      return copy.basisLowestMonthly;
    case 'monthly_minimum':
      return copy.basisMonthlyMinimum;
    case 'monthly_average':
      return copy.basisMonthlyAverage;
    case 'daily_product':
      return copy.basisDailyProduct;
    default:
      return copy.basisUnknown;
  }
};

export const payoutLabel = (copy: AccountsCopy, payout: string): string => {
  switch (payout) {
    case 'monthly':
      return copy.payoutMonthly;
    case 'quarterly':
      return copy.payoutQuarterly;
    case 'half_yearly':
      return copy.payoutHalfYearly;
    case 'annual':
      return copy.payoutAnnual;
    case 'at_maturity':
      return copy.payoutAtMaturity;
    default:
      return copy.payoutUnknown;
  }
};
