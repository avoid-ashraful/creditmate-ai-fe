import React, { useState } from 'react';

import { MoneyInput } from './MoneyInput';

export default {
  title: 'UI/MoneyInput',
  component: MoneyInput,
  tags: ['autodocs'],
};

const Demo = ({ initial, ...rest }: { initial: number | null } & Record<string, unknown>) => {
  const [value, setValue] = useState<number | null>(initial);
  return <MoneyInput value={value} onValueChange={setValue} {...rest} />;
};

export const Default = () => <Demo initial={null} label="Loan amount" placeholder="5,00,000" />;

export const Prefilled = () => (
  <Demo initial={500000} label="Property price" hint="Formats with lakh grouping on blur." />
);

export const WithError = () => (
  <Demo initial={null} label="Down payment" error="Enter an amount to continue." />
);
