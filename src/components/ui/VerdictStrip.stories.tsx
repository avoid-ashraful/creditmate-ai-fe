import React from 'react';

import Money from './Money';
import VerdictStrip from './VerdictStrip';

export default {
  title: 'UI/VerdictStrip',
  component: VerdictStrip,
  tags: ['autodocs'],
};

export const ComparisonSummary = () => (
  <VerdictStrip
    items={[
      { label: 'Lowest annual cost', value: <Money value={3450} /> },
      { label: 'Best value-back', value: '2.1%' },
      { label: 'Most lounge visits', value: '8 / year' },
    ]}
  />
);

export const SingleItem = { args: { items: [{ label: 'Cards compared', value: '3' }] } };
