import React from 'react';

import ScoreBadge from './ScoreBadge';
/* The badge's classes (.card-badge*) live in CardListItem.css — the tile
   is the badge's only consumer, so the stylesheet travels with it. The
   standalone story imports it explicitly, as the tile itself does. */
import './CardListItem.css';

export default {
  title: 'Components/ScoreBadge',
  component: ScoreBadge,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
  },
};

/* Midnight Ledger (plan V2, P2): the score chip is an ink-navy chip with
   a gold Fraunces numeral and a paper band word. All bands share the
   chip; the band word carries the distinction. */
export const Excellent = () => <ScoreBadge score={7.5} />;

export const Good = () => <ScoreBadge score={6.4} />;

export const Fair = () => <ScoreBadge score={5.2} />;

export const Basic = () => <ScoreBadge score={3.1} />;

export const AllBands = () => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    <ScoreBadge score={7.5} />
    <ScoreBadge score={6.4} />
    <ScoreBadge score={5.2} />
    <ScoreBadge score={3.1} />
  </div>
);

export const NoScore = () => <ScoreBadge score={null} />;
