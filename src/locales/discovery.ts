/**
 * Shared UI copy for the canonical discovery pattern (Phase 1): one search /
 * filter / sort / results system used by cards, deposits, loans and accounts.
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Language } from './types';

export interface DiscoveryCopy {
  filtersHeading: string;
  filtersButton: string;
  drawerClose: string;
  bankSearchLabel: string;
  filtersShowResults: string;
  clearAll: string;
  activeFiltersLabel: string;
  removeFilter: string;
  resultsCount: string;
  sortLabel: string;
  sortedBy: string;
  loadingResults: string;
  errorResults: string;
  retry: string;
  zeroHeading: string;
  zeroBody: string;
  zeroEliminatedBy: string;
  zeroRelax: string;
  zeroNearMisses: string;
  zeroClearAll: string;
  bankFilterHeading: string;
  bankFilterSearchPlaceholder: string;
  bankFilterNoMatch: string;
  previousPage: string;
  nextPage: string;
  pageOf: string;
  saveSearch: string;
  searchSaved: string;
  searchSaveFailed: string;
  copyLink: string;
  linkCopied: string;
  scenarioHeading: string;
  fromProfile: string;
  cardsHeading: string;
  cardsIntro: string;
  cardSearchLabel: string;
  cardSearchPlaceholder: string;
  featureSearchLabel: string;
  featureSearchPlaceholder: string;
  saveSearchNameLabel: string;
  categoryHeading: string;
  islamicOnly: string;
  allBanks: string;
  viewDetails: string;
  inShortlist: string;
  addToShortlist: string;
}

const en: DiscoveryCopy = {
  filtersHeading: 'Filters',
  filtersButton: 'Filters',
  drawerClose: 'Close filters',
  bankSearchLabel: 'Search banks',
  filtersShowResults: 'Show {count} results',
  clearAll: 'Clear all',
  activeFiltersLabel: 'Active filters',
  removeFilter: 'Remove filter: {label}',
  resultsCount: '{count} results',
  sortLabel: 'Sort',
  sortedBy: 'Sorted by {criterion}',
  loadingResults: 'Loading results…',
  errorResults: 'Results could not be loaded. Please try again.',
  retry: 'Retry',
  zeroHeading: 'No products match',
  zeroBody: 'Your filters eliminated everything. Loosen one to see near-misses.',
  zeroEliminatedBy: 'The filter that eliminated the most: {label}',
  zeroRelax: 'Remove this filter',
  zeroNearMisses: '{count} products match without your filters',
  zeroClearAll: 'Clear all filters',
  bankFilterHeading: 'Bank',
  bankFilterSearchPlaceholder: 'Search banks…',
  bankFilterNoMatch: 'No bank matches that search.',
  previousPage: 'Previous',
  nextPage: 'Next',
  pageOf: 'Page {page} of {pages}',
  saveSearch: 'Save search',
  searchSaved: 'Search saved — find it under My CreditMate.',
  searchSaveFailed: 'That search could not be saved.',
  copyLink: 'Copy link',
  linkCopied: 'Link copied — anyone with it sees this search.',
  scenarioHeading: 'Your scenario',
  cardsHeading: 'Credit cards',
  cardsIntro:
    'Every card ranked by the CreditMate Score by default. Filters, sort and page are all in the URL — copy it to share this exact view.',
  cardSearchLabel: 'Search cards',
  cardSearchPlaceholder: 'Card name, bank, or feature…',
  featureSearchLabel: 'Feature search',
  featureSearchPlaceholder: 'Search within card features…',
  saveSearchNameLabel: 'Name this search',
  categoryHeading: 'Category',
  fromProfile: 'From your profile',
  islamicOnly: 'Islamic only',
  allBanks: 'All banks',
  viewDetails: 'View details',
  inShortlist: 'In shortlist',
  addToShortlist: 'Add to shortlist',
};

const bn: DiscoveryCopy = {
  filtersHeading: 'ফিল্টার',
  filtersButton: 'ফিল্টার',
  drawerClose: 'ফিল্টার বন্ধ করুন',
  bankSearchLabel: 'ব্যাংক খুঁজুন',
  filtersShowResults: '{count}টি ফলাফল দেখুন',
  clearAll: 'সব মুছুন',
  activeFiltersLabel: 'সক্রিয় ফিল্টার',
  removeFilter: 'ফিল্টার সরান: {label}',
  resultsCount: '{count}টি ফলাফল',
  sortLabel: 'সাজান',
  sortedBy: '{criterion} অনুযায়ী সাজানো',
  loadingResults: 'ফলাফল লোড হচ্ছে…',
  errorResults: 'ফলাফল লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
  retry: 'আবার চেষ্টা করুন',
  zeroHeading: 'কোনো পণ্য মিলছে না',
  zeroBody: 'আপনার ফিল্টার সবকিছু বাদ দিয়েছে। কাছাকাছি ফলাফল দেখতে একটি শিথিল করুন।',
  zeroEliminatedBy: 'সবচেয়ে বেশি বাদ দিয়েছে যে ফিল্টার: {label}',
  zeroRelax: 'এই ফিল্টার সরান',
  zeroNearMisses: 'ফিল্টার ছাড়া {count}টি পণ্য মিলে',
  zeroClearAll: 'সব ফিল্টার মুছুন',
  bankFilterHeading: 'ব্যাংক',
  bankFilterSearchPlaceholder: 'ব্যাংক খুঁজুন…',
  bankFilterNoMatch: 'কোনো ব্যাংক এই অনুসন্ধানের সাথে মিলছে না।',
  previousPage: 'পূর্বের',
  nextPage: 'পরবর্তী',
  pageOf: 'পৃষ্ঠা {page} / {pages}',
  saveSearch: 'অনুসন্ধান সংরক্ষণ করুন',
  searchSaved: 'অনুসন্ধান সংরক্ষিত — আমার ক্রেডিটমেটে পাবেন।',
  searchSaveFailed: 'অনুসন্ধানটি সংরক্ষণ করা যায়নি।',
  copyLink: 'লিংক কপি করুন',
  linkCopied: 'লিংক কপি হয়েছে — যার কাছে থাকবে সে এই অনুসন্ধান দেখতে পাবে।',
  scenarioHeading: 'আপনার হিসাব',
  cardsHeading: 'ক্রেডিট কার্ড',
  cardsIntro:
    'প্রতিটি কার্ড ডিফল্টভাবে CreditMate স্কোর অনুযায়ী সাজানো। ফিল্টার, সর্ট ও পৃষ্ঠা সবই URL-এ থাকে — এই একই দৃশ্য শেয়ার করতে লিংকটি কপি করুন।',
  cardSearchLabel: 'কার্ড খুঁজুন',
  cardSearchPlaceholder: 'কার্ডের নাম, ব্যাংক বা বৈশিষ্ট্য…',
  featureSearchLabel: 'বৈশিষ্ট্য অনুসন্ধান',
  featureSearchPlaceholder: 'কার্ডের বৈশিষ্ট্যে খুঁজুন…',
  saveSearchNameLabel: 'এই অনুসন্ধানের নাম দিন',
  categoryHeading: 'বিভাগ',
  fromProfile: 'আপনার প্রোফাইল থেকে',
  islamicOnly: 'শুধু ইসলামিক',
  allBanks: 'সব ব্যাংক',
  viewDetails: 'বিস্তারিত দেখুন',
  inShortlist: 'তালিকায় আছে',
  addToShortlist: 'তালিকায় যোগ করুন',
};

export const DISCOVERY_COPY: Record<Language, DiscoveryCopy> = { en, bn };

export const getDiscoveryCopy = (lang: Language): DiscoveryCopy => DISCOVERY_COPY[lang];
