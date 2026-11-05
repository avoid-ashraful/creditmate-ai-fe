/**
 * Plan workspace copy (redesign plan Section 4.8, Phase 3).
 * English + Bangla, following the per-domain locale module pattern.
 */

import type { Language } from './types';

export interface PlanCopy {
  heading: string;
  intro: string;
  toolsHeading: string;
  toolEmi: string;
  toolEmiDesc: string;
  toolPayoff: string;
  toolPayoffDesc: string;
  toolRewards: string;
  toolRewardsDesc: string;
  toolDeposit: string;
  toolDepositDesc: string;
  toolLoan: string;
  toolLoanDesc: string;
  toolAccount: string;
  toolAccountDesc: string;
  toolEligibility: string;
  toolEligibilityDesc: string;
  numbersNote: string;
  saveScenario: string;
  scenarioNameLabel: string;
  scenarioSaved: string;
  scenarioSaveFailed: string;
  savedHeading: string;
  noSavedScenarios: string;
  signInToSave: string;
  openLabel: string;
  deleteLabel: string;
  scenarioDeleted: string;
  // Mirror-don't-decorate (Phase 4, addendum B8): inputs restated in words
  mirrorEmi: string;
  mirrorPayoff: string;
  mirrorDepositFdr: string;
  mirrorDepositDps: string;
  mirrorRewards: string;
  mirrorLoan: string;
  mirrorAccount: string;
  // Ghost-preview before applying a saved scenario (Phase 4, addendum B6)
  previewOpen: string;
  previewCancel: string;
  previewLoading: string;
  previewFailed: string;
  previewEmiResult: string;
  previewPayoffResult: string;
  previewDepositResult: string;
  previewRewardsResult: string;
  previewLoanResult: string;
  previewAccountResult: string;
  // Loan scenario tool
  loanAmountLabel: string;
  loanTenureLabel: string;
  loanPurposeLabel: string;
  loanPurposeAny: string;
  loanRunLabel: string;
  loanResultsHeading: string;
  loanMonthlyLabel: string;
  loanTotalInterestLabel: string;
  loanBandNote: string;
  loanEmpty: string;
  loanError: string;
  // Account scenario tool
  accountBalanceLabel: string;
  accountRunLabel: string;
  accountResultsHeading: string;
  accountNetLabel: string;
  accountFeesLabel: string;
  accountEmpty: string;
  accountError: string;
  backToPlan: string;
}

const en: PlanCopy = {
  heading: 'Plan',
  intro:
    'One workspace for the money questions: what a loan costs each month, how fast a balance clears, what a deposit returns, and which account keeps the most of your money. Your numbers preset the tools, and signed-in scenarios save to your account.',
  toolsHeading: 'Tools',
  toolEmi: 'EMI calculator',
  toolEmiDesc:
    'Monthly payment and total interest for a loan amount at a real card rate or your own.',
  toolPayoff: 'Payoff calculator',
  toolPayoffDesc:
    'How long a card balance takes to clear at a fixed monthly payment — and what it costs.',
  toolRewards: 'Rewards value',
  toolRewardsDesc: 'What each card’s points and cashback are actually worth at your monthly spend.',
  toolDeposit: 'Deposit maturity',
  toolDepositDesc: 'FDR and DPS maturity values, net of tax, at published bank rates or your own.',
  toolLoan: 'Loan comparison',
  toolLoanDesc:
    'Every lender’s real cost for your amount and tenure, priced at both ends of each rate band.',
  toolAccount: 'Account comparison',
  toolAccountDesc:
    'Net yearly value of savings and current accounts at your typical balance, after the fixed fees.',
  toolEligibility: 'Eligibility check',
  toolEligibilityDesc:
    'Which cards your income and documents plausibly qualify for — an indication, never a promise.',
  numbersNote:
    'Tools open preset with your numbers from My CreditMate; change them here or there any time.',
  saveScenario: 'Save scenario',
  scenarioNameLabel: 'Name this scenario',
  scenarioSaved: 'Scenario saved to your account.',
  scenarioSaveFailed: 'Could not save the scenario. Please try again.',
  savedHeading: 'Your saved scenarios',
  noSavedScenarios: 'No saved scenarios yet. Run a tool and save the result here.',
  signInToSave: 'Sign in to save scenarios to your account and reopen them on any device.',
  openLabel: 'Open',
  deleteLabel: 'Delete',
  scenarioDeleted: 'Scenario deleted.',
  mirrorEmi: 'Borrowing {amount} over {months} months at {rate}%',
  mirrorPayoff: 'Paying {payment} a month toward a {balance} balance at {rate}%',
  mirrorDepositFdr: 'Saving {amount} for {months} months at {rate}%',
  mirrorDepositDps: 'Saving {amount} a month for {months} months at {rate}%',
  mirrorRewards: 'Spending {amount} a month across your categories',
  mirrorLoan: 'Comparing loans of {amount} over {months} months',
  mirrorAccount: 'Comparing accounts at an average balance of {amount}',
  previewOpen: 'Open with these numbers',
  previewCancel: 'Not now',
  previewLoading: 'Computing the preview…',
  previewFailed: "Couldn't compute a preview — open the tool to see the result.",
  previewEmiResult: 'EMI {emi} a month · {total} paid in total',
  previewPayoffResult: 'Clear in {months} months · {interest} in interest',
  previewDepositResult: 'Best net return {value} — {name}',
  previewRewardsResult: 'Best estimated net value {value} a year — {name}',
  previewLoanResult: 'Lowest total cost {total} — {name}',
  previewAccountResult: 'Best net value {value} a year — {name}',
  loanAmountLabel: 'Loan amount (BDT)',
  loanTenureLabel: 'Tenure (months)',
  loanPurposeLabel: 'Purpose',
  loanPurposeAny: 'Any purpose',
  loanRunLabel: 'Compare loans',
  loanResultsHeading: 'Loan cost at your amount and tenure',
  loanMonthlyLabel: 'Monthly payment',
  loanTotalInterestLabel: 'Total interest',
  loanBandNote:
    'Banks publish rate bands, not single rates — every figure is shown at both ends of the band, never collapsed to one invented number.',
  loanEmpty: 'No loan products match this amount and tenure.',
  loanError: 'The loan comparison could not be loaded. Please try again.',
  accountBalanceLabel: 'Typical balance (BDT)',
  accountRunLabel: 'Compare accounts',
  accountResultsHeading: 'Net yearly value at your balance',
  accountNetLabel: 'Net per year',
  accountFeesLabel: 'Fees per year',
  accountEmpty: 'No accounts to compare at this balance.',
  accountError: 'The account comparison could not be loaded. Please try again.',
  backToPlan: 'Back to Plan',
};

const bn: PlanCopy = {
  heading: 'প্ল্যান',
  intro:
    'অর্থের প্রশ্নগুলোর জন্য একটি ওয়ার্কস্পেস: ঋণের মাসিক কিস্তি কত, ব্যালান্স কত দ্রুত শোধ হবে, আমানতে কত ফেরত আসবে, কোন অ্যাকাউন্টে আপনার টাকা সবচেয়ে বেশি থাকে। আপনার সংখ্যাগুলো টুলগুলো আগে থেকে সাজিয়ে দেয়, আর সাইন ইন থাকলে পরিস্থিতি আপনার অ্যাকাউন্টে সংরক্ষিত হয়।',
  toolsHeading: 'টুলসমূহ',
  toolEmi: 'ইএমআই ক্যালকুলেটর',
  toolEmiDesc: 'আসল কার্ডের হার বা নিজের হারে ঋণের মাসিক কিস্তি ও মোট সুদ।',
  toolPayoff: 'পরিশোধ ক্যালকুলেটর',
  toolPayoffDesc: 'নির্দিষ্ট মাসিক পরিশোধে কার্ডের ব্যালান্স শোধ হতে কতদিন লাগবে — এবং খরচ কত।',
  toolRewards: 'রিওয়ার্ডের মূল্য',
  toolRewardsDesc: 'আপনার মাসিক খরচে প্রতিটি কার্ডের পয়েন্ট ও ক্যাশব্যাকের আসল মূল্য কত।',
  toolDeposit: 'আমানতের মেয়াদপূর্তি',
  toolDepositDesc:
    'প্রকাশিত ব্যাংকের হার বা নিজের হারে কর বাদে এফডিআর ও ডিপিএসের মেয়াদপূর্তির মান।',
  toolLoan: 'ঋণের তুলনা',
  toolLoanDesc:
    'আপনার পরিমাণ ও মেয়াদে প্রতিটি ঋণদাতার আসল খরচ, প্রতিটি হারের ব্যান্ডের দুই প্রান্তেই হিসাব করে।',
  toolAccount: 'অ্যাকাউন্টের তুলনা',
  toolAccountDesc:
    'নির্ধারিত ফি বাদে আপনার সাধারণ ব্যালান্সে সঞ্চয়ী ও চলতি অ্যাকাউন্টের বার্ষিক নিট মূল্য।',
  toolEligibility: 'যোগ্যতা যাচাই',
  toolEligibilityDesc:
    'আপনার আয় ও কাগজপত্রে কোন কার্ডগুলো পাওয়ার সম্ভাবনা আছে — একটি ধারণা মাত্র, কখনো প্রতিশ্রুতি নয়।',
  numbersNote:
    'টুলগুলো আমার ক্রেডিটমেটের আপনার সংখ্যা দিয়ে আগে থেকে সাজানো থাকে; এখানে বা সেখানে যেকোনো সময় বদলান।',
  saveScenario: 'পরিস্থিতি সংরক্ষণ করুন',
  scenarioNameLabel: 'এই পরিস্থিতির নাম দিন',
  scenarioSaved: 'পরিস্থিতি আপনার অ্যাকাউন্টে সংরক্ষিত হয়েছে।',
  scenarioSaveFailed: 'পরিস্থিতি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।',
  savedHeading: 'আপনার সংরক্ষিত পরিস্থিতি',
  noSavedScenarios: 'এখনো কোনো সংরক্ষিত পরিস্থিতি নেই। একটি টুল চালিয়ে ফলাফল এখানে সংরক্ষণ করুন।',
  signInToSave: 'পরিস্থিতি আপনার অ্যাকাউন্টে সংরক্ষণ করে যেকোনো ডিভাইসে আবার খুলতে সাইন ইন করুন।',
  openLabel: 'খুলুন',
  deleteLabel: 'মুছুন',
  scenarioDeleted: 'পরিস্থিতি মোছা হয়েছে।',
  mirrorEmi: '{rate}% হারে {months} মাসের জন্য {amount} ঋণ নিচ্ছেন',
  mirrorPayoff: '{rate}% হারে {balance} ব্যালেন্সের জন্য মাসে {payment} পরিশোধ করছেন',
  mirrorDepositFdr: '{rate}% হারে {months} মাসের জন্য {amount} সঞ্চয় করছেন',
  mirrorDepositDps: '{rate}% হারে {months} মাস ধরে প্রতি মাসে {amount} সঞ্চয় করছেন',
  mirrorRewards: 'আপনার ক্যাটেগরিগুলোতে প্রতি মাসে {amount} খরচ করছেন',
  mirrorLoan: '{months} মাসের মেয়াদে {amount} ঋণের তুলনা করছেন',
  mirrorAccount: 'গড় ব্যালেন্স {amount} ধরে অ্যাকাউন্টগুলোর তুলনা করছেন',
  previewOpen: 'এই সংখ্যাগুলো দিয়ে খুলুন',
  previewCancel: 'এখন নয়',
  previewLoading: 'প্রিভিউ হিসাব হচ্ছে…',
  previewFailed: 'প্রিভিউ হিসাব করা যায়নি — ফলাফল দেখতে টুলটি খুলুন।',
  previewEmiResult: 'মাসে কিস্তি {emi} — মোট পরিশোধ {total}',
  previewPayoffResult: '{months} মাসে পরিশোধ হবে — সুদ {interest}',
  previewDepositResult: 'সেরা নিট রিটার্ন {value} — {name}',
  previewRewardsResult: 'বছরে সেরা আনুমানিক নিট মান {value} — {name}',
  previewLoanResult: 'সর্বনিম্ন মোট খরচ {total} — {name}',
  previewAccountResult: 'বছরে সেরা নিট মান {value} — {name}',
  loanAmountLabel: 'ঋণের পরিমাণ (টাকা)',
  loanTenureLabel: 'মেয়াদ (মাস)',
  loanPurposeLabel: 'উদ্দেশ্য',
  loanPurposeAny: 'যেকোনো উদ্দেশ্য',
  loanRunLabel: 'ঋণ তুলনা করুন',
  loanResultsHeading: 'আপনার পরিমাণ ও মেয়াদে ঋণের খরচ',
  loanMonthlyLabel: 'মাসিক কিস্তি',
  loanTotalInterestLabel: 'মোট সুদ',
  loanBandNote:
    'ব্যাংকগুলো একক হার নয়, হারের ব্যান্ড প্রকাশ করে — প্রতিটি হিসাব ব্যান্ডের দুই প্রান্তেই দেখানো হয়, কখনো একটি বানানো সংখ্যায় মেলানো হয় না।',
  loanEmpty: 'এই পরিমাণ ও মেয়াদে কোনো ঋণ পণ্য মেলেনি।',
  loanError: 'ঋণের তুলনা লোড করা যায়নি। আবার চেষ্টা করুন।',
  accountBalanceLabel: 'সাধারণ ব্যালান্স (টাকা)',
  accountRunLabel: 'অ্যাকাউন্ট তুলনা করুন',
  accountResultsHeading: 'আপনার ব্যালান্সে বার্ষিক নিট মূল্য',
  accountNetLabel: 'বছরে নিট',
  accountFeesLabel: 'বছরে ফি',
  accountEmpty: 'এই ব্যালান্সে তুলনার মতো কোনো অ্যাকাউন্ট নেই।',
  accountError: 'অ্যাকাউন্টের তুলনা লোড করা যায়নি। আবার চেষ্টা করুন।',
  backToPlan: 'প্ল্যানে ফিরুন',
};

export const getPlanCopy = (lang: Language): PlanCopy => (lang === 'bn' ? bn : en);
