import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { CreditCard } from '../types';

import CardComparisonTable from './CardComparisonTable';

const createCard = (id: number): CreditCard => ({
  id,
  bankName: `Bank ${id}`,
  name: `Card ${id}`,
  annualFee: id * 1000,
  interestRateApr: 20,
  loungeAccessInternational: id === 1 ? '2 visits' : null,
  loungeAccessDomestic: '',
  cashAdvanceFee: '3%',
  latePaymentFee: 'BDT 500',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: '1 point per BDT 50',
  additionalFeatures: [`Feature ${id}`],
  sourceUrl: '',
  isActive: true,
  lastUpdated: null,
  images: [],
});

describe('CardComparisonTable', () => {
  it('renders mobile card stacks with collapsible, labeled comparison groups', async () => {
    render(<CardComparisonTable cards={[createCard(1), createCard(2)]} />);

    const mobileCards = screen.getAllByRole('article');
    expect(mobileCards).toHaveLength(2);
    expect(within(mobileCards[0]).getByRole('heading', { name: 'Card 1' })).toBeInTheDocument();

    expect(within(mobileCards[0]).getByText('Annual Fee')).toBeInTheDocument();
    expect(within(mobileCards[0]).getByText('BDT 1,000')).toBeInTheDocument();
    await userEvent.click(within(mobileCards[0]).getByText('Benefits'));
    expect(within(mobileCards[0]).getByText('1 point per BDT 50')).toBeInTheDocument();
  });

  it('keeps the accessible horizontal comparison table for tablet and desktop layouts', () => {
    render(<CardComparisonTable cards={[createCard(1), createCard(2)]} />);

    const region = screen.getByRole('region', { name: 'Compare card features' });
    expect(within(region).getByRole('table')).toBeInTheDocument();
    expect(within(region).getAllByRole('columnheader')).toHaveLength(3);
    expect(within(region).getByRole('rowheader', { name: 'Annual Fee' })).toBeInTheDocument();
  });

  it('renders five cards without dropping columns or mobile cards', () => {
    const cards = Array.from({ length: 5 }, (_, index) => createCard(index + 1));
    render(<CardComparisonTable cards={cards} />);

    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByRole('columnheader')).toHaveLength(6);
  });
});
