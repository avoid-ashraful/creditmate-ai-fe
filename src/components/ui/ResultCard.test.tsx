import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Money from './Money';
import ResultCard from './ResultCard';

const baseProps = {
  bankName: 'Dutch-Bangla Bank',
  productName: 'Nexus Platinum Card',
  detailHref: '/credit-cards/dbbl-nexus-platinum',
  heroValue: <Money value={3450} />,
  heroLabel: 'Estimated annual cost',
  supportingFacts: [
    { label: 'APR', value: '20%' },
    { label: 'Annual fee', value: <Money value={3000} /> },
  ],
};

describe('ResultCard', () => {
  it('renders the product title as a real link', () => {
    render(<ResultCard {...baseProps} />);
    const link = screen.getByRole('link', { name: 'Nexus Platinum Card' });
    expect(link).toHaveAttribute('href', '/credit-cards/dbbl-nexus-platinum');
    expect(screen.getByText('৳3,450')).toBeInTheDocument();
    expect(screen.getByText('Estimated annual cost')).toBeInTheDocument();
  });

  it('fires the shortlist toggle and reflects pressed state', async () => {
    const user = userEvent.setup();
    const onToggleShortlist = jest.fn();
    const { rerender } = render(
      <ResultCard {...baseProps} onToggleShortlist={onToggleShortlist} />
    );
    const button = screen.getByRole('button', { name: 'Add to shortlist' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(onToggleShortlist).toHaveBeenCalledTimes(1);

    rerender(<ResultCard {...baseProps} inShortlist onToggleShortlist={onToggleShortlist} />);
    expect(screen.getByRole('button', { name: 'In shortlist' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('toggles the details disclosure', async () => {
    const user = userEvent.setup();
    render(
      <ResultCard {...baseProps}>
        <p>Extra layer-two detail</p>
      </ResultCard>
    );
    const disclosure = screen.getByRole('button', { name: 'Details' });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Extra layer-two detail')).not.toBeInTheDocument();

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Extra layer-two detail')).toBeInTheDocument();

    await user.click(disclosure);
    expect(screen.queryByText('Extra layer-two detail')).not.toBeInTheDocument();
  });

  it('shows the Islamic badge only for Islamic products', () => {
    const { rerender } = render(<ResultCard {...baseProps} />);
    expect(screen.queryByText('Islamic')).not.toBeInTheDocument();
    rerender(<ResultCard {...baseProps} islamic />);
    expect(screen.getByText('Islamic')).toBeInTheDocument();
  });

  it('renders the trust chip slot', () => {
    render(<ResultCard {...baseProps} trustChip={<span>BB chart · Oct 2026 edition</span>} />);
    expect(screen.getByText('BB chart · Oct 2026 edition')).toBeInTheDocument();
  });
});
