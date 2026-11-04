import React from 'react';

import { formatTaka } from '../../lib/format';

import UnknownValue from './UnknownValue';

import './Money.css';

export interface MoneyProps {
  /** Taka amount. Null, undefined or NaN renders as "Unavailable". */
  value?: number | null;
  decimals?: 0 | 2;
  className?: string;
}

/** A taka amount in lakh grouping with tabular numerals. */
const Money: React.FC<MoneyProps> = ({ value, decimals = 0, className }) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <UnknownValue kind="unavailable" className={className} />;
  }
  const classes = ['cm-money', className].filter(Boolean).join(' ');
  return <span className={classes}>{formatTaka(value, { decimals })}</span>;
};

export default Money;
