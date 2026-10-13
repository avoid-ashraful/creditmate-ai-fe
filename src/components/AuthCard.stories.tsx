import React from 'react';

import { ThemeProvider } from '../hooks/ThemeProvider';

import { AuthCard, AuthAlert } from './AuthCard';

export default {
  title: 'Components/AuthCard',
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story: React.FC) => (
      <ThemeProvider>
        <div style={{ maxWidth: '400px' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

/* State: login card */
export const LoginCard = () => (
  <AuthCard title="Log in">
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Password
        <input type="password" placeholder="Enter password" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        Log in
      </button>
    </form>
    <p className="auth-links">
      Don&apos;t have an account? <a href="/register">Create an account</a>
    </p>
  </AuthCard>
);

/* State: register card */
export const RegisterCard = () => (
  <AuthCard title="Create an account">
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Password
        <input type="password" placeholder="Create password" />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Confirm Password
        <input type="password" placeholder="Confirm password" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        Create account
      </button>
    </form>
    <p className="auth-links">
      Already have an account? <a href="/login">Log in</a>
    </p>
  </AuthCard>
);

/* State: card with form-level error alert */
export const WithAlert = () => (
  <AuthCard title="Log in">
    <AuthAlert message="The email or password is incorrect." />
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Password
        <input type="password" placeholder="Enter password" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        Log in
      </button>
    </form>
  </AuthCard>
);

/* State: alert with no message (empty but rendered for focus management) */
export const EmptyAlert = () => (
  <AuthCard title="Log in">
    <AuthAlert message={null} />
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        Log in
      </button>
    </form>
  </AuthCard>
);

/* State: card with long content */
export const LongContent = () => (
  <AuthCard title="Reset your password">
    <p style={{ marginBottom: '1rem' }}>
      Enter the email you registered with and we will send reset instructions.
    </p>
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        Send reset link
      </button>
    </form>
    <p className="auth-links">
      <a href="/login">Back to log in</a>
    </p>
  </AuthCard>
);

/* State: Bengali content */
export const Bengali = () => (
  <AuthCard title="লগ ইন">
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        ইমেইল
        <input type="email" placeholder="আপনি@example.com" />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        পাসওয়ার্ড
        <input type="password" placeholder="পাসওয়ার্ড লিখুন" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        লগ ইন করুন
      </button>
    </form>
    <p className="auth-links">
      অ্যাকাউন্ট নেই? <a href="/register">অ্যাকাউন্ট তৈরি করুন</a>
    </p>
  </AuthCard>
);

/* State: dark mode */
export const DarkMode = () => (
  <AuthCard title="Log in (Dark Mode)">
    <form className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Email
        <input type="email" placeholder="you@example.com" />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        Password
        <input type="password" placeholder="Enter password" />
      </label>
      <button type="submit" className="primary-button auth-submit">
        Log in
      </button>
    </form>
  </AuthCard>
);

DarkMode.decorators = [
  (Story: React.FC) => (
    <ThemeProvider>
      <div data-theme="dark" style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    </ThemeProvider>
  ),
];
