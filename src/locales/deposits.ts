/**
 * UI copy for the deposit comparison pages (Phase 2, Vertical 1).
 * Bengali strings are drafted and need review by a native speaker before release.
 *
 * Copy discipline: Islamic products are always labelled "expected profit
 * rate", never "interest rate" — the backend enforces the same rule in the
 * schema. Rates published as a range are ranked at their lower bound and
 * the copy says so. Sanchayapatra is a government benchmark, shown
 * separately and never ranked among banks.
 */

import type { Language } from './types';

export interface DepositsCopy {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  intro: string;
  tabFdr: string;
  tabDps: string;
  amountLabel: string;
  instalmentLabel: string;
  monthsLabel: string;
  hasTinLabel: string;
  islamicOnlyLabel: string;
  bankLabel: string;
  allBanksOption: string;
  runScenario: string;
  loading: string;
  loadError: string;
  resultsHeading: string;
  benchmarksHeading: string;
  benchmarksNote: string;
  colBank: string;
  colProduct: string;
  colRate: string;
  colGross: string;
  colTax: string;
  colNet: string;
  rateRangeNote: string;
  derivedRateBadge: string;
  benchmarkBadge: string;
  islamicBadge: string;
  expectedProfitLabel: string;
  interestLabel: string;
  viewDetails: string;
  noResults: string;
  /** Placeholders: {count} */
  excludedNote: string;
  methodologyHeading: string;
  exciseNote: string;
  errorAmount: string;
  errorInstalment: string;
  errorMonths: string;
  detailRatesHeading: string;
  detailTenureCol: string;
  detailSlabCol: string;
  detailRateCol: string;
  monthsUnit: string;
  openEndedSuffix: string;
  andAboveSuffix: string;
  encashmentHeading: string;
  eligibilityHeading: string;
  loanAgainstLabel: string;
  /** Placeholders: {percent} */
  loanAgainstValue: string;
  provenanceHeading: string;
  sourceLabel: string;
  rateEffectiveLabel: string;
  verifiedLabel: string;
  historyHeading: string;
  historyIntro: string;
  historyLoginPrompt: string;
  historyLoginLink: string;
  historyEmpty: string;
  historyError: string;
  historyRateChange: string;
  backToDeposits: string;
  detailLoadError: string;
  instalmentRangeLabel: string;
  /** Placeholders: {min}, {max} */
  instalmentRangeValue: string;
}

const en: DepositsCopy = {
  seoTitle: 'Compare Fixed Deposits & DPS in Bangladesh | CreditMate AI',
  seoDescription:
    'Compare FDR and DPS rates from Bangladesh Bank’s published chart and bank schemes, ranked by net-of-tax maturity value, with Sanchayapatra as a separate government benchmark.',
  heading: 'Deposits: FDR & DPS',
  intro:
    'Enter an amount or a monthly instalment and a horizon — we rank every product by what you actually take home at maturity, after source tax. Rates come from Bangladesh Bank’s published deposit chart and the banks’ own scheme pages.',
  tabFdr: 'Fixed deposit (FDR)',
  tabDps: 'Monthly savings (DPS)',
  amountLabel: 'Deposit amount (BDT)',
  instalmentLabel: 'Monthly instalment (BDT)',
  monthsLabel: 'Horizon (months)',
  hasTinLabel: 'I have a TIN (source tax 10% instead of 15%)',
  islamicOnlyLabel: 'Islamic products only (expected profit, no interest)',
  bankLabel: 'Bank',
  allBanksOption: 'All banks',
  runScenario: 'Compare deposits',
  loading: 'Loading deposits…',
  loadError: 'Failed to load deposits. Please try again later.',
  resultsHeading: 'Ranked by net maturity value',
  benchmarksHeading: 'Government benchmark — Sanchayapatra',
  benchmarksNote:
    'Sanchayapatra is sold by the National Savings Directorate, not a bank, so it is shown separately and never ranked against bank deposits. Its tax rule differs: 5% source tax up to BDT 5 lakh of holdings (pensioner schemes exempt up to 5 lakh), 10% above.',
  colBank: 'Bank / institution',
  colProduct: 'Product',
  colRate: 'Rate',
  colGross: 'Maturity (before tax)',
  colTax: 'Source tax',
  colNet: 'You receive',
  rateRangeNote: 'Range — ranked at the lower bound',
  derivedRateBadge: 'Rate derived from published maturity table',
  benchmarkBadge: 'Benchmark',
  islamicBadge: 'Islamic',
  expectedProfitLabel: 'Expected profit rate',
  interestLabel: 'Interest rate',
  viewDetails: 'Details',
  noResults: 'No product publishes a rate for this horizon yet. Try a different number of months.',
  excludedNote:
    '{count} product(s) publish no rate covering this horizon and are not shown — we never invent a rate.',
  methodologyHeading: 'How the ranking works',
  exciseNote:
    'Figures include source tax on interest/profit but not excise duty, which depends on your total balances across all accounts and is charged separately.',
  errorAmount: 'Enter a deposit amount greater than zero.',
  errorInstalment: 'Enter a monthly instalment greater than zero.',
  errorMonths: 'Enter a horizon of at least 1 month (whole months only).',
  detailRatesHeading: 'Published rates',
  detailTenureCol: 'Tenure',
  detailSlabCol: 'Amount slab (BDT)',
  detailRateCol: 'Rate (% per year)',
  monthsUnit: 'months',
  openEndedSuffix: '+',
  andAboveSuffix: ' and above',
  encashmentHeading: 'Premature encashment',
  eligibilityHeading: 'Who can open it / notes',
  loanAgainstLabel: 'Loan against deposit',
  loanAgainstValue: 'Up to {percent}% of the deposited amount',
  provenanceHeading: 'Source & verification',
  sourceLabel: 'Source',
  rateEffectiveLabel: 'Rates effective',
  verifiedLabel: 'Verified',
  historyHeading: 'Rate-change history',
  historyIntro: 'Recorded changes to this product’s published rates and terms.',
  historyLoginPrompt: 'Sign in to see this product’s rate-change history.',
  historyLoginLink: 'Sign in',
  historyEmpty: 'No changes recorded yet — the current edition is the first we captured.',
  historyError: 'Could not load the rate-change history.',
  historyRateChange: 'Rate',
  backToDeposits: 'Back to deposits',
  detailLoadError: 'Failed to load this deposit product.',
  instalmentRangeLabel: 'Monthly instalment',
  instalmentRangeValue: '{min} – {max}',
};

const bn: DepositsCopy = {
  seoTitle: 'বাংলাদেশে এফডিআর ও ডিপিএস তুলনা | CreditMate AI',
  seoDescription:
    'বাংলাদেশ ব্যাংকের প্রকাশিত চার্ট ও ব্যাংকের স্কিম থেকে এফডিআর ও ডিপিএস হার তুলনা করুন — কর-পরবর্তী মেয়াদপূর্তির মূল্য অনুযায়ী সাজানো, সঞ্চয়পত্র আলাদা সরকারি বেঞ্চমার্ক হিসেবে।',
  heading: 'আমানত: এফডিআর ও ডিপিএস',
  intro:
    'পরিমাণ বা মাসিক কিস্তি এবং মেয়াদ লিখুন — উৎস করের পর মেয়াদপূর্তিতে আপনি আসলে কত পাবেন, সেই অনুযায়ী প্রতিটি পণ্য সাজাই। হারগুলো বাংলাদেশ ব্যাংকের প্রকাশিত আমানত চার্ট ও ব্যাংকগুলোর নিজস্ব স্কিম পেজ থেকে নেওয়া।',
  tabFdr: 'স্থায়ী আমানত (এফডিআর)',
  tabDps: 'মাসিক সঞ্চয় (ডিপিএস)',
  amountLabel: 'আমানতের পরিমাণ (টাকা)',
  instalmentLabel: 'মাসিক কিস্তি (টাকা)',
  monthsLabel: 'মেয়াদ (মাস)',
  hasTinLabel: 'আমার টিন আছে (উৎস কর ১৫%-এর বদলে ১০%)',
  islamicOnlyLabel: 'শুধু ইসলামি পণ্য (প্রত্যাশিত মুনাফা, সুদ নয়)',
  bankLabel: 'ব্যাংক',
  allBanksOption: 'সব ব্যাংক',
  runScenario: 'আমানত তুলনা করুন',
  loading: 'আমানত লোড হচ্ছে…',
  loadError: 'আমানত লোড করা যায়নি। পরে আবার চেষ্টা করুন।',
  resultsHeading: 'কর-পরবর্তী মেয়াদপূর্তির মূল্য অনুযায়ী সাজানো',
  benchmarksHeading: 'সরকারি বেঞ্চমার্ক — সঞ্চয়পত্র',
  benchmarksNote:
    'সঞ্চয়পত্র জাতীয় সঞ্চয় অধিদপ্তর বিক্রি করে, কোনো ব্যাংক নয় — তাই এটি আলাদাভাবে দেখানো হয় এবং ব্যাংক আমানতের সাথে র‌্যাংক করা হয় না। এর কর নিয়ম আলাদা: মোট ধারণ ৫ লাখ টাকা পর্যন্ত ৫% উৎস কর (পেনশনার স্কিমে ৫ লাখ পর্যন্ত ছাড়), তার উপরে ১০%।',
  colBank: 'ব্যাংক / প্রতিষ্ঠান',
  colProduct: 'পণ্য',
  colRate: 'হার',
  colGross: 'মেয়াদপূর্তি (করের আগে)',
  colTax: 'উৎস কর',
  colNet: 'আপনি পাবেন',
  rateRangeNote: 'পরিসর — নিম্ন সীমা অনুযায়ী সাজানো',
  derivedRateBadge: 'প্রকাশিত মেয়াদপূর্তি সারণি থেকে নির্ণীত হার',
  benchmarkBadge: 'বেঞ্চমার্ক',
  islamicBadge: 'ইসলামি',
  expectedProfitLabel: 'প্রত্যাশিত মুনাফা হার',
  interestLabel: 'সুদ হার',
  viewDetails: 'বিস্তারিত',
  noResults: 'এই মেয়াদের জন্য কোনো পণ্য এখনো হার প্রকাশ করেনি। অন্য মাস সংখ্যা চেষ্টা করুন।',
  excludedNote:
    '{count}টি পণ্য এই মেয়াদের জন্য কোনো হার প্রকাশ করে না, তাই দেখানো হয়নি — আমরা কখনো হার অনুমান করি না।',
  methodologyHeading: 'র‌্যাংকিং যেভাবে কাজ করে',
  exciseNote:
    'হিসাবে সুদ/মুনাফার উপর উৎস কর অন্তর্ভুক্ত, কিন্তু আবগারি শুল্ক নয় — এটি আপনার সব অ্যাকাউন্টের মোট ব্যালেন্সের উপর নির্ভর করে এবং আলাদাভাবে কাটা হয়।',
  errorAmount: 'শূন্যের বেশি আমানতের পরিমাণ লিখুন।',
  errorInstalment: 'শূন্যের বেশি মাসিক কিস্তি লিখুন।',
  errorMonths: 'কমপক্ষে ১ মাসের মেয়াদ লিখুন (পূর্ণ মাসে)।',
  detailRatesHeading: 'প্রকাশিত হারসমূহ',
  detailTenureCol: 'মেয়াদ',
  detailSlabCol: 'পরিমাণের ধাপ (টাকা)',
  detailRateCol: 'হার (বার্ষিক %)',
  monthsUnit: 'মাস',
  openEndedSuffix: '+',
  andAboveSuffix: ' ও তার বেশি',
  encashmentHeading: 'মেয়াদের আগে ভাঙানো',
  eligibilityHeading: 'কারা খুলতে পারবেন / নোট',
  loanAgainstLabel: 'আমানতের বিপরীতে ঋণ',
  loanAgainstValue: 'জমা পরিমাণের সর্বোচ্চ {percent}% পর্যন্ত',
  provenanceHeading: 'উৎস ও যাচাই',
  sourceLabel: 'উৎস',
  rateEffectiveLabel: 'হার কার্যকর',
  verifiedLabel: 'যাচাইকৃত',
  historyHeading: 'হার পরিবর্তনের ইতিহাস',
  historyIntro: 'এই পণ্যের প্রকাশিত হার ও শর্তের রেকর্ডকৃত পরিবর্তন।',
  historyLoginPrompt: 'এই পণ্যের হার পরিবর্তনের ইতিহাস দেখতে সাইন ইন করুন।',
  historyLoginLink: 'সাইন ইন',
  historyEmpty: 'এখনো কোনো পরিবর্তন রেকর্ড হয়নি — বর্তমান সংস্করণই আমাদের প্রথম সংগ্রহ।',
  historyError: 'হার পরিবর্তনের ইতিহাস লোড করা যায়নি।',
  historyRateChange: 'হার',
  backToDeposits: 'আমানতে ফিরুন',
  detailLoadError: 'এই আমানত পণ্যটি লোড করা যায়নি।',
  instalmentRangeLabel: 'মাসিক কিস্তি',
  instalmentRangeValue: '{min} – {max}',
};

export const DEPOSITS_COPY: Record<Language, DepositsCopy> = { en, bn };

export const getDepositsCopy = (lang: Language): DepositsCopy => DEPOSITS_COPY[lang];
