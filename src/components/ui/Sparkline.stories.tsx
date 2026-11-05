import Sparkline from './Sparkline';

export default {
  title: 'UI/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
};

const series = (values: number[]) =>
  values.map((value, index) => ({ at: `2026-0${index + 1}-01`, value }));

export const RateHistory = {
  args: {
    points: series([8.5, 8.75, 9.25, 9.25, 9.75]),
    label: 'Rate history (6–12 months): 8.5% to 9.75%',
  },
};

/** Fewer than three real points render nothing — no implied trend. */
export const TooFewPoints = {
  args: { points: series([9.5, 9.75]), label: 'Rate history' },
};
