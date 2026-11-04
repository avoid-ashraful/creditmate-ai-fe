import { Badge } from './Badge';

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export const Neutral = { args: { children: 'Draft', variant: 'neutral' } };
export const Success = { args: { children: 'Verified', variant: 'success' } };
export const Warning = { args: { children: 'Fee changed', variant: 'warning' } };
export const Danger = { args: { children: 'Discontinued', variant: 'danger' } };
export const Info = { args: { children: 'Islamic', variant: 'info' } };
export const Primary = { args: { children: 'Best value-back', variant: 'primary' } };
export const WithDot = { args: { children: 'Live rates', variant: 'success', dot: true } };
