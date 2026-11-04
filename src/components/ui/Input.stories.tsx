import { Input } from './Input';

export default {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
};

export const Default = {
  args: { label: 'Full name', placeholder: 'e.g. Ashraful Islam' },
};

export const WithHint = {
  args: {
    label: 'Monthly income',
    hint: 'Use your gross monthly salary before tax.',
    placeholder: '50000',
  },
};

export const WithError = {
  args: {
    label: 'Email address',
    defaultValue: 'not-an-email',
    error: 'Enter a valid email address.',
  },
};

export const Disabled = {
  args: { label: 'National ID', defaultValue: '1234567890', disabled: true },
};
