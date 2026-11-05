import React from 'react';

import StatusChip from './StatusChip';

export default {
  title: 'UI/StatusChip',
  component: StatusChip,
  tags: ['autodocs'],
};

/**
 * The one status-chip grammar (Phase 4): every product state maps to a
 * tone here — eligibility verdicts, review states, change markers.
 */
export const Grammar = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <StatusChip tone="positive">Eligible</StatusChip>
      <StatusChip tone="info">Likely</StatusChip>
      <StatusChip tone="negative">Not yet</StatusChip>
      <StatusChip tone="neutral">No published requirement</StatusChip>
      <StatusChip tone="caution">Pending review</StatusChip>
      <StatusChip tone="accent">Community reviewed</StatusChip>
      <StatusChip tone="accent">New</StatusChip>
      <StatusChip tone="neutral" icon="↑">
        Increased
      </StatusChip>
      <StatusChip tone="neutral">Islamic</StatusChip>
    </div>
  ),
};
