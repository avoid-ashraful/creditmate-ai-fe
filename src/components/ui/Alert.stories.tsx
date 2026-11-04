import { Alert } from './Alert';

export default {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
};

export const Success = {
  args: {
    variant: 'success',
    title: 'Profile saved',
    children: 'Your shortlist now syncs across devices.',
  },
};

export const Warning = {
  args: {
    variant: 'warning',
    title: 'Rates may have changed',
    children: 'This fee schedule was last verified over 90 days ago.',
  },
};

export const Danger = {
  args: {
    variant: 'danger',
    title: 'Could not load cards',
    children: 'Check your connection and try again.',
  },
};

export const Info = {
  args: {
    variant: 'info',
    title: 'How the score works',
    children: 'CreditMate Score uses published card data only.',
  },
};

export const Dismissible = {
  args: {
    variant: 'info',
    title: 'New: bank pages',
    children: 'Every bank now has its own comparison page.',
    onClose: () => {},
  },
};
