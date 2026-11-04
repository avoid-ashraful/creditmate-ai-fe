import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { LanguageProvider } from '../locales';
import { AccountProductDetail, getAccountProduct } from '../services/bankAccounts';

import AccountDetailPage from './AccountDetailPage';

jest.mock('../services/bankAccounts', () => {
  const actual = jest.requireActual('../services/bankAccounts');
  return { ...actual, getAccountProduct: jest.fn(), getAccountFieldHistory: jest.fn() };
});
jest.mock('../hooks/useSeoMeta', () => ({ useSeoMeta: jest.fn() }));
jest.mock('../hooks/AuthProvider', () => ({
  useAuth: () => ({ status: 'anonymous' }),
}));

const mockDetail = getAccountProduct as jest.Mock;

const detail: AccountProductDetail = {
  id: 101,
  slug: 'city-bank-plc-general-savings-account',
  name: 'General Savings Account',
  accountType: 'savings',
  bank: { id: 14, name: 'City Bank PLC' },
  variantOf: null,
  variantsCount: 1,
  segment: 'general',
  isIslamic: false,
  contractType: 'interest',
  rateType: 'interest',
  rateSlabs: [
    { balanceMin: 0, balanceMax: 100000, rate: 0, rateMax: null, isRange: false },
    { balanceMin: 100000, balanceMax: null, rate: 0.25, rateMax: null, isRange: false },
  ],
  interestBasis: 'unknown',
  interestPayoutFrequency: 'unknown',
  minBalanceToEarn: null,
  maintenanceFeeSlabs: [
    { balanceMin: 0, balanceMax: 10000, fee: 0 },
    { balanceMin: 10001, balanceMax: 25000, fee: 100 },
    { balanceMin: 25001, balanceMax: 200000, fee: 200 },
    { balanceMin: 200001, balanceMax: 1000000, fee: 250 },
    { balanceMin: 1000001, balanceMax: null, fee: 300 },
  ],
  debitCardFeeAnnual: 600,
  debitCardWaiverText: '',
  debitCardWaiverMinBalance: null,
  smsFeeAnnual: 300,
  onlineBankingFeeAnnual: 0,
  chequePerLeaf: 20,
  chequeFirstBookFree: false,
  closureFee: 200,
  feeDataComplete: true,
  feesIncludeVat: false,
  sourceSocUrl: 'https://www.citybankplc.com/upload/Retail-SOC-14-October-2025.pdf',
  sourceRateUrl: 'https://www.citybankplc.com/gsi/conventional-banking-products',
  socEffectiveDate: '2025-10-14',
  rateEffectiveDate: '2026-11-01',
  verifiedAt: '2026-11-04T12:00:00Z',
  variants: [
    {
      slug: 'city-bank-plc-city-alo-general-savings-account',
      name: 'City Alo General Savings Account',
      segment: 'women',
    },
  ],
  rateConditionsText: 'Pays no interest below Tk 1 lakh average balance.',
  withdrawalLimitForInterest: null,
  maintenanceWaiverText: '',
  debitCardFirstYearFee: null,
  debitCardReplacementFee: null,
  statementDuplicateFee: 100,
  balanceConfirmationExtraFee: 100,
  minBalanceRequired: null,
  openingDeposit: null,
  chequeBookAvailable: true,
  debitCardIncluded: true,
  dormancyTerms: '',
  eligibilityNotes: '',
  sourceKind: 'bank_soc',
  lastVerifiedAt: '2026-11-04T12:00:00Z',
  verificationStatus: 'verified',
};

const renderPage = () =>
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/accounts/city-bank-plc-general-savings-account']}>
        <Routes>
          <Route path="/accounts/:slug" element={<AccountDetailPage />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );

describe('AccountDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDetail.mockResolvedValue(detail);
  });

  it('renders the rate slabs as slabs, never a single headline rate', async () => {
    renderPage();
    expect(await screen.findByText('General Savings Account')).toBeInTheDocument();
    const tables = screen.getAllByRole('table');
    const slabRows = within(tables[0]).getAllByRole('row');
    // Header + both published slabs, with their balance bands.
    expect(slabRows).toHaveLength(3);
    expect(slabRows[1]).toHaveTextContent('0 – 100,000');
    expect(slabRows[1]).toHaveTextContent('0%');
    expect(slabRows[2]).toHaveTextContent('100,000 and above');
    expect(slabRows[2]).toHaveTextContent('0.25%');
    expect(screen.getByText(/Pays no interest below Tk 1 lakh/)).toBeInTheDocument();
  });

  it('renders the maintenance slab table by balance band', async () => {
    renderPage();
    await screen.findByText('General Savings Account');
    const tables = screen.getAllByRole('table');
    const maintRows = within(tables[1]).getAllByRole('row');
    expect(maintRows).toHaveLength(6); // header + 5 BB bands
    expect(maintRows[1]).toHaveTextContent('0 – 10,000');
    expect(maintRows[1]).toHaveTextContent('BDT 0.00');
    expect(maintRows[5]).toHaveTextContent('1,000,001 and above');
    expect(maintRows[5]).toHaveTextContent('BDT 300.00');
  });

  it('renders the fee table and provenance', async () => {
    renderPage();
    await screen.findByText('General Savings Account');
    expect(screen.getByText('Debit card (annual)')).toBeInTheDocument();
    expect(screen.getByText('SMS / transaction alerts (annual)')).toBeInTheDocument();
    expect(screen.getByText('BDT 600.00')).toBeInTheDocument();
    expect(screen.getByText('Charges effective')).toBeInTheDocument();
    expect(screen.getByText('2025-10-14')).toBeInTheDocument();
  });

  it('links the marketing variant as "also available as"', async () => {
    renderPage();
    await screen.findByText('General Savings Account');
    const link = screen.getByRole('link', { name: 'City Alo General Savings Account' });
    expect(link).toHaveAttribute(
      'href',
      '/accounts/city-bank-plc-city-alo-general-savings-account'
    );
  });

  it('says no debit card is included instead of "Not published" when none is bundled', async () => {
    mockDetail.mockResolvedValue({ ...detail, debitCardIncluded: false, debitCardFeeAnnual: null });
    renderPage();
    await screen.findByText('General Savings Account');
    const tables = screen.getAllByRole('table');
    const cardRow = within(tables[2]).getAllByRole('row')[0];
    expect(cardRow).toHaveTextContent('Debit card (annual)');
    expect(cardRow).toHaveTextContent('No debit card included');
    expect(cardRow).not.toHaveTextContent('Not published');
  });

  it('shows the history login prompt when signed out', async () => {
    renderPage();
    await screen.findByText('General Savings Account');
    expect(screen.getByText('Sign in to see this account’s change history.')).toBeInTheDocument();
  });

  it('shows an error state when the product cannot be loaded', async () => {
    mockDetail.mockRejectedValue(new Error('nope'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load this account product.'
    );
  });
});
