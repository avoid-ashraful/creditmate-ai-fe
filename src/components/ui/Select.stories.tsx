import React from 'react';

import { Select } from './Select';

export default {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
};

const banks = (
  <>
    <option value="">Choose a bank</option>
    <option value="dbbl">Dutch-Bangla Bank</option>
    <option value="brac">BRAC Bank</option>
    <option value="ebl">Eastern Bank</option>
  </>
);

export const Default = {
  args: { label: 'Bank', children: banks },
};

export const WithHint = {
  args: { label: 'Bank', hint: 'Only banks with published rates are listed.', children: banks },
};

export const WithError = {
  args: { label: 'Bank', error: 'Select a bank to continue.', children: banks },
};

export const Disabled = {
  args: { label: 'Bank', disabled: true, children: banks },
};
