/**
 * UI copy for email alerts and notifications.
 * Bengali strings are drafted and need review by a native speaker before release.
 */

import type { Language } from './types';

export interface AlertsCopy {
  sessionLoading: string;
  // Page titles and headings
  alertsPageTitle: string;
  alertsPageDescription: string;
  subscriptionsHeading: string;
  preferencesHeading: string;
  noSubscriptions: string;
  noSubscriptionsDescription: string;

  // Subscription card
  subscriptionCardTitle: string;
  subscriptionKindLabel: string;
  subscriptionCardLabel: string;
  subscriptionCreatedLabel: string;
  deleteSubscriptionButton: string;
  deleteConfirmation: string;
  deleting: string;

  // Watch this card toggle
  watchThisCard: string;
  watchingThisCard: string;
  watchPromptLogin: string;
  watchPromptRegister: string;
  watchButton: string;
  unwatchButton: string;

  // Preferences
  frequencyLabel: string;
  frequencyImmediate: string;
  frequencyDaily: string;
  frequencyWeekly: string;
  emailEnabledLabel: string;
  emailEnabledDescription: string;
  savePreferencesButton: string;
  saving: string;
  preferencesSaved: string;

  // Unsubscribe page
  unsubscribeTitle: string;
  unsubscribeDescription: string;
  unsubscribeButton: string;
  unsubscribing: string;
  unsubscribeSuccess: string;
  unsubscribeError: string;
  unsubscribeInvalidToken: string;
  backToSettings: string;

  // Toast messages
  subscriptionCreated: string;
  subscriptionDeleted: string;
  subscriptionCreateError: string;
  subscriptionDeleteError: string;
  preferencesUpdated: string;
  preferencesUpdateError: string;
}

export const ALERTS_COPY: Record<Language, AlertsCopy> = {
  en: {
    sessionLoading: 'Loading your session…',
    alertsPageTitle: 'Alert Settings',
    alertsPageDescription: 'Manage your email notifications for credit card changes.',
    subscriptionsHeading: 'Your Subscriptions',
    preferencesHeading: 'Notification Preferences',
    noSubscriptions: 'No subscriptions yet',
    noSubscriptionsDescription:
      'Visit a card detail page and click "Watch this card" to get notified about changes.',

    subscriptionCardTitle: 'Subscription',
    subscriptionKindLabel: 'Alert type',
    subscriptionCardLabel: 'Card',
    subscriptionCreatedLabel: 'Created',
    deleteSubscriptionButton: 'Remove',
    deleteConfirmation: 'Are you sure you want to remove this subscription?',
    deleting: 'Removing…',

    watchThisCard: 'Watch this card',
    watchingThisCard: 'Watching this card',
    watchPromptLogin: 'Log in to watch this card and get email alerts.',
    watchPromptRegister: 'Create an account to watch this card and get email alerts.',
    watchButton: 'Watch',
    unwatchButton: 'Unwatch',

    frequencyLabel: 'Delivery frequency',
    frequencyImmediate: 'Immediate',
    frequencyDaily: 'Daily digest',
    frequencyWeekly: 'Weekly digest',
    emailEnabledLabel: 'Email notifications',
    emailEnabledDescription: 'Receive email notifications for your subscribed alerts.',
    savePreferencesButton: 'Save preferences',
    saving: 'Saving…',
    preferencesSaved: 'Preferences saved',

    unsubscribeTitle: 'Unsubscribe from alerts',
    unsubscribeDescription:
      'Click below to stop receiving all alert emails. You can re-subscribe anytime from your account settings.',
    unsubscribeButton: 'Unsubscribe me',
    unsubscribing: 'Unsubscribing…',
    unsubscribeSuccess: 'You have been unsubscribed from all alert emails.',
    unsubscribeError: 'Something went wrong. Please try again.',
    unsubscribeInvalidToken: 'This unsubscribe link is invalid or has expired.',
    backToSettings: 'Back to alert settings',

    subscriptionCreated: 'Subscription created',
    subscriptionDeleted: 'Subscription removed',
    subscriptionCreateError: 'Failed to create subscription',
    subscriptionDeleteError: 'Failed to remove subscription',
    preferencesUpdated: 'Preferences updated',
    preferencesUpdateError: 'Failed to update preferences',
  },
  bn: {
    sessionLoading: 'আপনার সেশন লোড হচ্ছে…',
    alertsPageTitle: 'আলার্ট সেটিংস',
    alertsPageDescription: 'ক্রেডিট কার্ড পরিবর্তন সম্পর্কে আপনার ইমেল বিজ্ঞপ্তি পরিচালনা করুন।',
    subscriptionsHeading: 'আপনার সাবস্ক্রিপশন',
    preferencesHeading: 'বিজ্ঞপ্তি পছন্দ',
    noSubscriptions: 'এখনো কোনো সাবস্ক্রিপশন নেই',
    noSubscriptionsDescription:
      'একটি কার্ডের বিস্তারিত পৃষ্ঠায় যান এবং "এই কার্ডটি নজরে রাখুন" ক্লিক করে পরিবর্তন সম্পর্কে বিজ্ঞপ্তি পান।',

    subscriptionCardTitle: 'সাবস্ক্রিপশন',
    subscriptionKindLabel: 'আলার্ট ধরন',
    subscriptionCardLabel: 'কার্ড',
    subscriptionCreatedLabel: 'তৈরি করা হয়েছে',
    deleteSubscriptionButton: 'মুছে দিন',
    deleteConfirmation: 'আপনি কি নিশ্চিতভাবে এই সাবস্ক্রিপশনটি সরাতে চান?',
    deleting: 'মুছে ফেলা হচ্ছে…',

    watchThisCard: 'এই কার্ডটি নজরে রাখুন',
    watchingThisCard: 'এই কার্ডটি নজরে রাখা হচ্ছে',
    watchPromptLogin: 'এই কার্ডটি নজরে রাখতে এবং ইমেল সতর্কতা পেতে লগ ইন করুন।',
    watchPromptRegister: 'এই কার্ডটি নজরে রাখতে এবং ইমেল সতর্কতা পেতে একটি অ্যাকাউন্ট তৈরি করুন।',
    watchButton: 'নজরে রাখুন',
    unwatchButton: 'নজরদারি বন্ধ করুন',

    frequencyLabel: 'ডেলিভারি ফ্রিকোয়েন্সি',
    frequencyImmediate: 'তাৎক্ষণিক',
    frequencyDaily: 'দৈনিক সারসংক্ষেপ',
    frequencyWeekly: 'সাপ্তাহিক সারসংক্ষেপ',
    emailEnabledLabel: 'ইমেল বিজ্ঞপ্তি',
    emailEnabledDescription: 'আপনার সাবস্ক্রাইব করা সতর্কতাগুলোর জন্য ইমেল বিজ্ঞপ্তি পান।',
    savePreferencesButton: 'পছন্দ সংরক্ষণ করুন',
    saving: 'সংরক্ষণ করা হচ্ছে…',
    preferencesSaved: 'পছন্দ সংরক্ষিত হয়েছে',

    unsubscribeTitle: 'আলার্ট থেকে আনসাবস্ক্রাইব করুন',
    unsubscribeDescription:
      'সব আলার্ট ইমেল পেতে বন্ধ করতে নিচের বাটনে ক্লিক করুন। আপনি আপনার অ্যাকাউন্ট সেটিংস থেকে যে কোনো সময় পুনরায় সাবস্ক্রাইব করতে পারবেন।',
    unsubscribeButton: 'আমাকে আনসাবস্ক্রাইব করুন',
    unsubscribing: 'আনসাবস্ক্রাইব করা হচ্ছে…',
    unsubscribeSuccess: 'আপনি সব আলার্ট ইমেল থেকে আনসাবস্ক্রাইব হয়ে গেছেন।',
    unsubscribeError: 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    unsubscribeInvalidToken: 'এই আনসাবস্ক্রাইব লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ।',
    backToSettings: 'আলার্ট সেটিংসে ফিরে যান',

    subscriptionCreated: 'সাবস্ক্রিপশন তৈরি হয়েছে',
    subscriptionDeleted: 'সাবস্ক্রিপশন সরানো হয়েছে',
    subscriptionCreateError: 'সাবস্ক্রিপশন তৈরি করতে ব্যর্থ',
    subscriptionDeleteError: 'সাবস্ক্রিপশন সরাতে ব্যর্থ',
    preferencesUpdated: 'পছন্দ আপডেট করা হয়েছে',
    preferencesUpdateError: 'পছন্দ আপডেট করতে ব্যর্থ',
  },
};

/** Copy for the given language. */
export function getAlertsCopy(lang: Language): AlertsCopy {
  return ALERTS_COPY[lang];
}
