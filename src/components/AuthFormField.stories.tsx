import React from 'react';

import { AuthFormField } from './AuthFormField';

export default {
  title: 'Components/AuthFormField',
  component: AuthFormField,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    hint: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'tel', 'url'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};

/* State: default email field */
export const Default = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
  },
};

/* State: password field */
export const Password = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
  },
};

/* State: with error message */
export const WithError = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'invalid-email',
    error: 'Please enter a valid email address',
  },
};

/* State: with hint text */
export const WithHint = {
  args: {
    label: 'Password',
    type: 'password',
    hint: 'Must be at least 8 characters with one number and one symbol',
  },
};

/* State: error and hint combined */
export const ErrorAndHint = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'invalid',
    error: 'Please enter a valid email address',
    hint: 'We will never share your email with anyone',
  },
};

/* State: disabled field */
export const Disabled = {
  args: {
    label: 'Email',
    type: 'email',
    value: 'user@example.com',
    disabled: true,
  },
};

/* State: confirm password field */
export const ConfirmPassword = {
  args: {
    label: 'Confirm Password',
    type: 'password',
    placeholder: 'Re-enter your password',
  },
};

/* State: with custom className */
export const CustomClass = {
  args: {
    label: 'Email',
    type: 'email',
    className: 'custom-field-class',
  },
};

/* State: Bengali label */
export const Bengali = {
  args: {
    label: 'ইমেইল',
    type: 'email',
    placeholder: 'আপনি@example.com',
  },
};

/* State: Bengali with error */
export const BengaliWithError = {
  args: {
    label: 'পাসওয়ার্ড',
    type: 'password',
    value: 'short',
    error: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে',
  },
};

/* State: multiple fields in a form layout */
export const FormLayout = () => (
  <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
    <AuthFormField label="Email" type="email" placeholder="you@example.com" />
    <AuthFormField label="Password" type="password" placeholder="Enter password" />
    <AuthFormField label="Confirm Password" type="password" placeholder="Confirm password" />
    <button type="submit" style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}>
      Submit
    </button>
  </form>
);
