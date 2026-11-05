/**
 * Perfect-card-finder quiz copy (redesign Phase 2 rebuild).
 *
 * The rebuilt quiz asks first-order constraint questions first
 * (income, Islamic preference, annual fee, network, bank) and only
 * then preference questions (spend, main use, travel). Nothing is
 * preselected: every question starts unanswered.
 */

import type { Language } from './types';

export interface QuizCopy {
  stepIncome: string;
  incomeLabel: string;
  incomeOptions: string[];
  stepIslamic: string;
  islamicLabel: string;
  islamicOptions: string[];
  stepFee: string;
  stepNetwork: string;
  networkLabel: string;
  networkOptions: string[];
  noPreference: string;
  stepBank: string;
  bankLabel: string;
  anyBank: string;
  stepSpend: string;
  spendLabel: string;
  spendPlaceholder: string;
  skipButton: string;
  resultsCount: string;
  appliedFiltersLabel: string;
  noMatches: string;
  noMatchesNote: string;
  chipIncome: string;
  chipIslamicOnly: string;
  chipFeeNone: string;
  chipFeeUpTo: string;
  chipNetwork: string;
  chipBank: string;
}

const en: QuizCopy = {
  stepIncome: 'Income',
  incomeLabel: 'What is your monthly income?',
  incomeOptions: [
    'Up to BDT 30,000',
    'BDT 30,000 – 50,000',
    'BDT 50,000 – 100,000',
    'Above BDT 100,000',
  ],
  stepIslamic: 'Islamic',
  islamicLabel: 'Should the card be Shariah-compliant (Islamic)?',
  islamicOptions: ['No preference', 'Islamic cards only'],
  stepFee: 'Annual fee',
  stepNetwork: 'Network',
  networkLabel: 'Do you prefer a card network?',
  networkOptions: ['Visa', 'Mastercard', 'American Express'],
  noPreference: 'No preference',
  stepBank: 'Bank',
  bankLabel: 'Do you prefer a specific bank?',
  anyBank: 'Any bank',
  stepSpend: 'Spending',
  spendLabel: 'How much do you spend in a typical month?',
  spendPlaceholder: 'e.g. 50,000',
  skipButton: 'Skip',
  resultsCount: '{count} cards match your answers',
  appliedFiltersLabel: 'Your answers, applied as filters',
  noMatches: 'No cards match all of those answers.',
  noMatchesNote:
    'Try widening one answer — for example a higher fee tolerance — or browse everything that matches the rest.',
  chipIncome: 'Income up to BDT {cap}',
  chipIslamicOnly: 'Islamic only',
  chipFeeNone: 'No annual fee',
  chipFeeUpTo: 'Annual fee up to BDT {cap}',
  chipNetwork: '{network}',
  chipBank: '{bank}',
};

const bn: QuizCopy = {
  stepIncome: 'আয়',
  incomeLabel: 'আপনার মাসিক আয় কত?',
  incomeOptions: [
    'সর্বোচ্চ ৩০,০০০ টাকা',
    '৩০,০০০ – ৫০,০০০ টাকা',
    '৫০,০০০ – ১,০০,০০০ টাকা',
    '১,০০,০০০ টাকার বেশি',
  ],
  stepIslamic: 'ইসলামি',
  islamicLabel: 'কার্ডটি কি শরিয়াহ-সম্মত (ইসলামি) হতে হবে?',
  islamicOptions: ['কোনো পছন্দ নেই', 'শুধু ইসলামি কার্ড'],
  stepFee: 'বার্ষিক ফি',
  stepNetwork: 'নেটওয়ার্ক',
  networkLabel: 'কোনো কার্ড নেটওয়ার্ক পছন্দ আছে কি?',
  networkOptions: ['ভিসা', 'মাস্টারকার্ড', 'আমেরিকান এক্সপ্রেস'],
  noPreference: 'কোনো পছন্দ নেই',
  stepBank: 'ব্যাংক',
  bankLabel: 'নির্দিষ্ট কোনো ব্যাংক পছন্দ আছে কি?',
  anyBank: 'যেকোনো ব্যাংক',
  stepSpend: 'খরচ',
  spendLabel: 'সাধারণত এক মাসে আপনি কত খরচ করেন?',
  spendPlaceholder: 'যেমন ৫০,০০০',
  skipButton: 'এড়িয়ে যান',
  resultsCount: '{count}টি কার্ড আপনার উত্তর মিলেছে',
  appliedFiltersLabel: 'আপনার উত্তর, ফিল্টার হিসেবে প্রয়োগ করা হয়েছে',
  noMatches: 'কোনো কার্ডই সব উত্তরের সাথে মেলেনি।',
  noMatchesNote:
    'একটি উত্তর শিথিল করে দেখুন — যেমন বেশি ফি সহনশীলতা — অথবা বাকি উত্তর মেলা সবকিছু দেখুন।',
  chipIncome: 'আয় সর্বোচ্চ {cap} টাকা',
  chipIslamicOnly: 'শুধু ইসলামি',
  chipFeeNone: 'বার্ষিক ফি নেই',
  chipFeeUpTo: 'বার্ষিক ফি সর্বোচ্চ {cap} টাকা',
  chipNetwork: '{network}',
  chipBank: '{bank}',
};

export const getQuizCopy = (lang: Language): QuizCopy => (lang === 'bn' ? bn : en);
