import { Checkbox } from './Checkbox';

export default {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export const Default = {
  args: { label: 'Islamic cards only' },
};

export const Checked = {
  args: { label: 'No annual fee', defaultChecked: true },
};

export const Disabled = {
  args: { label: 'Salary account required', disabled: true },
};
