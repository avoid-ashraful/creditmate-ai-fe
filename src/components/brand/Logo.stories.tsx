import React from 'react';

import { Logo, LogoMark } from './Logo';

export default {
  title: 'Brand/Logo',
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
  },
};

/*
 * Midnight Ledger brand page (added in P6 close-out; plan V2 §1, §2.3, §5).
 *
 * The mark: an open "C" arc with a single gold dot at the opening — the
 * mate point. Geometry is locked (viewBox 0 0 64 64, arc radius 15.5,
 * stroke 6.5, dot r 4.6 at (46.5, 32)). Never redraw it in a font, close
 * the gap, move the dot onto the ring, set the arc in gold, or place the
 * mark on a photograph or a gradient.
 *
 * THE GOLD RULE (plan V2 §2.3): brand gold #C9A227 is 2.17:1 on the paper
 * ground — it is never text, a link, a meaning-carrying icon, or a focus
 * indicator on light grounds. Gold-coloured text on light uses goldDeep
 * #7A5E10; on navy/dark, goldBright #E3B93E is text-grade. Links are
 * primary navy. Gold's structural jobs: the logo dot, the shortlist
 * mate-point, the compare differences tick, citation numerals on navy.
 */

const onDarkSurface: React.CSSProperties = {
  background: 'var(--color-navy-900)',
  padding: '1.5rem',
  borderRadius: '8px',
};

const onPaperSurface: React.CSSProperties = {
  background: 'var(--color-background-base)',
  padding: '1.5rem',
  borderRadius: '8px',
};

/* Lockup on the light paper ground (default `auto` variant) */
export const LockupOnLight = () => (
  <div style={onPaperSurface}>
    <Logo size={40} />
  </div>
);

/* Reversed lockup on ink navy — the rail/auth treatment */
export const LockupOnDark = () => (
  <div style={onDarkSurface}>
    <Logo variant="onDark" size={40} />
  </div>
);

/* Mark only — app icon / collapsed rail form */
export const MarkOnly = () => (
  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
    <span style={onPaperSurface}>
      <LogoMark variant="onLight" size={48} />
    </span>
    <span style={onDarkSurface}>
      <LogoMark variant="onDark" size={48} />
    </span>
  </div>
);

/* Mono — the only variant where the dot is not gold (single-colour print) */
export const Mono = () => (
  <div style={{ ...onPaperSurface, color: 'var(--color-navy-900)' }}>
    <Logo variant="mono" size={40} />
  </div>
);

/* Size ladder — 16px is the floor for the mark alone */
export const Sizes = () => (
  <div style={{ ...onPaperSurface, display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
    <LogoMark variant="onLight" size={16} />
    <LogoMark variant="onLight" size={24} />
    <LogoMark variant="onLight" size={32} />
    <LogoMark variant="onLight" size={48} />
    <LogoMark variant="onLight" size={64} />
  </div>
);

/* Palette anchors — the four locked brand values everything derives from */
export const PaletteAnchors = () => (
  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
    {[
      ['Ink navy', '#0F1B33'],
      ['Primary navy', '#1D3260'],
      ['Brand gold', '#C9A227'],
      ['Paper', '#F5F2EC'],
    ].map(([name, hex]) => (
      <div key={hex} style={{ width: '140px' }}>
        <div
          style={{
            height: '64px',
            borderRadius: '8px',
            background: hex,
            border: '1px solid var(--color-border-subtle)',
          }}
        />
        <p style={{ margin: '0.5rem 0 0', fontWeight: 600 }}>{name}</p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{hex}</p>
      </div>
    ))}
  </div>
);

/* Type — Fraunces is whitelist-only; Inter/system sans is the UI face */
export const Type = () => (
  <div style={onPaperSurface}>
    <p
      style={{
        fontFamily: 'var(--typography-font-family-display)',
        fontSize: '2rem',
        margin: '0 0 0.5rem',
      }}
    >
      Fraunces — wordmark, H1s, hero numerals, Learn headlines. Nothing else.
    </p>
    <p style={{ margin: 0 }}>
      UI text, tables, labels and money figures stay on the sans stack with tabular numerals.
      Bengali display text is set in Hind Siliguri — Fraunces has no Bengali glyphs.
    </p>
  </div>
);
