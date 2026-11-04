import React from 'react';

import TrustChip from './TrustChip';

export default {
  title: 'UI/TrustChip',
  component: TrustChip,
  tags: ['autodocs'],
};

export const BBChart = { args: { source: 'BB chart', dateLabel: 'Oct 2026 edition' } };

export const Verified = {
  args: { source: 'Bank schedule of charges', dateLabel: 'verified 3 Nov' },
};

export const Derived = {
  args: { source: 'Bank maturity table', dateLabel: 'verified 28 Oct', marker: 'derived' },
};

export const Changed = {
  args: { source: 'BB chart', dateLabel: 'Nov 2026 edition', marker: 'changed' },
};

export const Clickable = () => (
  <TrustChip
    source="BB chart"
    dateLabel="Oct 2026 edition"
    onClick={() => {
      // Opens the provenance detail in the real UI.
    }}
  />
);
