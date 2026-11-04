import React from 'react';

import DataTable from './DataTable';
import Money from './Money';

export default {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};

/* A bank fee schedule, the canonical DataTable use. */
export const FeeSchedule = () => (
  <DataTable
    caption="BRAC Bank schedule of charges (extract)"
    columns={[
      { key: 'item', header: 'Item' },
      { key: 'fee', header: 'Fee', numeric: true },
      { key: 'frequency', header: 'Frequency' },
    ]}
    rows={[
      {
        item: 'Account maintenance — savings',
        fee: <Money value={300} />,
        frequency: 'Half-yearly',
      },
      { item: 'Debit card issuance', fee: <Money value={575} />, frequency: 'One-off' },
      { item: 'SMS alert', fee: <Money value={200} />, frequency: 'Yearly' },
      { item: 'Cheque book (10 leaves)', fee: <Money value={100} />, frequency: 'Per book' },
    ]}
  />
);

export const PlainText = () => (
  <DataTable
    columns={[
      { key: 'tenure', header: 'Tenure' },
      { key: 'rate', header: 'Rate', numeric: true },
    ]}
    rows={[
      { tenure: '3 months', rate: '8.50%' },
      { tenure: '6 months', rate: '9.25%' },
      { tenure: '1 year', rate: '10.00%' },
    ]}
  />
);
