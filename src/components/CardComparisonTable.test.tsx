import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { LanguageProvider } from '../locales/LanguageContext';
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

const renderWithLanguage = (ui: React.ReactElement) => {
  return render(<LanguageProvider initialLang="en">{ui}</LanguageProvider>);
};

describe('CardComparisonTable', () => {
  it('renders mobile card stacks with collapsible, labeled comparison groups', async () => {
    renderWithLanguage(<CardComparisonTable cards={[createCard(1), createCard(2)]} />);

    const mobileCards = screen.getAllByRole('article');
    expect(mobileCards).toHaveLength(2);
    expect(within(mobileCards[0]).getByRole('heading', { name: 'Card 1' })).toBeInTheDocument();

    expect(within(mobileCards[0]).getByText('Annual fee')).toBeInTheDocument();
    expect(within(mobileCards[0]).getByText('BDT 1,000')).toBeInTheDocument();
    await userEvent.click(within(mobileCards[0]).getByText('Benefits'));
    expect(within(mobileCards[0]).getByText('1 point per BDT 50')).toBeInTheDocument();
  });

  it('keeps the accessible horizontal comparison table for tablet and desktop layouts', () => {
    renderWithLanguage(<CardComparisonTable cards={[createCard(1), createCard(2)]} />);

    expect(screen.getByRole('region', { name: 'Comparison insight' })).toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'Compare card features' });
    expect(within(region).getByRole('table')).toBeInTheDocument();
    expect(within(region).getAllByRole('columnheader')).toHaveLength(3);
    expect(within(region).getByRole('rowheader', { name: 'Annual fee' })).toBeInTheDocument();
    expect(within(region).getAllByRole('cell').length).toBeGreaterThan(2);
  });

  it('shows trust-field rows with Unknown for missing values in both layouts', () => {
    const known: CreditCard = {
      ...createCard(1),
      cardNetwork: 'visa',
      isIslamic: true,
      isDualCurrency: true,
      minMonthlyIncome: 50000,
      supplementaryCardFee: 'BDT 500',
      foreignTransactionFee: '3%',
    };
    const unknown: CreditCard = { ...createCard(2), isDualCurrency: null, minMonthlyIncome: null };
    renderWithLanguage(<CardComparisonTable cards={[known, unknown]} />);

    const region = screen.getByRole('region', { name: 'Compare card features' });
    const row = (label: string) =>
      within(within(region).getByRole('row', { name: name => name.startsWith(label) }));
    expect(row('Minimum Monthly Income').getByText('BDT 50,000')).toBeInTheDocument();
    expect(row('Minimum Monthly Income').getByText('Unknown')).toBeInTheDocument();
    expect(row('Dual Currency').getByText('Yes')).toBeInTheDocument();
    expect(row('Supplementary Card Fee').getByText('BDT 500')).toBeInTheDocument();
    expect(row('Foreign Transaction Fee').getByText('3%')).toBeInTheDocument();
    expect(row('Card Network').getByText('Visa')).toBeInTheDocument();

    const mobile = screen.getAllByRole('article')[0];
    expect(within(mobile).getByText('Foreign Transaction Fee')).toBeInTheDocument();
  });

  it('renders five cards without dropping columns or mobile cards', () => {
    const cards = Array.from({ length: 5 }, (_, index) => createCard(index + 1));
    renderWithLanguage(<CardComparisonTable cards={cards} />);

    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getAllByRole('columnheader')).toHaveLength(6);
  });
});

describe('long bank terms', () => {
  it('retains verbatim terms inside closed expanders in desktop and mobile cells', async () => {
    const text =
      'Complimentary Priority Pass; cardholders (primary & supplementary) max 8 free visits with total 8 guests per year to international lounges; USD 35 per visit beyond complimentary.';
    renderWithLanguage(
      <CardComparisonTable cards={[{ ...createCard(1), loungeAccessInternational: text }]} />
    );
    const desktop = screen.getByRole('region', { name: 'Compare card features' });
    expect(
      within(desktop).getByText('Complimentary Priority Pass: Up to 8 free visits/year')
    ).toBeVisible();
    expect(within(desktop).getByText(text)).not.toBeVisible();
    await userEvent.click(within(desktop).getByText('more'));
    expect(within(desktop).getByText(text)).toBeVisible();
    const mobile = screen.getByRole('article');
    await userEvent.click(within(mobile).getByText('Benefits'));
    expect(within(mobile).getByText(text)).not.toBeVisible();
    await userEvent.click(within(mobile).getByText('more'));
    expect(within(mobile).getByText(text)).toBeVisible();
  });

  it('uses Bengali expansion labels', () => {
    render(
      <LanguageProvider initialLang="bn">
        <CardComparisonTable
          cards={[{ ...createCard(1), cashAdvanceFee: 'Cash advance terms '.repeat(10) }]}
        />
      </LanguageProvider>
    );
    const desktop = screen.getByRole('region', { name: 'Compare card features' });
    expect(within(desktop).getByText('আরও')).toBeInTheDocument();
  });
});
