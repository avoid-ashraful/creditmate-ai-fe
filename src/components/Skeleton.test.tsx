import { render, screen, within } from '@testing-library/react';
import React from 'react';

import { expectNoAxeViolations } from '../a11y/axe';

import { Skeleton, SkeletonCardGrid } from './Skeleton';

const TRUE_ATTR = 'true';

describe('Skeleton', () => {
  it('applies the requested size and is hidden from assistive technology', () => {
    render(<Skeleton width="70%" height="1rem" />);

    const block = screen.getByTestId('skeleton');
    expect(block).toHaveAttribute('aria-hidden', TRUE_ATTR);
    expect(block).toHaveStyle({ width: '70%', height: '1rem' });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Skeleton width="50%" height="1rem" />);
    await expectNoAxeViolations(container);
  });
});

describe('SkeletonCardGrid', () => {
  it('announces its label as a busy status region', () => {
    render(<SkeletonCardGrid label="Loading credit cards..." />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', TRUE_ATTR);
    expect(within(status).getByText('Loading credit cards...')).toBeInTheDocument();
  });

  it('renders the requested number of placeholder cards', () => {
    render(<SkeletonCardGrid label="Loading" count={3} />);

    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
  });

  it('hides the decorative placeholder blocks from assistive technology', () => {
    render(<SkeletonCardGrid label="Loading" count={2} />);

    const placeholders = screen.getAllByTestId('skeleton');
    expect(placeholders.length).toBeGreaterThan(0);
    placeholders.forEach(block => expect(block).toHaveAttribute('aria-hidden', TRUE_ATTR));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SkeletonCardGrid label="Loading cards..." count={3} />);
    await expectNoAxeViolations(container);
  });
});
