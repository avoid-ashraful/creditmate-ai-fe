/**
 * UI copy for authentication: header menu, login, register, password reset,
 * email verification and the account page. Bengali strings are drafted and need
 * review by a native speaker before release, like the glossary (see
 * LOCALIZATION_GUIDE.md).
 */

import type { Language } from './types';

export interface AuthCopy {
  headerLogin: string;
  headerRegister: string;
  headerAccountLabel: string;
  headerAccountLink: string;
  headerLogout: string;
  sessionLoading: string;

  emailLabel: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  newPasswordLabel: string;
  fieldRequired: string;
  passwordsMismatch: string;
  checkFields: string;
  networkError: string;
  genericError: string;
  submitting: string;

  loginTitle: string;
  loginSubmit: string;
  loginInvalidCredentials: string;
  loginForgotLink: string;
  loginNoAccount: string;
  loginCreateLink: string;

  registerTitle: string;
  registerSubmit: string;
  registerTermsBefore: string;
  registerTermsLink: string;
  registerTermsAnd: string;
  registerPrivacyLink: string;
  registerTermsAfter: string;
  registerTermsRequired: string;
  registerMarketingLabel: string;
  registerHaveAccount: string;
  registerLoginLink: string;

  forgotTitle: string;
  forgotHint: string;
  forgotSubmit: string;
  forgotSent: string;
  forgotBackToLogin: string;

  resetTitle: string;
  resetSubmit: string;
  resetSuccess: string;
  resetInvalidLink: string;
  resetRequestNewLink: string;

  verifyTitle: string;
  verifySuccess: string;
  verifyInvalidLink: string;
  verifyLoading: string;
  resendButton: string;
  resendSent: string;
  resendRateLimited: string;

  accountTitle: string;
  accountEmailLabel: string;
  accountLoginPrompt: string;
  accountUnverified: string;
  accountMarketingLabel: string;
  accountMarketingSaved: string;
  accountExportHeading: string;
  accountExportHint: string;
  accountExportButton: string;
  accountDeleteHeading: string;
  accountDeleteWarning: string;
  accountDeleteConfirmLabel: string;
  accountDeleteConfirmRequired: string;
  accountDeleteSubmit: string;
  accountDeleteWrongPassword: string;
  accountDeleted: string;
}

export const AUTH_COPY: Record<Language, AuthCopy> = {
  en: {
    headerLogin: 'Log in',
    headerRegister: 'Register',
    headerAccountLabel: 'Account menu',
    headerAccountLink: 'My account',
    headerLogout: 'Log out',
    sessionLoading: 'Checking your session…',

    emailLabel: 'Email',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm password',
    newPasswordLabel: 'New password',
    fieldRequired: 'This field is required.',
    passwordsMismatch: 'The passwords do not match.',
    checkFields: 'Please check the highlighted fields.',
    networkError: 'We could not reach the server. Please try again.',
    genericError: 'Something went wrong. Please try again.',
    submitting: 'Submitting…',

    loginTitle: 'Log in',
    loginSubmit: 'Log in',
    loginInvalidCredentials: 'The email or password is incorrect.',
    loginForgotLink: 'Forgot your password?',
    loginNoAccount: "Don't have an account?",
    loginCreateLink: 'Create an account',

    registerTitle: 'Create an account',
    registerSubmit: 'Create account',
    registerTermsBefore: 'I agree to the ',
    registerTermsLink: 'Terms of Service',
    registerTermsAnd: ' and ',
    registerPrivacyLink: 'Privacy Policy',
    registerTermsAfter: '.',
    registerTermsRequired: 'You must agree to the Terms of Service and Privacy Policy to register.',
    registerMarketingLabel: 'Email me product news',
    registerHaveAccount: 'Already have an account?',
    registerLoginLink: 'Log in',

    forgotTitle: 'Reset your password',
    forgotHint: 'Enter the email you registered with and we will send reset instructions.',
    forgotSubmit: 'Send reset link',
    forgotSent:
      'If an account exists for that email, we have sent password reset instructions. Check your inbox.',
    forgotBackToLogin: 'Back to log in',

    resetTitle: 'Choose a new password',
    resetSubmit: 'Set new password',
    resetSuccess: 'Your password has been changed. You can now log in.',
    resetInvalidLink: 'This reset link is invalid or incomplete.',
    resetRequestNewLink: 'Request a new reset link',

    verifyTitle: 'Verify your email',
    verifySuccess: 'Email verified successfully. You can now log in.',
    verifyInvalidLink: 'This verification link is invalid or has expired.',
    verifyLoading: 'Verifying your email…',
    resendButton: 'Resend verification email',
    resendSent:
      'If an unverified account exists for that email, we have sent a new verification link.',
    resendRateLimited: 'Too many requests. Please wait a few minutes and try again.',

    accountTitle: 'Your account',
    accountEmailLabel: 'Signed in as',
    accountLoginPrompt: 'Log in to view your account.',
    accountUnverified: 'Your email address is not verified yet. You need it to post reviews.',
    accountMarketingLabel: 'Marketing emails',
    accountMarketingSaved: 'Email preference saved.',
    accountExportHeading: 'Your data',
    accountExportHint: 'Download a copy of the personal data we hold about you.',
    accountExportButton: 'Download my data',
    accountDeleteHeading: 'Delete account',
    accountDeleteWarning:
      'This permanently deletes your account, reviews, saved comparisons, collections and alerts. It cannot be undone.',
    accountDeleteConfirmLabel: 'I understand that my account and data will be deleted permanently.',
    accountDeleteConfirmRequired: 'Confirm that you understand before deleting your account.',
    accountDeleteSubmit: 'Delete my account',
    accountDeleteWrongPassword: 'The password is incorrect. Your account was not deleted.',
    accountDeleted: 'Your account and personal data have been deleted.',
  },
  bn: {
    headerLogin: 'লগ ইন',
    headerRegister: 'নিবন্ধন',
    headerAccountLabel: 'অ্যাকাউন্ট মেনু',
    headerAccountLink: 'আমার অ্যাকাউন্ট',
    headerLogout: 'লগ আউট',
    sessionLoading: 'আপনার সেশন যাচাই করা হচ্ছে…',

    emailLabel: 'ইমেইল',
    passwordLabel: 'পাসওয়ার্ড',
    confirmPasswordLabel: 'পাসওয়ার্ড নিশ্চিত করুন',
    newPasswordLabel: 'নতুন পাসওয়ার্ড',
    fieldRequired: 'এই ঘরটি পূরণ করা আবশ্যক।',
    passwordsMismatch: 'পাসওয়ার্ড দুটি মেলেনি।',
    checkFields: 'অনুগ্রহ করে হাইলাইট করা ঘরগুলো যাচাই করুন।',
    networkError: 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।',
    genericError: 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    submitting: 'জমা দেওয়া হচ্ছে…',

    loginTitle: 'লগ ইন',
    loginSubmit: 'লগ ইন করুন',
    loginInvalidCredentials: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
    loginForgotLink: 'পাসওয়ার্ড ভুলে গেছেন?',
    loginNoAccount: 'অ্যাকাউন্ট নেই?',
    loginCreateLink: 'অ্যাকাউন্ট তৈরি করুন',

    registerTitle: 'অ্যাকাউন্ট তৈরি করুন',
    registerSubmit: 'অ্যাকাউন্ট তৈরি করুন',
    registerTermsBefore: 'আমি ',
    registerTermsLink: 'সেবার শর্তাবলি',
    registerTermsAnd: ' ও ',
    registerPrivacyLink: 'গোপনীয়তা নীতি',
    registerTermsAfter: 'তে সম্মত।',
    registerTermsRequired: 'নিবন্ধন করতে সেবার শর্তাবলি ও গোপনীয়তা নীতিতে সম্মত হতে হবে।',
    registerMarketingLabel: 'আমাকে পণ্যের খবর ইমেইলে পাঠান',
    registerHaveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    registerLoginLink: 'লগ ইন করুন',

    forgotTitle: 'পাসওয়ার্ড রিসেট করুন',
    forgotHint: 'নিবন্ধনের সময় ব্যবহৃত ইমেইল লিখুন, আমরা রিসেটের নির্দেশনা পাঠাব।',
    forgotSubmit: 'রিসেট লিংক পাঠান',
    forgotSent:
      'এই ইমেইলে অ্যাকাউন্ট থাকলে পাসওয়ার্ড রিসেটের নির্দেশনা পাঠানো হয়েছে। আপনার ইনবক্স দেখুন।',
    forgotBackToLogin: 'লগ ইনে ফিরে যান',

    resetTitle: 'নতুন পাসওয়ার্ড বেছে নিন',
    resetSubmit: 'নতুন পাসওয়ার্ড সেট করুন',
    resetSuccess: 'আপনার পাসওয়ার্ড পরিবর্তন হয়েছে। এখন লগ ইন করতে পারবেন।',
    resetInvalidLink: 'এই রিসেট লিংকটি অবৈধ বা অসম্পূর্ণ।',
    resetRequestNewLink: 'নতুন রিসেট লিংকের অনুরোধ করুন',

    verifyTitle: 'আপনার ইমেইল যাচাই করুন',
    verifySuccess: 'ইমেইল সফলভাবে যাচাই হয়েছে। এখন লগ ইন করতে পারবেন।',
    verifyInvalidLink: 'এই যাচাই লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ।',
    verifyLoading: 'আপনার ইমেইল যাচাই করা হচ্ছে…',
    resendButton: 'যাচাইয়ের ইমেইল আবার পাঠান',
    resendSent: 'ওই ইমেইলে যাচাই না হওয়া অ্যাকাউন্ট থাকলে নতুন যাচাই লিংক পাঠানো হয়েছে।',
    resendRateLimited: 'অনেকবার অনুরোধ করা হয়েছে। কয়েক মিনিট পর আবার চেষ্টা করুন।',

    accountTitle: 'আপনার অ্যাকাউন্ট',
    accountEmailLabel: 'বর্তমানে লগ ইন আছেন',
    accountLoginPrompt: 'আপনার অ্যাকাউন্ট দেখতে লগ ইন করুন।',
    accountUnverified: 'আপনার ইমেইল এখনও যাচাই হয়নি। রিভিউ দিতে এটি প্রয়োজন।',
    accountMarketingLabel: 'প্রচারমূলক ইমেইল',
    accountMarketingSaved: 'ইমেইল পছন্দ সংরক্ষিত হয়েছে।',
    accountExportHeading: 'আপনার তথ্য',
    accountExportHint: 'আপনার সম্পর্কে আমাদের কাছে থাকা ব্যক্তিগত তথ্যের একটি কপি ডাউনলোড করুন।',
    accountExportButton: 'আমার তথ্য ডাউনলোড করুন',
    accountDeleteHeading: 'অ্যাকাউন্ট মুছুন',
    accountDeleteWarning:
      'এতে আপনার অ্যাকাউন্ট, রিভিউ, সংরক্ষিত তুলনা, সংগ্রহ ও আলার্ট স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না।',
    accountDeleteConfirmLabel: 'আমি বুঝেছি যে আমার অ্যাকাউন্ট ও তথ্য স্থায়ীভাবে মুছে যাবে।',
    accountDeleteConfirmRequired: 'অ্যাকাউন্ট মোছার আগে নিশ্চিত করুন যে আপনি বিষয়টি বুঝেছেন।',
    accountDeleteSubmit: 'আমার অ্যাকাউন্ট মুছুন',
    accountDeleteWrongPassword: 'পাসওয়ার্ড সঠিক নয়। আপনার অ্যাকাউন্ট মোছা হয়নি।',
    accountDeleted: 'আপনার অ্যাকাউন্ট ও ব্যক্তিগত তথ্য মুছে ফেলা হয়েছে।',
  },
};

/** Copy for the given language. */
export function getAuthCopy(lang: Language): AuthCopy {
  return AUTH_COPY[lang];
}
