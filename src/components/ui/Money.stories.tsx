import React from 'react';

import Money from './Money';

export default {
  title: 'UI/Money',
  component: Money,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    decimals: { control: 'radio', options: [0, 2] },
  },
};

export const Default = { args: { value: 500000 } };
export const WithDecimals = { args: { value: 1234567.5, decimals: 2 } };
export const Negative = { args: { value: -1200 } };

export const Unavailable = () => (
  <p>
    Annual fee: <Money value={null} />
  </p>
);

export const InContext = () => (
  <p>
    Deposit <Money value={100000} /> for a year and receive <Money value={112500} /> at maturity — a
    profit of <Money value={12500} />.
  </p>
);
