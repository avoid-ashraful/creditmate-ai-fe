/**
 * UI copy for the Home decision dashboard (Phase 1, plan Section 2.3).
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Language } from './types';

export interface HomeCopy {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  promise: string;
  coverage: string;
  profileHeading: string;
  profileBalanceLabel: string;
  profileSpendLabel: string;
  profileLoanLabel: string;
  profileDefaultsNote: string;
  profileMakeYours: string;
  profileSave: string;
  profileSaved: string;
  modesHeading: string;
  modeCardsTitle: string;
  modeCardsBlurb: string;
  modeSaveTitle: string;
  modeSaveBlurb: string;
  modeBorrowTitle: string;
  modeToolsTitle: string;
  modeToolsBlurb: string;
  bestDepositHeadline: string;
  bestAccountHeadline: string;
  cheapestLoanHeadline: string;
  topCardHeadline: string;
  headlineUnavailable: string;
  explore: string;
  shortlistHeading: string;
  shortlistEmpty: string;
  shortlistView: string;
  savedHeading: string;
  verifiedHeading: string;
  verifiedEmpty: string;
  verifiedIntro: string;
  learnHeading: string;
  trustHeading: string;
  trustBody: string;
  trustMethodologyLink: string;
  // First-time profile primer (Phase 4, addendum B9): one question per
  // screen on mobile, fully skippable, stores only the three numbers.
  primerTitle: string;
  primerIntro: string;
  primerProgress: string;
  primerNext: string;
  primerSkip: string;
  primerDone: string;
  primerBalanceQ: string;
  primerSpendQ: string;
  primerLoanQ: string;
}

const en: HomeCopy = {
  seoTitle: 'Compare cards, deposits, loans & accounts in Bangladesh | CreditMate AI',
  seoDescription:
    'CreditMate compares credit cards, deposits, loans and bank accounts in Bangladesh with published rates, sources and dates — no sponsored rankings.',
  heading: 'Where do you stand — and what is your next decision?',
  promise:
    'Every Bangladeshi bank product we list carries its price, its source, and the date it was verified. Nothing is ranked because someone paid us.',
  coverage: '{banks} banks · {products} products compared',
  profileHeading: 'Your numbers',
  profileBalanceLabel: 'Typical account balance',
  profileSpendLabel: 'Monthly card spend',
  profileLoanLabel: 'Planned loan amount',
  profileDefaultsNote:
    'Showing sensible Bangladesh defaults. Make them yours and every page follows.',
  profileMakeYours: 'Make these yours',
  profileSave: 'Save as my defaults',
  profileSaved: 'Your defaults are saved on this device.',
  modesHeading: 'Start with a decision',
  modeCardsTitle: 'Cards',
  modeCardsBlurb: 'Compare every credit card by score, fee and rewards.',
  modeSaveTitle: 'Save',
  modeSaveBlurb: 'FDR, DPS and accounts ranked by what you actually keep.',
  modeBorrowTitle: 'Borrow',
  modeToolsTitle: 'Tools',
  modeToolsBlurb: 'Eligibility, calculators and side-by-side comparison.',
  bestDepositHeadline: 'Best net return on {amount} for {months} months: {value} ({name})',
  bestAccountHeadline: 'Best net value at a {balance} balance: {value} a year ({name})',
  cheapestLoanHeadline: 'Cheapest personal loan at {amount}: EMI {min}–{max} / month',
  topCardHeadline: 'Highest CreditMate Score: {score} — {name}',
  headlineUnavailable: 'Live figures are unavailable right now — open the page to compare.',
  explore: 'Explore',
  shortlistHeading: 'Your shortlist & saved',
  shortlistEmpty:
    'Nothing shortlisted yet. Add products while you compare and they will wait for you here.',
  shortlistView: 'Open shortlist',
  savedHeading: 'Saved searches',
  verifiedHeading: 'Recently verified',
  verifiedEmpty: 'No recently verified products to show yet.',
  verifiedIntro: 'The products most recently verified in our nightly checks:',
  learnHeading: 'Learn before you decide',
  trustHeading: 'How CreditMate stays honest',
  trustBody:
    'Rates are published bands, never invented points. Islamic products show expected profit, never “interest”. Government Sanchayapatra is a benchmark, never ranked as a bank. Every figure names its source.',
  trustMethodologyLink: 'Read the methodology',
  primerTitle: 'Set your numbers',
  primerIntro:
    'Three numbers make every comparison yours. Skip any of them — the usual Bangladesh defaults apply instead.',
  primerProgress: '{current} of {total}',
  primerNext: 'Next',
  primerSkip: 'Skip',
  primerDone: 'Done',
  primerBalanceQ: 'What balance do you usually keep in your account?',
  primerSpendQ: 'What do you spend on cards in a typical month?',
  primerLoanQ: 'If you took a loan, how much would it be for?',
};

const bn: HomeCopy = {
  seoTitle: 'বাংলাদেশে কার্ড, আমানত, ঋণ ও অ্যাকাউন্ট তুলনা করুন | ক্রেডিটমেট এআই',
  seoDescription:
    'ক্রেডিটমেট বাংলাদেশের ক্রেডিট কার্ড, আমানত, ঋণ ও ব্যাংক অ্যাকাউন্ট প্রকাশিত হার, উৎস ও তারিখসহ তুলনা করে — কোনো স্পনসরড র‍্যাঙ্কিং নেই।',
  heading: 'আপনি কোথায় দাঁড়িয়ে — আর আপনার পরের সিদ্ধান্ত কোনটি?',
  promise:
    'আমাদের তালিকার প্রতিটি বাংলাদেশি ব্যাংক পণ্যের দাম, উৎস ও যাচাইয়ের তারিখ দেওয়া থাকে। কেউ টাকা দিয়েছে বলে কিছু র‍্যাঙ্ক হয় না।',
  coverage: '{banks}টি ব্যাংক, {products}টি পণ্য তুলনা করা হয়েছে',
  profileHeading: 'আপনার সংখ্যা',
  profileBalanceLabel: 'সাধারণ অ্যাকাউন্ট ব্যালান্স',
  profileSpendLabel: 'মাসিক কার্ড খরচ',
  profileLoanLabel: 'পরিকল্পিত ঋণের পরিমাণ',
  profileDefaultsNote:
    'বাংলাদেশের জন্য যুক্তিসংগত ডিফল্ট দেখানো হচ্ছে। নিজের মতো করুন, প্রতিটি পৃষ্ঠা তা অনুসরণ করবে।',
  profileMakeYours: 'নিজের মতো করুন',
  profileSave: 'আমার ডিফল্ট হিসেবে সংরক্ষণ করুন',
  profileSaved: 'আপনার ডিফল্ট এই ডিভাইসে সংরক্ষিত হয়েছে।',
  modesHeading: 'একটি সিদ্ধান্ত দিয়ে শুরু করুন',
  modeCardsTitle: 'কার্ড',
  modeCardsBlurb: 'স্কোর, ফি ও রিওয়ার্ড অনুযায়ী প্রতিটি ক্রেডিট কার্ড তুলনা করুন।',
  modeSaveTitle: 'সঞ্চয়',
  modeSaveBlurb: 'আসলে যা রাখতে পারবেন তা অনুযায়ী এফডিআর, ডিপিএস ও অ্যাকাউন্ট র‍্যাঙ্ক করা।',
  modeBorrowTitle: 'ঋণ',
  modeToolsTitle: 'টুলস',
  modeToolsBlurb: 'যোগ্যতা, ক্যালকুলেটর ও পাশাপাশি তুলনা।',
  bestDepositHeadline: '{months} মাসে {amount}-এর সেরা নিট রিটার্ন: {value} ({name})',
  bestAccountHeadline: '{balance} ব্যালান্সে সেরা নিট মূল্য: বছরে {value} ({name})',
  cheapestLoanHeadline: '{amount}-এ সবচেয়ে সস্তা ব্যক্তিগত ঋণ: ইএমআই {min}–{max} / মাস',
  topCardHeadline: 'সর্বোচ্চ ক্রেডিটমেট স্কোর: {score} — {name}',
  headlineUnavailable: 'লাইভ হিসাব এখন পাওয়া যাচ্ছে না — তুলনা করতে পৃষ্ঠাটি খুলুন।',
  explore: 'দেখুন',
  shortlistHeading: 'আপনার তালিকা ও সংরক্ষিত',
  shortlistEmpty:
    'এখনো কিছু তালিকাভুক্ত নয়। তুলনা করার সময় পণ্য যোগ করুন, সেগুলো এখানে অপেক্ষা করবে।',
  shortlistView: 'তালিকা খুলুন',
  savedHeading: 'সংরক্ষিত অনুসন্ধান',
  verifiedHeading: 'সম্প্রতি যাচাইকৃত',
  verifiedEmpty: 'এখনো দেখানোর মতো সম্প্রতি যাচাইকৃত কোনো পণ্য নেই।',
  verifiedIntro: 'আমাদের রাতের যাচাইয়ে সবচেয়ে সম্প্রতি যাচাইকৃত পণ্যসমূহ:',
  learnHeading: 'সিদ্ধান্তের আগে জানুন',
  trustHeading: 'ক্রেডিটমেট কীভাবে সৎ থাকে',
  trustBody:
    'হার প্রকাশিত ব্যান্ড, কখনো বানানো পয়েন্ট নয়। ইসলামিক পণ্যে প্রত্যাশিত মুনাফা, কখনো সুদ নয়। সরকারি সঞ্চয়পত্র একটি বেঞ্চমার্ক, কখনো ব্যাংক হিসেবে র‍্যাঙ্ক নয়। প্রতিটি সংখ্যার উৎস উল্লেখ থাকে।',
  trustMethodologyLink: 'পদ্ধতি পড়ুন',
  primerTitle: 'আপনার সংখ্যাগুলো সেট করুন',
  primerIntro:
    'তিনটি সংখ্যা প্রতিটি তুলনাকে আপনার জন্য সাজিয়ে দেয়। যেকোনোটি এড়িয়ে যেতে পারেন — সেক্ষেত্রে বাংলাদেশের প্রচলিত ডিফল্টগুলো প্রযোজ্য হবে।',
  primerProgress: '{total}টির মধ্যে {current}',
  primerNext: 'পরেরটি',
  primerSkip: 'এড়িয়ে যান',
  primerDone: 'সম্পন্ন',
  primerBalanceQ: 'আপনি সাধারণত আপনার অ্যাকাউন্টে কত ব্যালেন্স রাখেন?',
  primerSpendQ: 'একটি সাধারণ মাসে আপনি কার্ডে কত খরচ করেন?',
  primerLoanQ: 'যদি ঋণ নেন, তাহলে কত টাকার জন্য নেবেন?',
};

export const HOME_COPY: Record<Language, HomeCopy> = { en, bn };

export const getHomeCopy = (lang: Language): HomeCopy => HOME_COPY[lang];
