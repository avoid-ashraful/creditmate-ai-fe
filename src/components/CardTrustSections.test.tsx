import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { LanguageProvider, formatLocalizedDate } from '../locales';
import { ApiError, cardHistoryClient } from '../services/cardHistory';
import { CreditCard } from '../types';

import { CardHistoryTimeline, CardProvenance } from './CardTrustSections';

let mockAuthStatus = 'anonymous';
jest.mock('../hooks/AuthProvider', () => ({
  ...jest.requireActual('../hooks/AuthProvider'),
  useAuth: () => ({ status: mockAuthStatus, user: null }),
}));

jest.mock('../services/cardHistory', () => ({
  ...jest.requireActual('../services/cardHistory'),
  cardHistoryClient: { getFieldHistory: jest.fn() },
}));

const mockGetFieldHistory = cardHistoryClient.getFieldHistory as jest.Mock;

const baseCard: CreditCard = {
  id: 1,
  name: 'Diners Club Emerald Credit Card',
  annualFee: 3500,
  interestRateApr: 24,
  loungeAccessInternational: null,
  loungeAccessDomestic: null,
  cashAdvanceFee: '',
  latePaymentFee: '',
  annualFeeWaiverPolicy: null,
  rewardPointsPolicy: '',
  additionalFeatures: [],
  sourceUrl: 'https://bank.example.com/schedule-of-charges.pdf',
  verificationStatus: 'verified',
  verifiedAt: new Date('2026-10-18T00:00:00Z'),
  isActive: true,
  lastUpdated: null,
  images: [],
};

const renderWithProviders = (ui: React.ReactElement, lang: 'en' | 'bn' = 'en') =>
  render(
    <LanguageProvider initialLang={lang}>
      <MemoryRouter>{ui}</MemoryRouter>
    </LanguageProvider>
  );

describe('CardProvenance', () => {
  it('shows status, source link and last verified date', () => {
    renderWithProviders(<CardProvenance card={baseCard} />);

    expect(screen.getByRole('heading', { name: 'Data source & verification' })).toBeInTheDocument();
    expect(screen.getByText('Verified against bank documents')).toBeInTheDocument();
    const source = screen.getByRole('link', {
      name: 'https://bank.example.com/schedule-of-charges.pdf',
    });
    expect(source).toHaveAttribute('href', 'https://bank.example.com/schedule-of-charges.pdf');
    expect(
      screen.getByText(formatLocalizedDate(baseCard.verifiedAt as Date, 'en'))
    ).toBeInTheDocument();
  });

  it('states missing provenance honestly instead of inventing it', () => {
    renderWithProviders(
      <CardProvenance
        card={{ ...baseCard, sourceUrl: '', verificationStatus: '', verifiedAt: null }}
      />
    );

    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(
      screen.getByText(/haven't recorded a public source for this card yet/)
    ).toBeInTheDocument();
    expect(
      screen.getByText('This card has not been through verification yet.')
    ).toBeInTheDocument();
  });

  it('renders the block in Bengali', () => {
    renderWithProviders(<CardProvenance card={baseCard} />, 'bn');
    expect(screen.getByRole('heading', { name: 'তথ্যের উৎস ও যাচাই' })).toBeInTheDocument();
    expect(screen.getByText('ব্যাংকের নথির সাথে যাচাইকৃত')).toBeInTheDocument();
  });

  it('renders a non-http(s) source as plain text, not a link', () => {
    renderWithProviders(
      <CardProvenance card={{ ...baseCard, sourceUrl: 'ftp://bank.example.com/charges.pdf' }} />
    );

    expect(screen.getByText('ftp://bank.example.com/charges.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

describe('CardHistoryTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthStatus = 'anonymous';
  });

  it('fetches and renders history for anonymous visitors (D1: public history)', async () => {
    mockGetFieldHistory.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          card_id: 1,
          field_name: 'annual_fee',
          old_value: '3000.00',
          new_value: '3500.00',
          created: '2026-11-03T20:34:10Z',
        },
      ],
    });

    renderWithProviders(<CardHistoryTimeline cardId={1} />);

    expect(mockGetFieldHistory).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Annual fee')).toBeInTheDocument();
    expect(screen.queryByText(/Log in to see/)).not.toBeInTheDocument();
  });

  it('renders friendly labels with formatted old and new values', async () => {
    mockAuthStatus = 'authenticated';
    mockGetFieldHistory.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 2,
          card_id: 1,
          field_name: 'interest_rate_apr',
          old_value: '25.00',
          new_value: '24.00',
          created: '2026-11-03T20:35:14Z',
        },
        {
          id: 1,
          card_id: 1,
          field_name: 'annual_fee',
          old_value: '3000.00',
          new_value: '3500.00',
          created: '2026-11-03T20:34:10Z',
        },
      ],
    });

    renderWithProviders(<CardHistoryTimeline cardId={1} />);

    expect(await screen.findByText('Interest rate (APR)')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('24%')).toBeInTheDocument();
    expect(screen.getByText('Annual fee')).toBeInTheDocument();
    expect(screen.getByText('BDT 3,000')).toBeInTheDocument();
    expect(screen.getByText('BDT 3,500')).toBeInTheDocument();
  });

  it('shows the calm empty state when nothing has changed yet', async () => {
    mockAuthStatus = 'authenticated';
    mockGetFieldHistory.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    renderWithProviders(<CardHistoryTimeline cardId={1} />);

    expect(await screen.findByText(/No recorded changes yet/)).toBeInTheDocument();
  });

  it('shows the error state when the server rejects the request', async () => {
    mockGetFieldHistory.mockRejectedValue(new ApiError({ status: 403, detail: 'Forbidden.' }));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(<CardHistoryTimeline cardId={1} />);

    expect(await screen.findByText(/couldn't load the change history/)).toBeInTheDocument();
    expect(screen.queryByText(/Log in to see/)).not.toBeInTheDocument();
    (console.error as jest.Mock).mockRestore();
  });

  it('shows an error state when the history cannot be loaded', async () => {
    mockAuthStatus = 'authenticated';
    mockGetFieldHistory.mockRejectedValue(new Error('network down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    renderWithProviders(<CardHistoryTimeline cardId={1} />);

    expect(await screen.findByText(/couldn't load the change history/)).toBeInTheDocument();
    (console.error as jest.Mock).mockRestore();
  });

  it('renders the empty state in Bengali', async () => {
    mockAuthStatus = 'authenticated';
    mockGetFieldHistory.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    renderWithProviders(<CardHistoryTimeline cardId={1} />, 'bn');

    expect(await screen.findByText(/এখনো কোনো পরিবর্তন রেকর্ড করা হয়নি/)).toBeInTheDocument();
  });
});
