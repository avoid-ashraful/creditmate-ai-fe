/**
 * UI copy for the eligibility checker page.
 * Bengali strings are drafted and need review by a native speaker before release.
 *
 * Copy discipline: this page must never promise an approval outcome. The
 * words for "pre-approved" / "guaranteed" must not appear here in either
 * language; results are estimates and the bank decides.
 */

import type { Language } from './types';

export interface EligibilityCopy {
  seoTitle: string;
  seoDescription: string;
  heading: string;
  intro: string;
  estimateBanner: string;
  formHeading: string;
  monthlyIncome: string;
  monthlyIncomePlaceholder: string;
  incomeRequired: string;
  employmentType: string;
  employmentSalaried: string;
  employmentSelfEmployed: string;
  employmentOther: string;
  age: string;
  ageOptional: string;
  hasTin: string;
  hasTinYes: string;
  hasTinNo: string;
  hasTinUnset: string;
  cibStatus: string;
  cibHelp: string;
  cibClean: string;
  cibHasIssues: string;
  cibUnknown: string;
  islamicOnly: string;
  submit: string;
  checking: string;
  privacyNote: string;
  resultsHeading: string;
  /** Placeholders: {total} */
  totalConsidered: string;
  /** Placeholders: {withMin}, {total} */
  coverageNote: string;
  verdictEligible: string;
  verdictLikely: string;
  verdictUnknown: string;
  verdictNotYet: string;
  verdictEligibleHint: string;
  verdictLikelyHint: string;
  verdictUnknownHint: string;
  verdictNotYetHint: string;
  annualFee: string;
  apr: string;
  minIncome: string;
  noMinIncome: string;
  viewDetails: string;
  compare: string;
  notesHeading: string;
  howItWorks: string;
  emptyResults: string;
  errorResults: string;
  retry: string;
  checkAnother: string;
  loadingLabel: string;
}

const en: EligibilityCopy = {
  seoTitle: 'Credit Card Eligibility Checker',
  seoDescription:
    'Estimate which Bangladeshi credit cards fit your income using each card’s published minimum income. An estimate only — the bank makes the final decision.',
  heading: 'Eligibility Checker',
  intro:
    'Answer a few questions and we will compare your income with each card’s published minimum monthly income. Cards that publish no minimum are shown separately — we never guess for them.',
  estimateBanner:
    'This checker gives an estimate based on published criteria and your answers. It is not an approval: the bank makes the final decision after its CIB and document checks.',
  formHeading: 'Your profile',
  monthlyIncome: 'Monthly income (BDT)',
  monthlyIncomePlaceholder: 'e.g. 30000',
  incomeRequired: 'Enter your monthly income as a number of 0 or more.',
  employmentType: 'Employment type',
  employmentSalaried: 'Salaried',
  employmentSelfEmployed: 'Self-employed',
  employmentOther: 'Other',
  age: 'Age',
  ageOptional: 'Optional',
  hasTin: 'Do you have an e-TIN certificate?',
  hasTinYes: 'Yes',
  hasTinNo: 'No',
  hasTinUnset: 'Prefer not to say',
  cibStatus: 'CIB status (your best knowledge)',
  cibHelp:
    'Banks check your Credit Information Bureau (CIB) report. If you are unsure, choose “Not sure”.',
  cibClean: 'Clean — no missed payments or dues',
  cibHasIssues: 'I have dues / missed payments',
  cibUnknown: 'Not sure',
  islamicOnly: 'Islamic (Shariah-compliant) cards only',
  submit: 'Check my eligibility',
  checking: 'Checking…',
  privacyNote: 'Your answers are used only for this check and are not stored.',
  resultsHeading: 'Your estimated results',
  totalConsidered: '{total} cards considered',
  coverageNote:
    'Only {withMin} of {total} cards publish a minimum income. The rest are listed under “No published requirement” instead of being guessed.',
  verdictEligible: 'Eligible on published criteria',
  verdictLikely: 'Likely — close or unconfirmed',
  verdictUnknown: 'No published requirement',
  verdictNotYet: 'Not yet',
  verdictEligibleHint: 'Your income meets the published minimum and you declared a clean CIB.',
  verdictLikelyHint:
    'You are within 20% of the minimum, or your CIB status is unconfirmed. The bank decides.',
  verdictUnknownHint:
    'The bank publishes no income minimum for these cards, so we cannot estimate.',
  verdictNotYetHint: 'Your income is below the published minimum, or CIB issues were declared.',
  annualFee: 'Annual fee',
  apr: 'APR',
  minIncome: 'Published minimum income',
  noMinIncome: 'Not published',
  viewDetails: 'View details',
  compare: 'Compare',
  notesHeading: 'Good to know before you apply',
  howItWorks: 'How this estimate works',
  emptyResults: 'No cards matched those answers. Try turning off the Islamic-only filter.',
  errorResults: 'We could not run the check just now. Please try again.',
  retry: 'Try again',
  checkAnother: 'Check another profile',
  loadingLabel: 'Checking eligibility…',
};

const bn: EligibilityCopy = {
  seoTitle: 'ক্রেডিট কার্ড যোগ্যতা যাচাই',
  seoDescription:
    'প্রকাশিত ন্যূনতম আয় অনুযায়ী কোন বাংলাদেশি ক্রেডিট কার্ড আপনার আয়ের সঙ্গে মেলে তা অনুমান করুন। এটি কেবল একটি অনুমান — চূড়ান্ত সিদ্ধান্ত ব্যাংকের।',
  heading: 'যোগ্যতা যাচাই',
  intro:
    'কয়েকটি প্রশ্নের উত্তর দিন; আমরা প্রতিটি কার্ডের প্রকাশিত ন্যূনতম মাসিক আয়ের সঙ্গে আপনার আয় মিলিয়ে দেখব। যেসব কার্ড ন্যূনতম আয় প্রকাশ করে না, সেগুলো আলাদাভাবে দেখানো হয় — আমরা অনুমান করি না।',
  estimateBanner:
    'এই যাচাই প্রকাশিত মানদণ্ড ও আপনার উত্তরের ভিত্তিতে একটি অনুমান মাত্র। এটি অনুমোদন নয়: সিআইবি ও নথি যাচাইয়ের পর চূড়ান্ত সিদ্ধান্ত ব্যাংক নেয়।',
  formHeading: 'আপনার তথ্য',
  monthlyIncome: 'মাসিক আয় (টাকা)',
  monthlyIncomePlaceholder: 'যেমন ৩০০০০',
  incomeRequired: 'আপনার মাসিক আয় ০ বা তার বেশি সংখ্যায় লিখুন।',
  employmentType: 'পেশার ধরন',
  employmentSalaried: 'চাকরিজীবী',
  employmentSelfEmployed: 'স্ব-কর্মসংস্থান / ব্যবসা',
  employmentOther: 'অন্যান্য',
  age: 'বয়স',
  ageOptional: 'ঐচ্ছিক',
  hasTin: 'আপনার কি ই-টিন সনদ আছে?',
  hasTinYes: 'হ্যাঁ',
  hasTinNo: 'না',
  hasTinUnset: 'বলতে চাই না',
  cibStatus: 'সিআইবি অবস্থা (আপনার জানামতে)',
  cibHelp:
    "ব্যাংক আপনার ক্রেডিট ইনফরমেশন ব্যুরো (সিআইবি) প্রতিবেদন যাচাই করে। নিশ্চিত না হলে 'নিশ্চিত নই' বেছে নিন।",
  cibClean: 'পরিষ্কার — কোনো বকেয়া বা মিস পেমেন্ট নেই',
  cibHasIssues: 'আমার বকেয়া / মিস পেমেন্ট আছে',
  cibUnknown: 'নিশ্চিত নই',
  islamicOnly: 'শুধু ইসলামি (শরিয়াহ-সম্মত) কার্ড',
  submit: 'আমার যোগ্যতা যাচাই করুন',
  checking: 'যাচাই করা হচ্ছে…',
  privacyNote: 'আপনার উত্তর শুধু এই যাচাইয়ের জন্য ব্যবহৃত হয় এবং সংরক্ষণ করা হয় না।',
  resultsHeading: 'আপনার আনুমানিক ফলাফল',
  totalConsidered: '{total}টি কার্ড বিবেচনা করা হয়েছে',
  coverageNote:
    "{total}টি কার্ডের মধ্যে মাত্র {withMin}টি ন্যূনতম আয় প্রকাশ করে। বাকিগুলো অনুমান না করে 'প্রকাশিত শর্ত নেই' অংশে রাখা হয়েছে।",
  verdictEligible: 'প্রকাশিত মানদণ্ডে যোগ্য',
  verdictLikely: 'সম্ভাব্য — কাছাকাছি বা অনিশ্চিত',
  verdictUnknown: 'প্রকাশিত শর্ত নেই',
  verdictNotYet: 'এখনও নয়',
  verdictEligibleHint:
    'আপনার আয় প্রকাশিত ন্যূনতম আয় পূরণ করে এবং আপনি পরিষ্কার সিআইবি জানিয়েছেন।',
  verdictLikelyHint:
    'আপনি ন্যূনতম আয়ের ২০%-এর মধ্যে আছেন, অথবা আপনার সিআইবি অবস্থা অনিশ্চিত। সিদ্ধান্ত ব্যাংকের।',
  verdictUnknownHint:
    'এসব কার্ডে ব্যাংক আয়ের ন্যূনতম শর্ত প্রকাশ করে না, তাই আমরা অনুমান করতে পারি না।',
  verdictNotYetHint: 'আপনার আয় প্রকাশিত ন্যূনতম আয়ের নিচে, অথবা সিআইবি সমস্যা জানানো হয়েছে।',
  annualFee: 'বার্ষিক ফি',
  apr: 'এপিআর',
  minIncome: 'প্রকাশিত ন্যূনতম আয়',
  noMinIncome: 'প্রকাশিত নয়',
  viewDetails: 'বিস্তারিত দেখুন',
  compare: 'তুলনা করুন',
  notesHeading: 'আবেদনের আগে জেনে রাখুন',
  howItWorks: 'এই অনুমান কীভাবে কাজ করে',
  emptyResults: 'এই উত্তরে কোনো কার্ড মেলেনি। ইসলামি-শুধু ফিল্টার বন্ধ করে আবার চেষ্টা করুন।',
  errorResults: 'এই মুহূর্তে যাচাই করা যায়নি। আবার চেষ্টা করুন।',
  retry: 'আবার চেষ্টা করুন',
  checkAnother: 'অন্য তথ্য দিয়ে যাচাই করুন',
  loadingLabel: 'যোগ্যতা যাচাই করা হচ্ছে…',
};

export const ELIGIBILITY_COPY: Record<Language, EligibilityCopy> = { en, bn };

export const getEligibilityCopy = (lang: Language): EligibilityCopy => ELIGIBILITY_COPY[lang];
