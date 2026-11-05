/**
 * UI copy for the Phase 1 app shell: mode navigation, the command palette,
 * the shortlist tray, and the My CreditMate area.
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Language } from './types';

export interface ShellCopy {
  // Modes & shell navigation
  modeCards: string;
  modeSave: string;
  modeBorrow: string;
  modeTools: string;
  navBanks: string;
  navLearn: string;
  navMy: string;
  navAriaLabel: string;
  mobileNavAriaLabel: string;
  skipToContent: string;
  languageLabel: string;
  subCardsDiscover: string;
  subDeposits: string;
  subAccounts: string;
  subLoans: string;
  subPlan: string;
  subCalculators: string;
  subRewardCalculator: string;
  subCompare: string;
  subEligibility: string;
  subQuiz: string;
  subGuides: string;
  subMethodology: string;
  subGlossary: string;
  subMyHome: string;
  subMySaved: string;
  subMyAlerts: string;
  subMyProfile: string;
  moreButton: string;
  collapseRail: string;
  expandRail: string;
  searchPill: string;
  searchAriaLabel: string;
  shortlistButton: string;
  shortlistCountLabel: string;
  shortlistEmpty: string;
  shortlistCompareCards: string;
  shortlistRemove: string;
  shortlistFull: string;
  shortlistAdded: string;
  shortlistRemoved: string;
  signIn: string;
  register: string;
  signOut: string;
  accountMenuAriaLabel: string;
  // Command palette
  palettePlaceholder: string;
  paletteAriaLabel: string;
  paletteGroupActions: string;
  paletteGroupProducts: string;
  paletteGroupBanks: string;
  paletteGroupRecent: string;
  paletteNoResults: string;
  paletteLoading: string;
  actionEligibility: string;
  actionCompare: string;
  actionEmi: string;
  actionPayoff: string;
  actionRewards: string;
  actionQuiz: string;
  actionDeposits: string;
  actionLoans: string;
  actionAccounts: string;
  // My CreditMate
  myHeading: string;
  myIntro: string;
  myShortlistHeading: string;
  mySavedSearchesHeading: string;
  mySavedItemsHeading: string;
  myAlertsHeading: string;
  myProfileHeading: string;
  myNoSavedSearches: string;
  myNoShortlist: string;
  myRunSearch: string;
  myDeleteSearch: string;
  mySearchDeleted: string;
  myViewAllSaved: string;
  mySavedCounts: string;
  myManageAlerts: string;
  myEditProfile: string;
  mySignedOut: string;
  myNumbersHeading: string;
  myNumbersBalance: string;
  myNumbersSpend: string;
  myNumbersLoan: string;
  myNumbersNote: string;
  myScenariosHeading: string;
  myNoScenarios: string;
  myOpenScenario: string;
  myDeleteScenario: string;
  myScenarioDeleted: string;
  footerTagline: string;
  footerRights: string;
  footerModesHeading: string;
  footerLearnHeading: string;
  footerLegalHeading: string;
}

const en: ShellCopy = {
  modeCards: 'Cards',
  modeSave: 'Save',
  modeBorrow: 'Borrow',
  modeTools: 'Tools',
  navBanks: 'Banks',
  navLearn: 'Learn',
  navMy: 'My CreditMate',
  navAriaLabel: 'Main navigation',
  mobileNavAriaLabel: 'Modes',
  skipToContent: 'Skip to content',
  languageLabel: 'Language',
  subCardsDiscover: 'Discover cards',
  subDeposits: 'Deposits',
  subAccounts: 'Bank accounts',
  subLoans: 'Loans',
  subPlan: 'Plan',
  subCalculators: 'Calculators',
  subRewardCalculator: 'Reward calculator',
  subCompare: 'Compare',
  subEligibility: 'Eligibility checker',
  subQuiz: 'Card finder quiz',
  subGuides: 'Guides',
  subMethodology: 'Methodology',
  subGlossary: 'Glossary',
  subMyHome: 'Overview',
  subMySaved: 'Saved',
  subMyAlerts: 'Alerts',
  subMyProfile: 'Profile & settings',
  moreButton: 'More',
  collapseRail: 'Collapse sidebar',
  expandRail: 'Expand sidebar',
  searchPill: 'Search banks, products, actions…',
  searchAriaLabel: 'Search CreditMate',
  shortlistButton: 'Shortlist',
  shortlistCountLabel: '{count} in shortlist',
  shortlistEmpty: 'Your shortlist is empty. Add products from any results page.',
  shortlistCompareCards: 'Compare cards',
  shortlistRemove: 'Remove {name} from shortlist',
  shortlistFull: 'Shortlist full (4) — remove one to add another.',
  shortlistAdded: '{name} added to your shortlist.',
  shortlistRemoved: '{name} removed from your shortlist.',
  signIn: 'Sign in',
  register: 'Register',
  signOut: 'Sign out',
  accountMenuAriaLabel: 'Account menu',
  palettePlaceholder: 'Search banks, products, or actions…',
  paletteAriaLabel: 'Search CreditMate',
  paletteGroupActions: 'Actions',
  paletteGroupProducts: 'Products',
  paletteGroupBanks: 'Banks',
  paletteGroupRecent: 'Recent',
  paletteNoResults:
    'No matches. Try a bank name, a product, or an action like “Check eligibility”.',
  paletteLoading: 'Searching…',
  actionEligibility: 'Check eligibility',
  actionCompare: 'Compare cards',
  actionEmi: 'EMI calculator',
  actionPayoff: 'Payoff calculator',
  actionRewards: 'Reward calculator — value-back by card',
  actionQuiz: 'Find a card — take the quiz',
  actionDeposits: 'Compare deposits (FDR & DPS)',
  actionLoans: 'Compare loans',
  actionAccounts: 'Compare bank accounts',
  myHeading: 'My CreditMate',
  myIntro: 'Your shortlist, saved searches, saved items and alerts — one decision desk.',
  myShortlistHeading: 'Your shortlist',
  mySavedSearchesHeading: 'Saved searches',
  mySavedItemsHeading: 'Saved comparisons & collections',
  myAlertsHeading: 'Alerts',
  myProfileHeading: 'Profile & settings',
  myNoSavedSearches: 'No saved searches yet. Save one from any discovery page.',
  myNoShortlist: 'Nothing shortlisted yet.',
  myRunSearch: 'Run search',
  myDeleteSearch: 'Delete saved search',
  mySearchDeleted: 'Saved search deleted.',
  myViewAllSaved: 'View saved items',
  mySavedCounts: '{comparisons} comparisons · {collections} collections',
  myManageAlerts: 'Manage alerts',
  myEditProfile: 'Edit profile & settings',
  mySignedOut: 'Sign in to see your saved searches, items and alerts.',
  myNumbersHeading: 'Your numbers',
  myNumbersBalance: 'Typical balance',
  myNumbersSpend: 'Monthly card spend',
  myNumbersLoan: 'Planned loan amount',
  myNumbersNote:
    'These defaults preset every scenario and are stored on your account, so they follow you across devices. Edit them on the home page or in Plan.',
  myScenariosHeading: 'Saved scenarios',
  myNoScenarios: 'No saved scenarios yet. Save one from any Plan tool.',
  myOpenScenario: 'Open scenario',
  myDeleteScenario: 'Delete saved scenario',
  myScenarioDeleted: 'Saved scenario deleted.',
  footerTagline: 'Making financial decisions simpler for Bangladeshi consumers.',
  footerRights: 'All rights reserved.',
  footerModesHeading: 'Decide',
  footerLearnHeading: 'Learn',
  footerLegalHeading: 'Legal & trust',
};

const bn: ShellCopy = {
  modeCards: 'কার্ড',
  modeSave: 'সঞ্চয়',
  modeBorrow: 'ঋণ',
  modeTools: 'টুলস',
  navBanks: 'ব্যাংকসমূহ',
  navLearn: 'শিখুন',
  navMy: 'আমার ক্রেডিটমেট',
  navAriaLabel: 'প্রধান নেভিগেশন',
  mobileNavAriaLabel: 'মোডসমূহ',
  skipToContent: 'মূল বিষয়বস্তুতে যান',
  languageLabel: 'ভাষা',
  subCardsDiscover: 'কার্ড খুঁজুন',
  subDeposits: 'আমানত',
  subAccounts: 'ব্যাংক অ্যাকাউন্ট',
  subLoans: 'ঋণ',
  subPlan: 'প্ল্যান',
  subCalculators: 'ক্যালকুলেটরসমূহ',
  subRewardCalculator: 'রিওয়ার্ড ক্যালকুলেটর',
  subCompare: 'তুলনা',
  subEligibility: 'যোগ্যতা যাচাই',
  subQuiz: 'কার্ড ফাইন্ডার কুইজ',
  subGuides: 'গাইড',
  subMethodology: 'পদ্ধতি',
  subGlossary: 'শব্দকোষ',
  subMyHome: 'সংক্ষিপ্ত বিবরণ',
  subMySaved: 'সংরক্ষিত',
  subMyAlerts: 'সতর্কতা',
  subMyProfile: 'প্রোফাইল ও সেটিংস',
  moreButton: 'আরও',
  collapseRail: 'সাইডবার ছোট করুন',
  expandRail: 'সাইডবার বড় করুন',
  searchPill: 'ব্যাংক, পণ্য, কাজ খুঁজুন…',
  searchAriaLabel: 'ক্রেডিটমেট অনুসন্ধান',
  shortlistButton: 'তালিকা',
  shortlistCountLabel: 'তালিকায় {count}টি',
  shortlistEmpty: 'আপনার তালিকা খালি। যেকোনো ফলাফল পৃষ্ঠা থেকে পণ্য যোগ করুন।',
  shortlistCompareCards: 'কার্ড তুলনা করুন',
  shortlistRemove: 'তালিকা থেকে {name} সরান',
  shortlistFull: 'তালিকা পূর্ণ (৪টি) — আরেকটি যোগ করতে একটি সরান।',
  shortlistAdded: '{name} আপনার তালিকায় যোগ হয়েছে।',
  shortlistRemoved: '{name} আপনার তালিকা থেকে সরানো হয়েছে।',
  signIn: 'সাইন ইন',
  register: 'নিবন্ধন',
  signOut: 'সাইন আউট',
  accountMenuAriaLabel: 'অ্যাকাউন্ট মেনু',
  palettePlaceholder: 'ব্যাংক, পণ্য বা কাজ খুঁজুন…',
  paletteAriaLabel: 'ক্রেডিটমেট অনুসন্ধান',
  paletteGroupActions: 'কাজসমূহ',
  paletteGroupProducts: 'পণ্যসমূহ',
  paletteGroupBanks: 'ব্যাংকসমূহ',
  paletteGroupRecent: 'সাম্প্রতিক',
  paletteNoResults: 'কোনো মিল নেই। ব্যাংকের নাম, পণ্য, বা যোগ্যতা যাচাই-এর মতো কাজ চেষ্টা করুন।',
  paletteLoading: 'অনুসন্ধান চলছে…',
  actionEligibility: 'যোগ্যতা যাচাই করুন',
  actionCompare: 'কার্ড তুলনা করুন',
  actionEmi: 'ইএমআই ক্যালকুলেটর',
  actionPayoff: 'পরিশোধ ক্যালকুলেটর',
  actionRewards: 'রিওয়ার্ড ক্যালকুলেটর — কার্ড অনুযায়ী ভ্যালু-ব্যাক',
  actionQuiz: 'কার্ড খুঁজুন — কুইজ দিন',
  actionDeposits: 'আমানত তুলনা করুন (এফডিআর ও ডিপিএস)',
  actionLoans: 'ঋণ তুলনা করুন',
  actionAccounts: 'ব্যাংক অ্যাকাউন্ট তুলনা করুন',
  myHeading: 'আমার ক্রেডিটমেট',
  myIntro: 'আপনার তালিকা, সংরক্ষিত অনুসন্ধান, সংরক্ষিত আইটেম ও সতর্কতা — একটিই সিদ্ধান্তের ডেস্ক।',
  myShortlistHeading: 'আপনার তালিকা',
  mySavedSearchesHeading: 'সংরক্ষিত অনুসন্ধান',
  mySavedItemsHeading: 'সংরক্ষিত তুলনা ও সংগ্রহ',
  myAlertsHeading: 'সতর্কতা',
  myProfileHeading: 'প্রোফাইল ও সেটিংস',
  myNoSavedSearches: 'এখনো কোনো সংরক্ষিত অনুসন্ধান নেই। যেকোনো খোঁজার পৃষ্ঠা থেকে সংরক্ষণ করুন।',
  myNoShortlist: 'এখনো কিছু তালিকাভুক্ত হয়নি।',
  myRunSearch: 'অনুসন্ধান চালান',
  myDeleteSearch: 'সংরক্ষিত অনুসন্ধান মুছুন',
  mySearchDeleted: 'সংরক্ষিত অনুসন্ধান মোছা হয়েছে।',
  myViewAllSaved: 'সংরক্ষিত আইটেম দেখুন',
  mySavedCounts: '{comparisons}টি তুলনা, {collections}টি সংগ্রহ',
  myManageAlerts: 'সতর্কতা পরিচালনা করুন',
  myEditProfile: 'প্রোফাইল ও সেটিংস সম্পাদনা করুন',
  mySignedOut: 'আপনার সংরক্ষিত অনুসন্ধান, আইটেম ও সতর্কতা দেখতে সাইন ইন করুন।',
  myNumbersHeading: 'আপনার সংখ্যাগুলো',
  myNumbersBalance: 'সাধারণ ব্যালান্স',
  myNumbersSpend: 'মাসিক কার্ড খরচ',
  myNumbersLoan: 'পরিকল্পিত ঋণের পরিমাণ',
  myNumbersNote:
    'এই ডিফল্টগুলো প্রতিটি পরিস্থিতি আগে থেকে সাজিয়ে দেয় এবং আপনার অ্যাকাউন্টে সংরক্ষিত থাকে, ফলে সব ডিভাইসে আপনার সঙ্গে থাকে। হোম পেজে বা প্ল্যানে এগুলো বদলান।',
  myScenariosHeading: 'সংরক্ষিত পরিস্থিতি',
  myNoScenarios: 'এখনো কোনো সংরক্ষিত পরিস্থিতি নেই। যেকোনো প্ল্যান টুল থেকে সংরক্ষণ করুন।',
  myOpenScenario: 'পরিস্থিতি খুলুন',
  myDeleteScenario: 'সংরক্ষিত পরিস্থিতি মুছুন',
  myScenarioDeleted: 'সংরক্ষিত পরিস্থিতি মোছা হয়েছে।',
  footerTagline: 'বাংলাদেশি গ্রাহকদের জন্য আর্থিক সিদ্ধান্ত সহজ করা।',
  footerRights: 'সর্বস্বত্ব সংরক্ষিত।',
  footerModesHeading: 'সিদ্ধান্ত নিন',
  footerLearnHeading: 'শিখুন',
  footerLegalHeading: 'আইনি ও আস্থা',
};

export const SHELL_COPY: Record<Language, ShellCopy> = { en, bn };

export const getShellCopy = (lang: Language): ShellCopy => SHELL_COPY[lang];
