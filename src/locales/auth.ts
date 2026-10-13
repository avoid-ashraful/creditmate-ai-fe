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

  accountTitle: string;
  accountEmailLabel: string;
  accountLoginPrompt: string;
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

    accountTitle: 'Your account',
    accountEmailLabel: 'Signed in as',
    accountLoginPrompt: 'Log in to view your account.',
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

    accountTitle: 'আপনার অ্যাকাউন্ট',
    accountEmailLabel: 'বর্তমানে লগ ইন আছেন',
    accountLoginPrompt: 'আপনার অ্যাকাউন্ট দেখতে লগ ইন করুন।',
  },
};

/** Copy for the given language. */
export function getAuthCopy(lang: Language): AuthCopy {
  return AUTH_COPY[lang];
}
