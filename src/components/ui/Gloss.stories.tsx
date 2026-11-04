import React from 'react';

import Gloss from './Gloss';

export default {
  title: 'UI/Gloss',
  component: Gloss,
  tags: ['autodocs'],
};

export const InSentence = () => (
  <p>
    Eligibility depends on your income, e-TIN and a{' '}
    <Gloss
      term="CIB"
      definition="Credit Information Bureau — Bangladesh Bank's record of your existing loans and repayment history"
    />{' '}
    check. Islamic cards charge no{' '}
    <Gloss
      term="APR"
      definition="Annual Percentage Rate — the yearly interest cost of carrying a balance"
    />
    .
  </p>
);

export const SingleTerm = {
  args: {
    term: 'DPS',
    definition: 'Deposit Pension Scheme — a monthly savings plan with a fixed tenure',
  },
};
