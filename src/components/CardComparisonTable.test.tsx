import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { LanguageProvider } from '../locales/LanguageContext';
import { CreditCard } from '../types';

import CardComparisonTable, { filterToDiffering } from './CardComparisonTable';

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

describe('filterToDiffering (row-filtering logic)', () => {
  /** Whether a single row with these per-card values survives the filter. */
  const differs = (values: unknown[]): boolean =>
    filterToDiffering(['row'], values, (_row, value) => value).length === 1;

  it('treats repeated primitives as identical and mixed null/empty as different', () => {
    expect(differs([])).toBe(false);
    expect(differs([1000])).toBe(false);
    expect(differs([20, 20, 20])).toBe(false);
    expect(differs([null, null])).toBe(false);
    expect(differs(['3%', '3%'])).toBe(false);
    expect(differs([null, ''])).toBe(true);
    expect(differs([false, true])).toBe(true);
    expect(differs([1000, 1000, 0, 1000])).toBe(true);
  });

  it('uses reference identity for objects, like the table highlighting does', () => {
    const shared = { conditions: 'waived' };
    expect(differs([shared, shared])).toBe(false);
    expect(differs([shared, { conditions: 'waived' }])).toBe(true);
  });

  it('keeps only rows whose values differ across the cards', () => {
    interface Row {
      key: string;
      pick: (card: { fee: number; apr: number }) => unknown;
    }
    const rows: Row[] = [
      { key: 'fee', pick: card => card.fee },
      { key: 'apr', pick: card => card.apr },
    ];
    const pick = (row: Row, card: { fee: number; apr: number }) => row.pick(card);
    const cards = [
      { fee: 1000, apr: 20 },
      { fee: 0, apr: 20 },
      { fee: 500, apr: 20 },
    ];
    expect(filterToDiffering(rows, cards, pick).map(row => row.key)).toEqual(['fee']);
    expect(filterToDiffering(rows, [], pick)).toEqual([]);
    expect(filterToDiffering(rows, [{ fee: 1, apr: 1 }], pick)).toEqual([]);
  });
});

describe('differencesOnly', () => {
  const region = () => screen.getByRole('region', { name: 'Compare card features' });

  it('shows every feature row by default', () => {
    renderWithLanguage(<CardComparisonTable cards={[createCard(1), createCard(2)]} />);

    // 16 feature rows plus the header row.
    expect(within(region()).getAllByRole('row')).toHaveLength(17);
    expect(
      within(region()).getByRole('rowheader', { name: 'Interest Rate (APR)' })
    ).toBeInTheDocument();
  });

  it('hides rows where all cards agree and keeps differing rows highlighted', () => {
    renderWithLanguage(
      <CardComparisonTable cards={[createCard(1), createCard(2)]} differencesOnly />
    );

    // Annual fee differs (1000 vs 2000); APR, cash advance and late fees match.
    expect(within(region()).getByRole('rowheader', { name: 'Annual fee' })).toBeInTheDocument();
    expect(
      within(region()).queryByRole('rowheader', { name: 'Interest Rate (APR)' })
    ).not.toBeInTheDocument();
    expect(
      within(region()).queryByRole('rowheader', { name: 'Cash Advance Fee' })
    ).not.toBeInTheDocument();
    const feeRow = within(region()).getByRole('row', {
      name: name => name.startsWith('Annual fee'),
    });
    expect(feeRow).toHaveClass('highlight-difference');

    // The mobile stacks are filtered the same way.
    const mobile = screen.getAllByRole('article')[0];
    expect(within(mobile).getByText('Annual fee')).toBeInTheDocument();
    expect(within(mobile).queryByText('Interest Rate (APR)')).not.toBeInTheDocument();
  });

  it('filters correctly for three and four cards', () => {
    const three = [createCard(1), createCard(2), createCard(3)];
    const { unmount } = renderWithLanguage(<CardComparisonTable cards={three} differencesOnly />);
    expect(
      within(region()).queryByRole('rowheader', { name: 'Interest Rate (APR)' })
    ).not.toBeInTheDocument();
    expect(within(region()).getByRole('rowheader', { name: 'Annual fee' })).toBeInTheDocument();
    unmount();

    renderWithLanguage(<CardComparisonTable cards={[...three, createCard(4)]} differencesOnly />);
    expect(within(region()).getAllByRole('columnheader')).toHaveLength(5);
    expect(
      within(region()).queryByRole('rowheader', { name: 'Interest Rate (APR)' })
    ).not.toBeInTheDocument();
  });

  it('shows an explanatory note instead of a table when every row is identical', () => {
    const twin: CreditCard = { ...createCard(1), id: 2, name: 'Card 1 Twin' };
    renderWithLanguage(<CardComparisonTable cards={[createCard(1), twin]} differencesOnly />);

    expect(screen.getByText(/all features match/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('keeps the APR row when a null-APR Islamic card is compared with a null-APR non-Islamic card', () => {
    const islamic: CreditCard = { ...createCard(1), interestRateApr: null, isIslamic: true };
    const conventional: CreditCard = { ...createCard(2), interestRateApr: null };
    renderWithLanguage(<CardComparisonTable cards={[islamic, conventional]} differencesOnly />);

    // Both raw APRs are null, but the cells display different text, so the
    // row must survive the differences-only filter.
    const aprRow = within(region()).getByRole('row', {
      name: name => name.startsWith('Interest Rate (APR)'),
    });
    expect(within(aprRow).getByText('No interest (Islamic)')).toBeInTheDocument();
    expect(within(aprRow).getByText('Unknown')).toBeInTheDocument();
  });

  it('hides the APR row when both compared cards have a null non-Islamic APR', () => {
    const first: CreditCard = { ...createCard(1), interestRateApr: null };
    const second: CreditCard = { ...createCard(2), interestRateApr: null };
    renderWithLanguage(<CardComparisonTable cards={[first, second]} differencesOnly />);

    // The table still renders (annual fee differs); only the APR row is gone.
    expect(within(region()).getByRole('rowheader', { name: 'Annual fee' })).toBeInTheDocument();
    expect(
      within(region()).queryByRole('rowheader', { name: 'Interest Rate (APR)' })
    ).not.toBeInTheDocument();
  });

  it('shows the full table for a single card even with differencesOnly on', () => {
    renderWithLanguage(<CardComparisonTable cards={[createCard(1)]} differencesOnly />);

    expect(screen.queryByText(/all features match/)).not.toBeInTheDocument();
    // 16 feature rows plus the header row.
    expect(within(region()).getAllByRole('row')).toHaveLength(17);
    expect(
      within(region()).getByRole('rowheader', { name: 'Interest Rate (APR)' })
    ).toBeInTheDocument();
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
