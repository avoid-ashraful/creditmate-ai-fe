/* eslint-disable testing-library/no-container, testing-library/no-node-access --
 * The mark is decorative SVG (aria-hidden by design), so Testing Library
 * role/text queries cannot reach it; the locked brand geometry can only be
 * asserted on the DOM nodes directly. Same precedent as
 * CardDetailPage.trust.test.tsx. */
import { render, screen } from '@testing-library/react';

import { Logo, LogoMark } from './Logo';

describe('Logo (Midnight Ledger)', () => {
  it('renders the locked brand geometry', () => {
    const { container } = render(<LogoMark />);
    const arc = container.querySelector('path.cm-logo-arc');
    expect(arc).not.toBeNull();
    expect(arc).toHaveAttribute('d', 'M45.5 19.5A15.5 15.5 0 1 0 45.5 44.5');
    expect(arc).toHaveAttribute('stroke-width', '6.5');
    const dot = container.querySelector('circle.cm-logo-dot');
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('cx', '46.5');
    expect(dot).toHaveAttribute('cy', '32');
    expect(dot).toHaveAttribute('r', '4.6');
  });

  it('defaults to the auto variant at 32px', () => {
    const { container } = render(<LogoMark />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('cm-logo-svg--auto');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('applies variant classes and size', () => {
    const { container } = render(<LogoMark variant="mono" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('cm-logo-svg--mono');
    expect(svg).toHaveAttribute('width', '24');
  });

  it('lockup renders the wordmark with a gold AI span', () => {
    render(<Logo />);
    expect(screen.getByText('CreditMate')).toBeInTheDocument();
    expect(screen.getByText('AI')).toHaveClass('cm-logo-ai');
  });

  it('lockup can render the mark alone', () => {
    const { container } = render(<Logo withWordmark={false} />);
    expect(screen.queryByText('CreditMate')).not.toBeInTheDocument();
    expect(container.querySelector('svg.cm-logo-svg')).not.toBeNull();
  });
});
