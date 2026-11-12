import React from 'react';

import './Logo.css';

/**
 * CreditMate "Midnight Ledger" brand mark: an open "C" arc with a single
 * gold dot at the opening — the mate who marks what matters.
 *
 * Geometry is locked to the approved brand spec (viewBox 0 0 64 64):
 * arc `M45.5 19.5A15.5 15.5 0 1 0 45.5 44.5`, stroke-width 6.5, round caps;
 * dot at (46.5, 32), r 4.6. Colours come from design tokens only
 * (see Logo.css); the static-asset twin lives in public/favicon.svg.
 *
 * Variants:
 * - `auto` (default): arc follows the theme's primary text colour, so the
 *   mark sits correctly on light or dark themed surfaces (app shell).
 * - `onLight`: ink-navy arc, for light surfaces regardless of theme.
 * - `onDark`: warm-white arc, for navy/dark surfaces regardless of theme.
 * - `mono`: arc and dot both render in `currentColor`.
 */
export type LogoVariant = 'auto' | 'onLight' | 'onDark' | 'mono';

export interface LogoMarkProps {
  variant?: LogoVariant;
  /** Rendered width/height in px. */
  size?: number;
  className?: string;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ variant = 'auto', size = 32, className }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
    className={['cm-logo-svg', `cm-logo-svg--${variant}`, className].filter(Boolean).join(' ')}
  >
    <path
      className="cm-logo-arc"
      d="M45.5 19.5A15.5 15.5 0 1 0 45.5 44.5"
      fill="none"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    <circle className="cm-logo-dot" cx="46.5" cy="32" r="4.6" />
  </svg>
);

export interface LogoProps extends LogoMarkProps {
  /** Render the Fraunces wordmark next to the mark. */
  withWordmark?: boolean;
}

/**
 * Full lockup: mark + "CreditMate AI" wordmark (Fraunces, gold "AI").
 * The wordmark is real text, so the mark itself is decorative.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'auto',
  size = 32,
  withWordmark = true,
  className,
}) => (
  <span className={['cm-logo', className].filter(Boolean).join(' ')}>
    <LogoMark variant={variant} size={size} />
    {withWordmark ? (
      <span className="cm-logo-wordmark">
        CreditMate&nbsp;<span className="cm-logo-ai">AI</span>
      </span>
    ) : null}
  </span>
);

export default Logo;
