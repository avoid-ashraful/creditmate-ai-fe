/**
 * UI copy for community reviews: summary, list, form, votes, and login prompts.
 * Bengali strings are drafted and need review by a native speaker before release,
 * like the glossary (see LOCALIZATION_GUIDE.md).
 */

import type { Language } from './types';

export interface ReviewsCopy {
  // Section heading
  sectionTitle: string;
  loadingReviews: string;
  edit: string;
  delete: string;
  deleteConfirmation: string;
  customerReviews: string;
  reviewPagination: string;

  // Summary
  averageRating: string;
  basedOnReviews: string;
  noReviewsYet: string;
  beFirstToReview: string;

  // Distribution bars
  starLabel: string;

  // List
  writeReview: string;
  sortBy: string;
  sortNewest: string;
  sortOldest: string;
  sortMostHelpful: string;
  sortHighestRating: string;
  sortLowestRating: string;

  // Review item
  verifiedPurchase: string;
  pendingModeration: string;
  helpful: string;
  helpfulCount: string;
  postedOn: string;
  prosLabel: string;
  consLabel: string;

  // Form
  writeReviewTitle: string;
  editReviewTitle: string;
  yourRating: string;
  reviewTitle: string;
  reviewTitlePlaceholder: string;
  reviewBody: string;
  reviewBodyPlaceholder: string;
  prosOptional: string;
  prosPlaceholder: string;
  consOptional: string;
  consPlaceholder: string;
  charCounter: string;
  charCounterError: string;
  minLengthError: string;
  maxLengthError: string;
  ratingRequired: string;
  titleRequired: string;
  bodyRequired: string;
  submitReview: string;
  updateReview: string;
  submitting: string;
  cancel: string;
  reviewSubmitted: string;
  reviewUpdated: string;
  reviewDeleted: string;
  pendingModerationNotice: string;

  // Helpful vote
  voteHelpful: string;
  votedHelpful: string;
  loginToVote: string;

  // Login prompt
  loginToReview: string;
  loginToReviewPrompt: string;
  loginLink: string;
  registerLink: string;

  // Errors
  networkError: string;
  genericError: string;
  unauthorizedError: string;
  emailNotVerified: string;
  notFoundError: string;
  validationError: string;

  // Pagination
  previousPage: string;
  nextPage: string;
  pageOf: string;
}

export const REVIEWS_COPY: Record<Language, ReviewsCopy> = {
  en: {
    sectionTitle: 'Customer Reviews',
    loadingReviews: 'Loading reviews...',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirmation: 'Are you sure you want to delete this review?',
    customerReviews: 'Customer reviews',
    reviewPagination: 'Review pagination',
    averageRating: 'Average Rating',
    basedOnReviews: 'based on {count} reviews',
    noReviewsYet: 'No reviews yet',
    beFirstToReview: 'Be the first to review this card',
    starLabel: '{rating} stars',
    writeReview: 'Write a Review',
    sortBy: 'Sort by',
    sortNewest: 'Newest first',
    sortOldest: 'Oldest first',
    sortMostHelpful: 'Most helpful',
    sortHighestRating: 'Highest rating',
    sortLowestRating: 'Lowest rating',
    verifiedPurchase: 'Verified cardholder',
    pendingModeration: 'Pending moderation',
    helpful: 'Helpful',
    helpfulCount: '{count} helpful',
    postedOn: 'Posted on {date}',
    prosLabel: 'Pros',
    consLabel: 'Cons',
    writeReviewTitle: 'Write your review',
    editReviewTitle: 'Edit your review',
    yourRating: 'Your rating',
    reviewTitle: 'Review title',
    reviewTitlePlaceholder: 'Summarize your experience in a few words',
    reviewBody: 'Your review',
    reviewBodyPlaceholder: 'Share your detailed experience with this card...',
    prosOptional: 'Pros (optional)',
    prosPlaceholder: 'What did you like?',
    consOptional: 'Cons (optional)',
    consPlaceholder: 'What could be better?',
    charCounter: '{current}/{max} characters',
    charCounterError: 'Maximum {max} characters exceeded',
    minLengthError: 'Minimum {min} characters required',
    maxLengthError: 'Maximum {max} characters allowed',
    ratingRequired: 'Please select a rating',
    titleRequired: 'Please enter a review title',
    bodyRequired: 'Please write your review',
    submitReview: 'Submit review',
    updateReview: 'Update review',
    submitting: 'Submitting...',
    cancel: 'Cancel',
    reviewSubmitted: 'Your review has been submitted and is pending moderation.',
    reviewUpdated: 'Your review has been updated.',
    reviewDeleted: 'Your review has been deleted.',
    pendingModerationNotice:
      'Your review will be visible to others after it passes moderation. This usually takes 24-48 hours.',
    voteHelpful: 'Mark as helpful',
    votedHelpful: 'Marked helpful',
    loginToVote: 'Log in to vote',
    loginToReview: 'Log in to write a review',
    loginToReviewPrompt: 'You need to be logged in to share your experience.',
    loginLink: 'Log in',
    registerLink: 'Create an account',
    networkError: 'We could not reach the server. Please try again.',
    genericError: 'Something went wrong. Please try again.',
    unauthorizedError: 'Please log in to perform this action.',
    emailNotVerified:
      'Verify your email address before posting a review. Check your inbox for the verification link, or request a new one.',
    notFoundError: 'Review not found.',
    validationError: 'Please check the highlighted fields.',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    pageOf: 'Page {current} of {total}',
  },
  bn: {
    sectionTitle: 'গ্রাহক রিভিউ',
    loadingReviews: 'রিভিউ লোড হচ্ছে...',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    deleteConfirmation: 'আপনি কি এই রিভিউটি মুছে ফেলতে চান?',
    customerReviews: 'গ্রাহক রিভিউ',
    reviewPagination: 'রিভিউ পৃষ্ঠা নেভিগেশন',
    averageRating: 'গড় রেটিং',
    basedOnReviews: '{count}টি রিভিউর ওপর ভিত্তি করে',
    noReviewsYet: 'এখনো কোনো রিভিউ নেই',
    beFirstToReview: 'এই কার্ডটির প্রথম রিভিউ লিখুন',
    starLabel: '{rating} স্টার',
    writeReview: 'রিভিউ লিখুন',
    sortBy: 'সাজান',
    sortNewest: 'সর্বনবীন প্রথমে',
    sortOldest: 'সর্বপুরনো প্রথমে',
    sortMostHelpful: 'সর্বাধিক সহায়ক',
    sortHighestRating: 'সর্বোচ্চ রেটিং',
    sortLowestRating: 'সর্বনিম্ন রেটিং',
    verifiedPurchase: 'যাচাইকৃত কার্ডহোল্ডার',
    pendingModeration: 'মডারেশনের অপেক্ষায়',
    helpful: 'সহায়ক',
    helpfulCount: '{count} জন কার্যকর',
    postedOn: '{date}-এ পোস্ট করা হয়েছে',
    prosLabel: 'সুবিধা',
    consLabel: 'অসুবিধা',
    writeReviewTitle: 'আপনার রিভিউ লিখুন',
    editReviewTitle: 'আপনার রিভিউ সম্পাদনা করুন',
    yourRating: 'আপনার রেটিং',
    reviewTitle: 'রিভিউ শিরোনাম',
    reviewTitlePlaceholder: 'কিছু শব্দে আপনার অভিজ্ঞতা সংক্ষেপে লিখুন',
    reviewBody: 'আপনার রিভিউ',
    reviewBodyPlaceholder: 'এই কার্ডটির সাথে আপনার বিস্তারিত অভিজ্ঞতা শেয়ার করুন...',
    prosOptional: 'সুবিধা (ঐচ্ছিক)',
    prosPlaceholder: 'আপনার কী ভালো লেগেছে?',
    consOptional: 'অসুবিধা (ঐচ্ছিক)',
    consPlaceholder: 'কী উন্নত করা যেতে পারে?',
    charCounter: '{current}/{max} অক্ষর',
    charCounterError: 'সর্বাধিক {max} অক্ষরের বাইরে',
    minLengthError: 'ন্যূনতম {min} অক্ষর আবশ্যক',
    maxLengthError: 'সর্বোচ্চ {max} অক্ষর অনুমোদিত',
    ratingRequired: 'দয়া করে একটি রেটিং নির্বাচন করুন',
    titleRequired: 'দয়া করে রিভিউর শিরোনাম লিখুন',
    bodyRequired: 'দয়া করে আপনার রিভিউ লিখুন',
    submitReview: 'রিভিউ জমা দিন',
    updateReview: 'রিভিউ আপডেট করুন',
    submitting: 'জমা দেওয়া হচ্ছে...',
    cancel: 'বাতিল',
    reviewSubmitted: 'আপনার রিভিউ জমা দেওয়া হয়েছে এবং মডারেশনের অধীনে রয়েছে।',
    reviewUpdated: 'আপনার রিভিউ আপডেট করা হয়েছে।',
    reviewDeleted: 'আপনার রিভিউ মুছে ফেলা হয়েছে।',
    pendingModerationNotice:
      'আপনার রিভিউ মডারেশন পাস করার পর অন্যদের কাছে দৃশ্যমান হবে। এতে সাধারণত ২৪-৪৮ ঘন্টা লাগে।',
    voteHelpful: 'সহায়ক হিসেবে চিহ্নিত করুন',
    votedHelpful: 'সহায়ক হিসেবে চিহ্নিত',
    loginToVote: 'ভোট দেওয়ার জন্য লগ ইন করুন',
    loginToReview: 'রিভিউ লিখতে লগ ইন করুন',
    loginToReviewPrompt: 'আপনার অভিজ্ঞতা শেয়ার করতে লগ ইন করতে হবে।',
    loginLink: 'লগ ইন',
    registerLink: 'অ্যাকাউন্ট তৈরি করুন',
    networkError: 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।',
    genericError: 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    unauthorizedError: 'এই কাজ করার জন্য দয়া করে লগ ইন করুন।',
    emailNotVerified:
      'রিভিউ দেওয়ার আগে আপনার ইমেইল যাচাই করুন। যাচাই লিংকের জন্য ইনবক্স দেখুন, অথবা নতুন লিংকের অনুরোধ করুন।',
    notFoundError: 'রিভিউ পাওয়া যায়নি।',
    validationError: 'অনুগ্রহ করে হাইলাইট করা ঘরগুলো যাচাই করুন।',
    previousPage: 'পূর্বের পৃষ্ঠা',
    nextPage: 'পরবর্তী পৃষ্ঠা',
    pageOf: '{current} নম্বর পৃষ্ঠা / মোট {total}',
  },
};

/** Copy for the given language. */
export function getReviewsCopy(lang: Language): ReviewsCopy {
  return REVIEWS_COPY[lang];
}
