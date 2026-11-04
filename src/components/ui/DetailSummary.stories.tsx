import React from 'react';

import DetailSummary from './DetailSummary';
import Money from './Money';
import TrustChip from './TrustChip';

export default {
  title: 'UI/DetailSummary',
  component: DetailSummary,
  tags: ['autodocs'],
};

export const CardDetail = () => (
  <div style={{ maxWidth: 360 }}>
    <DetailSummary
      identity={{ bankName: 'Dutch-Bangla Bank', productName: 'Nexus Platinum Card' }}
      heroValue={<Money value={3450} />}
      heroLabel="Estimated annual cost"
      facts={[
        { label: 'APR', value: '20%' },
        { label: 'Annual fee', value: <Money value={3000} /> },
        { label: 'Credit limit', value: 'Up to ৳5,00,000' },
        { label: 'CreditMate Score', value: '7.1 / 10' },
      ]}
      trustChip={<TrustChip source="Bank schedule of charges" dateLabel="verified 3 Nov" />}
      actions={<button type="button">Add to shortlist</button>}
    />
  </div>
);

export const DepositDetail = () => (
  <div style={{ maxWidth: 360 }}>
    <DetailSummary
      identity={{ bankName: 'BRAC Bank', productName: '1-year Fixed Deposit' }}
      heroValue="12.50%"
      heroLabel="Rate for 1 year (BB chart)"
      facts={[
        { label: 'Minimum deposit', value: <Money value={10000} /> },
        { label: 'Tax at source', value: '10% with TIN' },
      ]}
      trustChip={<TrustChip source="BB chart" dateLabel="Oct 2026 edition" />}
    />
  </div>
);
