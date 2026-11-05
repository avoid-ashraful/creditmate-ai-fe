import React from 'react';

import './StatusChip.css';

export type StatusChipTone = 'neutral' | 'positive' | 'caution' | 'negative' | 'info' | 'accent';

/**
 * The one status-chip grammar (Phase 4 consolidation, addendum B4).
 *
 * Every state in the product is drawn from this component: same shape,
 * same icon + label pairing, same semantic-token mapping. Colour never
 * carries meaning alone — each tone ships a glyph and the label is
 * always visible text.
 *
 * Inventory (state -> tone):
 * - Eligibility: Eligible -> positive, Likely -> info, Not yet ->
 *   negative, No published requirement -> neutral.
 * - Reviews: Approved -> positive, Pending -> caution, Rejected ->
 *   negative, Community reviewed -> accent.
 * - Changes: New (unseen) -> accent; a change delta itself -> neutral
 *   with an arrow glyph (a rise is not good or bad news by itself).
 * - Islamic -> neutral with the product label; Sanchayapatra benchmark
 *   -> neutral; Derived -> neutral (UnknownValue's badge speaks the
 *   same grammar); Follow state -> the button's pressed state, not a
 *   chip.
 * - Provenance (source + date) is TrustChip's job and stays separate:
 *   it answers "where from", StatusChip answers "what state".
 *
 * New states must be added here first, then used — never styled ad hoc
 * on a page.
 */
const TONE_ICONS: Record<StatusChipTone, string> = {
  neutral: '●',
  positive: '✓',
  caution: '!',
  negative: '✕',
  info: 'i',
  accent: '◆',
};

export interface StatusChipProps {
  tone?: StatusChipTone;
  /** Overrides the tone's default glyph (e.g. an arrow for a delta). */
  icon?: string;
  className?: string;
  children: React.ReactNode;
}

const StatusChip: React.FC<StatusChipProps> = ({ tone = 'neutral', icon, className, children }) => {
  const classes = ['cm-status-chip', `cm-status-chip--${tone}`, className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes}>
      <span className="cm-status-chip-icon" aria-hidden="true">
        {icon ?? TONE_ICONS[tone]}
      </span>
      {children}
    </span>
  );
};

export default StatusChip;
